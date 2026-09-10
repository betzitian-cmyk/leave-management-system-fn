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
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function HRCreateEmployeePage() {
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

        // Handle departments response - check both formats
        if ('success' in deptResponse && deptResponse.success && deptResponse.data) {
          setDepartments(deptResponse.data);
        } else if (Array.isArray(deptResponse)) {
          setDepartments(deptResponse);
        }

        // Handle users response - check both formats
        if ('success' in usersResponse && usersResponse.success && usersResponse.data) {
          setUsers(usersResponse.data);
        } else if (Array.isArray(usersResponse)) {
          setUsers(usersResponse);
        }

        // Handle employees response - check both formats
        if ('success' in empResponse && empResponse.success && empResponse.data) {
          setEmployees(empResponse.data);
        } else if (Array.isArray(empResponse)) {
          setEmployees(empResponse);
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
        navigation.push('/dashboard/hr/employees');
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
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigation.push('/dashboard/hr/employees')}
          className="cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Employee Profile</h1>
          <p className="text-muted-foreground text-sm">
            Create an employee profile for a guest user
          </p>
        </div>
      </div>

      {/* Guest Users Alert */}
      {guestUsers.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <CardContent className="pt-6">
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
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
            <CardDescription>Fill in the employee details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* User Selection */}
            <div className="space-y-2">
              <Label htmlFor="userId">
                Select Guest User <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.userId || ''}
                onValueChange={(value) => setValue('userId', value)}
              >
                <SelectTrigger id="userId">
                  <SelectValue placeholder="Choose a guest user" />
                </SelectTrigger>
                <SelectContent>
                  {guestUsers.length === 0 ? (
                    <SelectItem value="no-users" disabled>
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
              {errors.userId && <p className="text-sm text-red-500">{errors.userId.message}</p>}
            </div>

            {/* Position */}
            <div className="space-y-2">
              <Label htmlFor="position">
                Position <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.position || ''}
                onValueChange={(value) =>
                  setValue('position', value as CreateEmployeeFormData['position'])
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
              {errors.position && <p className="text-sm text-red-500">{errors.position.message}</p>}
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="departmentId">
                Department <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.departmentId || ''}
                onValueChange={(value) => setValue('departmentId', value)}
              >
                <SelectTrigger id="departmentId">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.length === 0 ? (
                    <SelectItem value="no-departments" disabled>
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
                <p className="text-sm text-red-500">{errors.departmentId.message}</p>
              )}
            </div>

            {/* Hire Date */}
            <div className="space-y-2">
              <Label htmlFor="hireDate">Hire Date</Label>
              <Input id="hireDate" type="date" {...register('hireDate')} />
              {errors.hireDate && <p className="text-sm text-red-500">{errors.hireDate.message}</p>}
            </div>

            {/* Manager */}
            <div className="space-y-2">
              <Label htmlFor="managerId">Reporting Manager (Optional)</Label>
              <Select
                value={formData.managerId || 'no-manager'}
                onValueChange={(value) => setValue('managerId', value)}
              >
                <SelectTrigger id="managerId">
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-manager">No Manager</SelectItem>
                  {potentialManagers.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.user.firstName} {emp.user.lastName} ({emp.position})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.managerId && (
                <p className="text-sm text-red-500">{errors.managerId.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigation.push('/dashboard/hr/employees')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || guestUsers.length === 0}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Employee'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
