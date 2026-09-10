'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useNavigation } from '@/hooks/use-navigation';
import { employeesApi } from '@/lib/api/employees';
import type { Employee } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Loader2,
  Edit,
  ArrowLeft,
  User,
  Mail,
  Building2,
  Calendar,
  Briefcase,
  UserCog,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { FingerprintManagement } from '@/components/attendance/FingerprintManagement';

const InfoItem = ({
  icon: Icon,
  label,
  value,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | React.ReactNode;
  badge?: React.ReactNode;
}) => (
  <Card>
    <CardContent>
      <div className="flex items-start space-x-3">
        <Icon className="text-muted-foreground mt-0.5 h-5 w-5" />
        <div className="flex-1">
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
          <p className="mt-1 text-sm font-semibold">{value}</p>
          {badge && <div className="mt-2">{badge}</div>}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function EmployeeViewPage() {
  const params = useParams();
  const navigation = useNavigation();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  const employeeId = params.id as string;

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const response = await employeesApi.getEmployeeById(employeeId);
        console.log('Employee API Response:', response);

        // Handle both response formats: wrapped in ApiResponse or direct employee object
        if (response.success && response.data) {
          // Wrapped response
          setEmployee(response.data);
        } else if ('id' in response) {
          // Direct employee object
          setEmployee(response as unknown as Employee);
        } else {
          console.error('API returned unsuccessful response:', response);
          toast.error(response.message || 'Failed to load employee details');
        }
      } catch (err) {
        console.error('Error fetching employee:', err);
        toast.error('Failed to load employee details');
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) {
      fetchEmployee();
    }
  }, [employeeId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: 'default' | 'secondary' | 'outline' | 'destructive'; text: string }
    > = {
      ACTIVE: { variant: 'default', text: 'Active' },
      INACTIVE: { variant: 'secondary', text: 'Inactive' },
      ON_LEAVE: { variant: 'outline', text: 'On Leave' },
      TERMINATED: { variant: 'destructive', text: 'Terminated' },
    };

    const config = variants[status] || { variant: 'secondary', text: status };

    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const handleEdit = () => {
    navigation.push(`/dashboard/admin/employees/${employeeId}/edit`);
  };

  const handleBack = () => {
    navigation.push('/dashboard/admin/employees');
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={handleBack} className="cursor-pointer">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Employees
        </Button>
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-center">Employee not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
        <div className="flex items-start space-x-4">
          <Button variant="outline" size="icon" onClick={handleBack} className="cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-start space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={employee.user.profilePicture} alt={employee.user.firstName} />
              <AvatarFallback className="text-lg">
                {employee.user.firstName.charAt(0)}
                {employee.user.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {employee.user.firstName} {employee.user.lastName}
              </h1>
              <p className="text-muted-foreground">{employee.user.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline">{employee.position}</Badge>
                {getStatusBadge(employee.status)}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="cursor-pointer" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Employee
          </Button>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="overview" className="cursor-pointer">
            Overview
          </TabsTrigger>
          <TabsTrigger value="employment" className="cursor-pointer">
            Employment Details
          </TabsTrigger>
          <TabsTrigger value="reporting" className="cursor-pointer">
            Reporting Structure
          </TabsTrigger>
          <TabsTrigger value="fingerprint" className="cursor-pointer">
            Fingerprint
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              icon={User}
              label="Full Name"
              value={`${employee.user.firstName} ${employee.user.lastName}`}
            />
            <InfoItem icon={Mail} label="Email Address" value={employee.user.email} />
            <InfoItem icon={Briefcase} label="Position" value={employee.position} />
            <InfoItem icon={Building2} label="Department" value={employee.department.name} />
            <InfoItem icon={Calendar} label="Hire Date" value={formatDate(employee.hireDate)} />
            <InfoItem
              icon={UserCog}
              label="Status"
              value=""
              badge={getStatusBadge(employee.status)}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">First Name</p>
                  <p className="mt-1 text-sm font-semibold">{employee.user.firstName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Last Name</p>
                  <p className="mt-1 text-sm font-semibold">{employee.user.lastName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Email</p>
                  <p className="mt-1 text-sm font-semibold">{employee.user.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Employee ID</p>
                  <p className="mt-1 font-mono text-sm font-semibold">{employee.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employment Details Tab */}
        <TabsContent value="employment" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Position & Role
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Current Position</p>
                  <p className="mt-1 text-sm font-semibold">{employee.position}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Employment Status</p>
                  <div className="mt-1">{getStatusBadge(employee.status)}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Department
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Department Name</p>
                  <p className="mt-1 text-sm font-semibold">{employee.department.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Department ID</p>
                  <p className="mt-1 font-mono text-sm font-semibold">{employee.department.id}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Employment Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-muted flex flex-col items-center rounded-lg p-4">
                  <Calendar className="text-muted-foreground mb-2 h-8 w-8" />
                  <p className="text-sm font-medium">Hire Date</p>
                  <p className="mt-1 text-lg font-bold">{formatDate(employee.hireDate)}</p>
                </div>
                <div className="bg-muted flex flex-col items-center rounded-lg p-4">
                  <Clock className="text-muted-foreground mb-2 h-8 w-8" />
                  <p className="text-sm font-medium">Time with Company</p>
                  <p className="mt-1 text-lg font-bold">
                    {Math.floor(
                      (new Date().getTime() - new Date(employee.hireDate).getTime()) /
                        (1000 * 60 * 60 * 24 * 365)
                    )}{' '}
                    years
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reporting Structure Tab */}
        <TabsContent value="reporting" className="space-y-6">
          {employee.manager?.user ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoItem
                icon={UserCog}
                label="Reports To"
                value={`${employee.manager.user.firstName} ${employee.manager.user.lastName}`}
              />
              <InfoItem
                icon={Building2}
                label="Manager's Department"
                value={employee.department.name}
              />
              <InfoItem icon={Briefcase} label="Manager ID" value={employee.manager.id} />
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <UserCog className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <p className="text-muted-foreground">No manager assigned</p>
                <p className="text-muted-foreground mt-2 text-sm">
                  This employee does not have a direct manager assigned yet.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organizational Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Department</p>
                <p className="mt-1 text-sm font-semibold">{employee.department.name}</p>
              </div>
              {employee.manager?.user && (
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Direct Manager</p>
                  <p className="mt-1 text-sm font-semibold">
                    {employee.manager.user.firstName} {employee.manager.user.lastName}
                  </p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground text-sm font-medium">Position Level</p>
                <p className="mt-1 text-sm font-semibold">{employee.position}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fingerprint Management Tab */}
        <TabsContent value="fingerprint" className="space-y-6">
          <FingerprintManagement
            employeeId={employee.id}
            employeeName={`${employee.user.firstName} ${employee.user.lastName}`}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
