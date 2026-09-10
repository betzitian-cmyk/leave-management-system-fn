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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateDepartmentPage() {
  const navigation = useNavigation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateDepartmentFormData>({
    resolver: zodResolver(createDepartmentSchema),
    defaultValues: {
      name: '',
      description: '',
      managerId: '',
    },
  });

  const formData = watch();

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await employeesApi.getAllEmployees();

        // Handle both response formats
        if (response.success && response.data) {
          setEmployees(response.data);
        } else if (Array.isArray(response)) {
          setEmployees(response as unknown as Employee[]);
        }
      } catch (err) {
        console.error('Error fetching employees:', err);
        toast.error('Failed to load employees');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const onSubmit = async (data: CreateDepartmentFormData) => {
    setSubmitting(true);
    try {
      const submitData = {
        ...data,
        managerId: data.managerId === 'no-manager' || !data.managerId ? undefined : data.managerId,
      };

      const response = await departmentsApi.createDepartment(submitData);
      if (response.success || 'id' in response) {
        toast.success('Department created successfully');
        navigation.push('/dashboard/admin/departments');
      } else {
        toast.error(response.message || 'Failed to create department');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create department';
      toast.error(errorMessage);
      console.error('Error creating department:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Get potential managers (employees with manager positions)
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
        <h1 className="text-2xl font-bold tracking-tight">Create Department</h1>
        <p className="text-muted-foreground">Add a new department to your organization</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Department Information
            </CardTitle>
            <CardDescription>Basic department details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Department Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Engineering, Marketing, Sales"
                {...register('name')}
              />
              {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
              <p className="text-muted-foreground text-xs">The official name of the department</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter department description..."
                rows={4}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-destructive text-sm">{errors.description.message}</p>
              )}
              <p className="text-muted-foreground text-xs">
                A brief description of the department&apos;s purpose and responsibilities
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="managerId">Department Manager (Optional)</Label>
              <Select
                value={formData.managerId || 'no-manager'}
                onValueChange={(value) =>
                  setValue('managerId', value === 'no-manager' ? '' : value)
                }
              >
                <SelectTrigger id="managerId">
                  <SelectValue placeholder="Select a manager" />
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
                        {emp.user.firstName} {emp.user.lastName} - {emp.position}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.managerId && (
                <p className="text-destructive text-sm">{errors.managerId.message}</p>
              )}
              <p className="text-muted-foreground text-xs">
                The employee who will manage this department
              </p>
            </div>

            <div className="bg-muted rounded-md p-4">
              <h4 className="mb-2 text-sm font-medium">What happens next?</h4>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>• Department will be created in the system</li>
                <li>• Employees can be assigned to this department</li>
                <li>• Department manager can oversee department activities</li>
                <li>• Department can be edited or deleted later</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigation.push('/dashboard/admin/departments')}
            disabled={submitting}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} className="cursor-pointer">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Building2 className="mr-2 h-4 w-4" />
                Create Department
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
