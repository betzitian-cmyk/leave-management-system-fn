'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useNavigation } from '@/hooks/use-navigation';
import { departmentsApi } from '@/lib/api/departments';
import type { Department } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Building2,
  Users,
  UserCheck,
  Mail,
  Briefcase,
  Calendar,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function DepartmentDetailPage() {
  const params = useParams();
  const navigation = useNavigation();
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDepartment = async () => {
    try {
      setLoading(true);
      const response = await departmentsApi.getDepartmentById(params.id as string);

      let deptData: Department | null = null;
      if (response.success && response.data) {
        deptData = response.data;
      } else if ('id' in response && 'name' in response) {
        deptData = response as unknown as Department;
      }

      if (deptData) {
        setDepartment(deptData);
      } else {
        toast.error('Department not found');
        navigation.push('/dashboard/hr/departments');
      }
    } catch (err) {
      console.error('Error fetching department:', err);
      toast.error('Failed to fetch department details');
      navigation.push('/dashboard/hr/departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchDepartment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!department) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigation.push('/dashboard/hr/departments')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{department.name}</h1>
            <p className="text-muted-foreground mt-1">Department details and team members</p>
          </div>
        </div>
        <Button onClick={() => navigation.push(`/dashboard/hr/departments`)}>
          Back to Departments
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{department.employees?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Department Manager</CardTitle>
            <UserCheck className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {department.manager ? (
                <p className="font-medium">
                  {department.manager.user.firstName} {department.manager.user.lastName}
                </p>
              ) : (
                <p className="text-muted-foreground">No manager assigned</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {department.employees?.filter((emp) => emp.user.isActive).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Information */}
      <Card>
        <CardHeader>
          <CardTitle>Department Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm">Department Name</span>
              </div>
              <p className="font-medium">{department.name}</p>
            </div>

            {department.manager && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground text-sm">Manager</span>
                </div>
                <p className="font-medium">
                  {department.manager.user.firstName} {department.manager.user.lastName}
                </p>
              </div>
            )}

            {department.createdAt && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground text-sm">Created</span>
                </div>
                <p className="font-medium">{formatDate(department.createdAt)}</p>
              </div>
            )}

            {department.updatedAt && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground text-sm">Last Updated</span>
                </div>
                <p className="font-medium">{formatDate(department.updatedAt)}</p>
              </div>
            )}
          </div>

          {department.description && (
            <div className="space-y-2">
              <span className="text-muted-foreground text-sm">Description</span>
              <p className="text-foreground">{department.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members ({department.employees?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!department.employees || department.employees.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center">
              <Users className="text-muted-foreground mb-2 h-8 w-8" />
              <p className="text-muted-foreground text-sm">No employees in this department</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Hire Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {department.employees.map((employee) => (
                        <TableRow
                          key={employee.id}
                          className="hover:bg-muted/50 cursor-pointer"
                          onClick={() => navigation.push(`/dashboard/hr/employees/${employee.id}`)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={employee.user.profilePicture || undefined} />
                                <AvatarFallback>
                                  {employee.user.firstName[0]}
                                  {employee.user.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {employee.user.firstName} {employee.user.lastName}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Briefcase className="text-muted-foreground h-4 w-4" />
                              {employee.position}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail className="text-muted-foreground h-4 w-4" />
                              {employee.user.email}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(employee.hireDate)}</TableCell>
                          <TableCell>
                            <Badge variant={employee.user.isActive ? 'default' : 'secondary'}>
                              {employee.user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="space-y-4 md:hidden">
                {department.employees.map((employee) => (
                  <Card
                    key={employee.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigation.push(`/dashboard/hr/employees/${employee.id}`)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={employee.user.profilePicture || undefined} />
                          <AvatarFallback>
                            {employee.user.firstName[0]}
                            {employee.user.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div>
                            <p className="font-medium">
                              {employee.user.firstName} {employee.user.lastName}
                            </p>
                            <p className="text-muted-foreground text-sm">{employee.position}</p>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p className="text-muted-foreground">{employee.user.email}</p>
                            <p className="text-muted-foreground">
                              Hired: {formatDate(employee.hireDate)}
                            </p>
                          </div>
                          <Badge variant={employee.user.isActive ? 'default' : 'secondary'}>
                            {employee.user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
