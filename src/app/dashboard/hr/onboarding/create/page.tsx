'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, AlertCircle, Plus, X } from 'lucide-react';
import { onboardingApi } from '@/lib/api/onboarding';
import { employeesApi } from '@/lib/api/employees';
import { createOnboardingSchema, type CreateOnboardingFormData } from '@/schemas/onboarding';
import type { Employee } from '@/types';
import { toast } from 'sonner';

export default function CreateOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [goals, setGoals] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateOnboardingFormData>({
    resolver: zodResolver(createOnboardingSchema),
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const response = await employeesApi.getAllEmployees();

      let data: Employee[] = [];
      if ('success' in response && response.success && 'data' in response) {
        data = Array.isArray(response.data) ? response.data : [];
      } else if ('data' in response && Array.isArray(response.data)) {
        data = response.data;
      } else if (Array.isArray(response)) {
        data = response;
      }

      // Filter out employees who might already have onboarding
      setEmployees(data);
    } catch (err) {
      console.error('Error fetching employees:', err);
      toast.error('Failed to fetch employees');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const addGoal = () => {
    if (newGoal.trim() && !goals.includes(newGoal.trim())) {
      const updatedGoals = [...goals, newGoal.trim()];
      setGoals(updatedGoals);
      setValue('goals', updatedGoals);
      setNewGoal('');
    }
  };

  const removeGoal = (index: number) => {
    const updatedGoals = goals.filter((_, i) => i !== index);
    setGoals(updatedGoals);
    setValue('goals', updatedGoals);
  };

  const onSubmit = async (data: CreateOnboardingFormData) => {
    try {
      setLoading(true);

      const payload = {
        ...data,
        goals: goals,
      };

      const response = await onboardingApi.createOnboarding(payload);

      if ('success' in response && response.success) {
        toast.success('Onboarding created successfully');
        router.push('/dashboard/hr/onboarding');
      } else {
        throw new Error('Failed to create onboarding');
      }
    } catch (err) {
      console.error('Error creating onboarding:', err);
      if (err instanceof Error) {
        toast.error(err.message || 'Failed to create onboarding');
      } else {
        toast.error('Failed to create onboarding');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Create Onboarding</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Set up a new employee onboarding process
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="p-6">
          <div className="space-y-6">
            {/* Employee Selection */}
            <div className="space-y-2">
              <Label htmlFor="employeeId">
                Employee <span className="text-destructive">*</span>
              </Label>
              <Select
                onValueChange={(value) => setValue('employeeId', value)}
                disabled={loadingEmployees}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={loadingEmployees ? 'Loading employees...' : 'Select employee'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.user.firstName} {employee.user.lastName} - {employee.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.employeeId && (
                <p className="text-destructive flex items-center gap-1 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {errors.employeeId.message}
                </p>
              )}
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Start Date <span className="text-destructive">*</span>
              </Label>
              <Input id="startDate" type="date" {...register('startDate')} />
              {errors.startDate && (
                <p className="text-destructive flex items-center gap-1 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {errors.startDate.message}
                </p>
              )}
            </div>

            {/* Target Completion Date */}
            <div className="space-y-2">
              <Label htmlFor="targetCompletionDate">Target Completion Date</Label>
              <Input id="targetCompletionDate" type="date" {...register('targetCompletionDate')} />
              {errors.targetCompletionDate && (
                <p className="text-destructive flex items-center gap-1 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {errors.targetCompletionDate.message}
                </p>
              )}
            </div>

            {/* Assigned To */}
            <div className="space-y-2">
              <Label htmlFor="assignedToId">Assigned To (HR Manager/Buddy)</Label>
              <Select
                onValueChange={(value) => setValue('assignedToId', value === 'none' ? '' : value)}
                disabled={loadingEmployees}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select HR manager or buddy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {employees
                    .filter(
                      (e) =>
                        e.position.toLowerCase().includes('manager') ||
                        e.position.toLowerCase().includes('hr')
                    )
                    .map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.user.firstName} {employee.user.lastName} - {employee.position}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.assignedToId && (
                <p className="text-destructive flex items-center gap-1 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {errors.assignedToId.message}
                </p>
              )}
            </div>

            {/* Goals */}
            <div className="space-y-2">
              <Label>Onboarding Goals</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a goal..."
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addGoal();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addGoal}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {goals.length > 0 && (
                <div className="mt-2 space-y-2">
                  {goals.map((goal, index) => (
                    <div
                      key={index}
                      className="bg-muted flex items-center justify-between rounded-md p-2"
                    >
                      <span className="text-sm">{goal}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeGoal(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes or instructions..."
                {...register('notes')}
                rows={4}
              />
              {errors.notes && (
                <p className="text-destructive flex items-center gap-1 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {errors.notes.message}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-4 border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Onboarding
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
