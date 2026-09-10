'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useNavigation } from '@/hooks/use-navigation';
import { departmentsApi } from '@/lib/api/departments';
import type { Department } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  Edit,
  ArrowLeft,
  Building2,
  Users,
  UserCog,
  FileText,
  Trash2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const InfoItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | React.ReactNode;
}) => (
  <Card>
    <CardContent>
      <div className="flex items-start space-x-3">
        <Icon className="text-muted-foreground mt-0.5 h-5 w-5" />
        <div className="flex-1">
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
          <p className="mt-1 text-sm font-semibold">{value}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function DepartmentViewPage() {
  const params = useParams();
  const navigation = useNavigation();
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const departmentId = params.id as string;

  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        setLoading(true);
        const response = await departmentsApi.getDepartmentById(departmentId);
        console.log('Department API Response:', response);

        // Handle both response formats
        if (response.success && response.data) {
          setDepartment(response.data);
        } else if ('id' in response) {
          setDepartment(response as unknown as Department);
        } else {
          console.error('API returned unsuccessful response:', response);
          toast.error(response.message || 'Failed to load department details');
        }
      } catch (err) {
        console.error('Error fetching department:', err);
        toast.error('Failed to load department details');
      } finally {
        setLoading(false);
      }
    };

    if (departmentId) {
      fetchDepartment();
    }
  }, [departmentId]);

  const handleEdit = () => {
    navigation.push(`/dashboard/admin/departments/${departmentId}/edit`);
  };

  const handleBack = () => {
    navigation.push('/dashboard/admin/departments');
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!department) return;

    setDeleting(true);
    try {
      const response = await departmentsApi.deleteDepartment(department.id);
      if (response.success || response === null) {
        toast.success('Department deleted successfully');
        navigation.push('/dashboard/admin/departments');
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error('Failed to delete department');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!department) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={handleBack} className="cursor-pointer">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Departments
        </Button>
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-center">Department not found</p>
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
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{department.name}</h1>
            <p className="text-muted-foreground">
              {department.description || 'No description available'}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                {department.employees?.length || 0} employees
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="cursor-pointer" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Department
          </Button>
          <Button size="sm" variant="destructive" className="cursor-pointer" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Department
          </Button>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="cursor-pointer">
            Overview
          </TabsTrigger>
          <TabsTrigger value="employees" className="cursor-pointer">
            Employees
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem icon={Building2} label="Department Name" value={department.name} />
            <InfoItem
              icon={UserCog}
              label="Manager"
              value={
                department.manager?.user
                  ? `${department.manager.user.firstName} ${department.manager.user.lastName}`
                  : 'No manager assigned'
              }
            />
            <InfoItem
              icon={Users}
              label="Total Employees"
              value={`${department.employees?.length || 0} employees`}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {department.description || 'No description provided for this department.'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Department Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Department ID</p>
                  <p className="mt-1 font-mono text-sm font-semibold">{department.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Manager</p>
                  <p className="mt-1 text-sm font-semibold">
                    {department.manager?.user
                      ? `${department.manager.user.firstName} ${department.manager.user.lastName}`
                      : 'Not assigned'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Employee Count</p>
                  <p className="mt-1 text-sm font-semibold">{department.employees?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Department Employees ({department.employees?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!department.employees || department.employees.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">
                  <Users className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                  <p>No employees assigned to this department yet.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {department.employees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">
                            {employee.user.firstName} {employee.user.lastName}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {employee.user.email}
                          </TableCell>
                          <TableCell>{employee.position}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                employee.status === 'ACTIVE'
                                  ? 'default'
                                  : employee.status === 'ON_LEAVE'
                                    ? 'outline'
                                    : 'secondary'
                              }
                            >
                              {employee.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the department &quot;{department.name}&quot;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
              className="cursor-pointer"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deleting ? 'Deleting...' : 'Delete Department'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
