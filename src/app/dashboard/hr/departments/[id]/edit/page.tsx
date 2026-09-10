'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useNavigation } from '@/hooks/use-navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { departmentsApi } from '@/lib/api/departments';
import { employeesApi } from '@/lib/api/employees';
import { updateDepartmentSchema, type UpdateDepartmentFormData } from '@/schemas/department';
import type { Department, Employee } from '@/types';
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
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function HREditDepartmentPage() {
  const params = useParams();
  const navigation = useNavigation();
  const [department, setDepartment] = useState<Department | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const departmentId = params?.id as string;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UpdateDepartmentFormData>({
    resolver: zodResolver(updateDepartmentSchema),
  });

  useEffect(() => {
    if (departmentId) {
      fetchDepartment();
      fetchEmployees();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId]);

  const fetchDepartment = async () => {
    try {
      setLoading(true);
      const response = await departmentsApi.getDepartmentById(departmentId);

      let deptData: Department | null = null;
      if (response.success && response.data) {
        deptData = response.data;
      } else if ('id' in response && 'name' in response && typeof response.id === 'string') {
        deptData = response as unknown as Department;
      }

      if (deptData) {
        setDepartment(deptData);
        reset({
          name: deptData.name,
          description: deptData.description || '',
          managerId: deptData.managerId || '',
        });
      } else {
        toast.error('Department not found');
        navigation.push('/dashboard/hr/departments');
      }
    } catch (err) {
      console.error('Error fetching department:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to fetch department');
      navigation.push('/dashboard/hr/departments');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeesApi.getAllEmployees();

      if (Array.isArray(response)) {
        setEmployees(response);
      } else if (response.success && response.data) {
        setEmployees(response.data);
      } else if ('data' in response && Array.isArray(response.data)) {
        setEmployees(response.data);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const onSubmit = async (data: UpdateDepartmentFormData) => {
    try {
      setSubmitting(true);

      const payload = {
        name: data.name,
        description: data.description || undefined,
        managerId: data.managerId || undefined,
      };

      await departmentsApi.updateDepartment(departmentId, payload);
      toast.success('Department updated successfully');
      navigation.push('/dashboard/hr/departments');
    } catch (error) {
      console.error('Error updating department:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update department');
    } finally {
      setSubmitting(false);
    }
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigation.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Department</h1>
          <p className="text-muted-foreground mt-1">Update department information</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Department Information</CardTitle>
            <CardDescription>Update the details for {department.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Department Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Department Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Engineering, Marketing, Sales"
                {...register('name')}
              />
              {errors.name && (
                <div className="text-destructive flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.name.message}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the department's responsibilities..."
                rows={4}
                {...register('description')}
              />
              {errors.description && (
                <div className="text-destructive flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.description.message}</span>
                </div>
              )}
            </div>

            {/* Manager */}
            <div className="space-y-2">
              <Label htmlFor="managerId">Department Manager</Label>
              <Select
                defaultValue={department.managerId || 'none'}
                onValueChange={(value) => setValue('managerId', value === 'none' ? '' : value)}
              >
                <SelectTrigger id="managerId">
                  <SelectValue placeholder="Select a manager (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Manager</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.user.firstName} {employee.user.lastName} - {employee.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.managerId && (
                <div className="text-destructive flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.managerId.message}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigation.back()}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
