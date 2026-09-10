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
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function EditDepartmentPage() {
  const params = useParams();
  const navigation = useNavigation();
  const [department, setDepartment] = useState<Department | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateDepartmentFormData>({
    resolver: zodResolver(updateDepartmentSchema),
    defaultValues: {
      name: '',
      description: '',
      managerId: '',
    },
  });

  const formData = watch();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [deptResponse, empResponse] = await Promise.all([
          departmentsApi.getDepartmentById(params.id as string),
          employeesApi.getAllEmployees(),
        ]);

        // Handle department response
        let departmentData: Department | null = null;
        if (deptResponse.success && deptResponse.data) {
          departmentData = deptResponse.data;
        } else if ('id' in deptResponse) {
          departmentData = deptResponse as unknown as Department;
        }

        if (departmentData) {
          setDepartment(departmentData);
          setValue('name', departmentData.name);
          setValue('description', departmentData.description || '');
          setValue('managerId', departmentData.managerId || '');
        }

        // Handle employees response
        if (empResponse.success && empResponse.data) {
          setEmployees(empResponse.data);
        } else if (Array.isArray(empResponse)) {
          setEmployees(empResponse as unknown as Employee[]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Failed to load department data');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id, setValue]);

  const onSubmit = async (data: UpdateDepartmentFormData) => {
    setSaving(true);
    try {
      const submitData = {
        ...data,
        managerId: data.managerId === 'no-manager' || !data.managerId ? undefined : data.managerId,
      };

      const response = await departmentsApi.updateDepartment(params.id as string, submitData);
      if (response.success || 'id' in response) {
        toast.success('Department updated successfully');
        navigation.push('/dashboard/admin/departments');
      }
    } catch (error) {
      console.error('Error updating department:', error);
      toast.error('Failed to update department');
    } finally {
      setSaving(false);
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

  if (!department) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          onClick={() => navigation.push('/dashboard/admin/departments')}
          className="cursor-pointer"
        >
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigation.push('/dashboard/admin/departments')}
              className="cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-3xl font-bold tracking-tight">Edit Department</h2>
          </div>
          <p className="text-muted-foreground">
            Update department information for {department.name}
          </p>
        </div>
        <Button onClick={handleSubmit(onSubmit)} disabled={saving} className="cursor-pointer">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department Information</CardTitle>
          <CardDescription>Update department details</CardDescription>
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
              onValueChange={(value) => setValue('managerId', value === 'no-manager' ? '' : value)}
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
            <h4 className="mb-2 text-sm font-medium">Current Information</h4>
            <div className="text-muted-foreground space-y-1 text-sm">
              <p>
                <strong>Current Name:</strong> {department.name}
              </p>
              <p>
                <strong>Current Manager:</strong>{' '}
                {department.manager?.user
                  ? `${department.manager.user.firstName} ${department.manager.user.lastName}`
                  : 'Not assigned'}
              </p>
              <p>
                <strong>Employee Count:</strong> {department.employees?.length || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
