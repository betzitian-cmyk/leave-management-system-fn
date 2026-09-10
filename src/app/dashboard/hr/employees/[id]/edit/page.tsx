'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useNavigation } from '@/hooks/use-navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { employeesApi } from '@/lib/api/employees';
import { departmentsApi } from '@/lib/api/departments';
import { updateEmployeeSchema, type UpdateEmployeeFormData } from '@/schemas/employee';
import type { Employee, Department } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function HREditEmployeePage() {
  const params = useParams();
  const navigation = useNavigation();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<UpdateEmployeeFormData>({
    resolver: zodResolver(updateEmployeeSchema),
  });

  const formData = watch();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [empResponse, deptResponse, allEmpResponse] = await Promise.all([
          employeesApi.getEmployeeById(params.id as string),
          departmentsApi.getAllDepartments(),
          employeesApi.getAllEmployees(),
        ]);

        let employeeData: Employee | null = null;
        if (empResponse.success && empResponse.data) {
          employeeData = empResponse.data;
        } else if ('id' in empResponse) {
          employeeData = empResponse as unknown as Employee;
        }

        if (employeeData) {
          setEmployee(employeeData);
          reset({
            position: employeeData.position as 'EMPLOYEE' | 'MANAGER' | 'HR_MANAGER' | 'ADMIN',
            departmentId: employeeData.department.id,
            managerId: employeeData.manager?.id || '',
            status: employeeData.status as 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED',
          });
        }

        if (deptResponse.success && deptResponse.data) {
          setDepartments(deptResponse.data);
        } else if (Array.isArray(deptResponse)) {
          setDepartments(deptResponse as unknown as Department[]);
        }

        if (allEmpResponse.success && allEmpResponse.data) {
          setEmployees(allEmpResponse.data);
        } else if (Array.isArray(allEmpResponse)) {
          setEmployees(allEmpResponse as unknown as Employee[]);
        }
      } catch (err) {
        setError('Failed to fetch employee');
        console.error('Error fetching employee:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id, reset]);

  const onSubmit = async (data: UpdateEmployeeFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      await employeesApi.updateEmployee(params.id as string, {
        ...data,
        managerId: data.managerId === 'no-manager' || !data.managerId ? undefined : data.managerId,
      });

      navigation.push('/dashboard/hr/employees');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update employee';
      setError(errorMessage);
      console.error('Error updating employee:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const potentialManagers = employees.filter(
    (emp) => emp.id !== params.id && ['MANAGER', 'HR_MANAGER', 'ADMIN'].includes(emp.position)
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-destructive">{error || 'Employee not found'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Employee</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive rounded-md p-3">{error}</div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <div className="text-sm">
                  {employee.user.firstName} {employee.user.lastName}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <div className="text-muted-foreground text-sm">{employee.user.email}</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position *</Label>
                <Select
                  value={formData.position || ''}
                  onValueChange={(value) =>
                    setValue('position', value as UpdateEmployeeFormData['position'])
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status || ''}
                  onValueChange={(value) =>
                    setValue('status', value as UpdateEmployeeFormData['status'])
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                    <SelectItem value="TERMINATED">Terminated</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-destructive text-sm">{errors.status.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="departmentId">Department *</Label>
                <Select
                  value={formData.departmentId || ''}
                  onValueChange={(value) => setValue('departmentId', value)}
                >
                  <SelectTrigger id="departmentId">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.departmentId && (
                  <p className="text-destructive text-sm">{errors.departmentId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="managerId">Reporting Manager</Label>
                <Select
                  value={formData.managerId || 'no-manager'}
                  onValueChange={(value) => setValue('managerId', value)}
                >
                  <SelectTrigger id="managerId">
                    <SelectValue placeholder="Select manager" />
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
                  <p className="text-destructive text-sm">{errors.managerId.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigation.push('/dashboard/hr/employees')}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Employee'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
