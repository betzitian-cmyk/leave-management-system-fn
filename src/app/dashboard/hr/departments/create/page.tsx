'use client';

import { useState, useEffect } from 'react';
import { useNavigation } from '@/hooks/use-navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { departmentsApi } from '@/lib/api/departments';
import { employeesApi } from '@/lib/api/employees';
import { createDepartmentSchema, type CreateDepartmentFormData } from '@/schemas/department';
import type { Employee } from '@/types';
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

export default function HRCreateDepartmentPage() {
  const navigation = useNavigation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateDepartmentFormData>({
    resolver: zodResolver(createDepartmentSchema),
    defaultValues: {
      name: '',
      description: '',
      managerId: '',
    },
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
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
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CreateDepartmentFormData) => {
    try {
      setSubmitting(true);

      const payload = {
        name: data.name,
        description: data.description || undefined,
        managerId: data.managerId || undefined,
      };

      await departmentsApi.createDepartment(payload);
      toast.success('Department created successfully');
      navigation.push('/dashboard/hr/departments');
    } catch (error) {
      console.error('Error creating department:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create department');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigation.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Department</h1>
          <p className="text-muted-foreground mt-1">Add a new department to your organization</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Department Information</CardTitle>
            <CardDescription>Fill in the details for the new department</CardDescription>
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
                    Creating...
                  </>
                ) : (
                  'Create Department'
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
