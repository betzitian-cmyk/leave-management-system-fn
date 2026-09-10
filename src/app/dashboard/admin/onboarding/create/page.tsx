'use client';

import { useState, useEffect } from 'react';
import { useNavigation } from '@/hooks/use-navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { onboardingApi } from '@/lib/api/onboarding';
import { employeesApi } from '@/lib/api/employees';
import { usersApi } from '@/lib/api/users';
import { createOnboardingSchema, type CreateOnboardingFormData } from '@/schemas/onboarding';
import type { Employee, UserListItem } from '@/types';
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
import { UserPlus, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateOnboardingPage() {
  const navigation = useNavigation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [hrUsers, setHrUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [goals, setGoals] = useState<string[]>(['']);
  const [showTemplate, setShowTemplate] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateOnboardingFormData>({
    resolver: zodResolver(createOnboardingSchema),
    defaultValues: {
      employeeId: '',
      startDate: '',
      targetCompletionDate: '',
      assignedToId: '',
      notes: '',
      isTemplate: false,
      templateName: '',
    },
  });

  const formData = watch();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [employeesResponse, usersResponse] = await Promise.all([
          employeesApi.getAllEmployees(),
          usersApi.getAllUsers(),
        ]);

        // Handle employees response
        if (
          'success' in employeesResponse &&
          'data' in employeesResponse &&
          employeesResponse.success &&
          employeesResponse.data
        ) {
          const empData = employeesResponse.data as Employee[] | { data: Employee[] };
          if (Array.isArray(empData)) {
            setEmployees(empData);
          } else if ('data' in empData && Array.isArray(empData.data)) {
            setEmployees(empData.data);
          }
        } else if (Array.isArray(employeesResponse)) {
          setEmployees(employeesResponse as Employee[]);
        }

        // Handle users response - filter for HR managers and admins
        if (
          'success' in usersResponse &&
          'data' in usersResponse &&
          usersResponse.success &&
          usersResponse.data
        ) {
          const userData = usersResponse.data as UserListItem[] | { data: UserListItem[] };
          let allUsers: UserListItem[] = [];
          if (Array.isArray(userData)) {
            allUsers = userData;
          } else if ('data' in userData && Array.isArray(userData.data)) {
            allUsers = userData.data;
          }
          setHrUsers(allUsers.filter((u) => u.role === 'HR_MANAGER' || u.role === 'ADMIN'));
        } else if (Array.isArray(usersResponse)) {
          const allUsers = usersResponse as UserListItem[];
          setHrUsers(allUsers.filter((u) => u.role === 'HR_MANAGER' || u.role === 'ADMIN'));
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

  const onSubmit = async (data: CreateOnboardingFormData) => {
    setSubmitting(true);
    try {
      // Filter out empty goals
      const filteredGoals = goals.filter((g) => g.trim() !== '');

      const submitData = {
        ...data,
        goals: filteredGoals.length > 0 ? filteredGoals : undefined,
      };

      const response = await onboardingApi.createOnboarding(submitData);

      if ('success' in response && response.success) {
        toast.success('Onboarding process created successfully');
        navigation.push('/dashboard/admin/onboarding');
      } else if ('message' in response && typeof response.message === 'string') {
        toast.error(response.message || 'Failed to create onboarding process');
      } else {
        toast.success('Onboarding process created successfully');
        navigation.push('/dashboard/admin/onboarding');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create onboarding process';
      toast.error(errorMessage);
      console.error('Error creating onboarding:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const addGoal = () => {
    setGoals([...goals, '']);
  };

  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const updateGoal = (index: number, value: string) => {
    const updated = [...goals];
    updated[index] = value;
    setGoals(updated);
  };

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
        <h1 className="text-2xl font-bold tracking-tight">Create Onboarding Process</h1>
        <p className="text-muted-foreground">Set up an onboarding process for a new employee</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Select employee and onboarding details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee *</Label>
              <Select
                value={formData.employeeId}
                onValueChange={(value) => setValue('employeeId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.user.firstName} {emp.user.lastName} - {emp.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.employeeId && (
                <p className="text-destructive text-sm">{errors.employeeId.message}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input id="startDate" type="date" {...register('startDate')} />
                {errors.startDate && (
                  <p className="text-destructive text-sm">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetCompletionDate">Target Completion Date</Label>
                <Input
                  id="targetCompletionDate"
                  type="date"
                  {...register('targetCompletionDate')}
                />
                {errors.targetCompletionDate && (
                  <p className="text-destructive text-sm">{errors.targetCompletionDate.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedToId">Assign To (HR Manager/Admin)</Label>
              <Select
                value={formData.assignedToId}
                onValueChange={(value) => setValue('assignedToId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {hrUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} - {user.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.assignedToId && (
                <p className="text-destructive text-sm">{errors.assignedToId.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Goals */}
        <Card>
          <CardHeader>
            <CardTitle>Onboarding Goals</CardTitle>
            <CardDescription>Define objectives for this onboarding process</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {goals.map((goal, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="e.g., Complete all compliance training"
                  value={goal}
                  onChange={(e) => updateGoal(index, e.target.value)}
                />
                {goals.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeGoal(index)}
                    className="cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addGoal}
              className="w-full cursor-pointer"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Goal
            </Button>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Additional notes or special instructions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes or special instructions..."
              rows={4}
              {...register('notes')}
            />
            {errors.notes && <p className="text-destructive text-sm">{errors.notes.message}</p>}
          </CardContent>
        </Card>

        {/* Template Options */}
        <Card>
          <CardHeader>
            <CardTitle>Template Options</CardTitle>
            <CardDescription>Save this onboarding setup as a template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isTemplate"
                checked={showTemplate}
                onChange={(e) => {
                  setShowTemplate(e.target.checked);
                  setValue('isTemplate', e.target.checked);
                  if (!e.target.checked) {
                    setValue('templateName', '');
                  }
                }}
                className="h-4 w-4 cursor-pointer"
              />
              <Label htmlFor="isTemplate" className="cursor-pointer">
                Save as template for future use
              </Label>
            </div>

            {showTemplate && (
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name *</Label>
                <Input
                  id="templateName"
                  placeholder="e.g., Software Engineer Onboarding"
                  {...register('templateName')}
                />
                {errors.templateName && (
                  <p className="text-destructive text-sm">{errors.templateName.message}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigation.push('/dashboard/admin/onboarding')}
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
                <UserPlus className="mr-2 h-4 w-4" />
                Create Onboarding
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
