'use client';

import { useState, useEffect } from 'react';
import { useNavigation } from '@/hooks/use-navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { employeesApi } from '@/lib/api/employees';
import { departmentsApi } from '@/lib/api/departments';
import { usersApi } from '@/lib/api/users';
import { createEmployeeSchema, type CreateEmployeeFormData } from '@/schemas/employee';
import type { Department, UserListItem, Employee } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { UserPlus, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateEmployeePage() {
  const navigation = useNavigation();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateEmployeeFormData>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      userId: '',
      position: 'EMPLOYEE',
      departmentId: '',
      hireDate: new Date().toISOString().split('T')[0],
      managerId: '',
    },
  });

  const formData = watch();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [deptResponse, usersResponse, empResponse] = await Promise.all([
          departmentsApi.getAllDepartments(),
          usersApi.getAllUsers(),
          employeesApi.getAllEmployees(),
        ]);

        if (deptResponse.success && deptResponse.data) {
          setDepartments(deptResponse.data);
        }

        if (usersResponse.success && usersResponse.data) {
          setUsers(usersResponse.data);
        }

        if (empResponse.success && empResponse.data) {
          setEmployees(empResponse.data);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const onSubmit = async (data: CreateEmployeeFormData) => {
    setSubmitting(true);
    try {
      const submitData = {
        ...data,
        managerId: data.managerId === 'no-manager' || !data.managerId ? undefined : data.managerId,
      };
      const response = await employeesApi.createEmployee(submitData);
      if (response.success) {
        toast.success('Employee profile created successfully');
        navigation.push('/dashboard/admin/employees');
      } else {
        toast.error(response.message || 'Failed to create employee profile');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create employee profile';
      toast.error(errorMessage);
      console.error('Error creating employee:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Get guest users (users without employee profiles)
  const guestUsers = users.filter((user) => user.role === 'GUEST' && !user.hasEmployeeRecord);

  // Get managers for dropdown (employees who can be managers)
  const potentialManagers = employees.filter((emp) =>
    ['MANAGER', 'HR_MANAGER', 'ADMIN'].includes(emp.position)
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Employee Profile</h1>
        <p className="text-muted-foreground">
          Create an employee profile for a guest user and assign them to a department
        </p>
      </div>

      {/* Guest Users Alert */}
      {guestUsers.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                No guest users available. All users already have employee profiles.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* User & Position */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                User & Position
              </CardTitle>
              <CardDescription>Select the user and assign their position</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userId">Select User (Guest) *</Label>
                <Select
                  value={formData.userId}
                  onValueChange={(value) => setValue('userId', value)}
                >
                  <SelectTrigger id="userId">
                    <SelectValue placeholder="Select a guest user" />
                  </SelectTrigger>
                  <SelectContent>
                    {guestUsers.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No guest users available
                      </SelectItem>
                    ) : (
                      guestUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.userId && (
                  <p className="text-destructive text-sm">{errors.userId.message}</p>
                )}
                <p className="text-muted-foreground text-xs">
                  Only users with GUEST role and no employee profile are shown
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position *</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value) =>
                    setValue('position', value as 'EMPLOYEE' | 'MANAGER' | 'HR_MANAGER' | 'ADMIN')
                  }
                >
                  <SelectTrigger id="position">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="HR_MANAGER">HR Manager</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
                {errors.position && (
                  <p className="text-destructive text-sm">{errors.position.message}</p>
                )}
                <p className="text-muted-foreground text-xs">
                  The user&apos;s role will be updated to EMPLOYEE after profile creation
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hireDate">Hire Date</Label>
                <Input
                  id="hireDate"
                  type="date"
                  {...register('hireDate')}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.hireDate && (
                  <p className="text-destructive text-sm">{errors.hireDate.message}</p>
                )}
                <p className="text-muted-foreground text-xs">
                  Date when the employee joined the organization
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Department & Manager */}
          <Card>
            <CardHeader>
              <CardTitle>Department & Reporting</CardTitle>
              <CardDescription>Assign department and reporting manager</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="departmentId">Department *</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) => setValue('departmentId', value)}
                >
                  <SelectTrigger id="departmentId">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No departments available
                      </SelectItem>
                    ) : (
                      departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.departmentId && (
                  <p className="text-destructive text-sm">{errors.departmentId.message}</p>
                )}
                <p className="text-muted-foreground text-xs">
                  The department this employee will belong to
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="managerId">Manager (Optional)</Label>
                <Select
                  value={formData.managerId || 'no-manager'}
                  onValueChange={(value) =>
                    setValue('managerId', value === 'no-manager' ? '' : value)
                  }
                >
                  <SelectTrigger id="managerId">
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-manager">No Manager</SelectItem>
                    {potentialManagers.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No managers available
                      </SelectItem>
                    ) : (
                      potentialManagers.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.user.firstName} {emp.user.lastName} - {emp.department.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.managerId && (
                  <p className="text-destructive text-sm">{errors.managerId.message}</p>
                )}
                <p className="text-muted-foreground text-xs">
                  The direct manager this employee will report to
                </p>
              </div>

              <div className="bg-muted rounded-md p-4">
                <h4 className="mb-2 text-sm font-medium">What happens next?</h4>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>• Employee profile will be created</li>
                  <li>• User role will be upgraded from GUEST to EMPLOYEE</li>
                  <li>• Employee will receive a notification email</li>
                  <li>• Employee can access their dashboard immediately</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigation.push('/dashboard/admin/employees')}
            disabled={submitting}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting || guestUsers.length === 0}
            className="cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Employee Profile
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
