'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { updateOnboardingSchema, type UpdateOnboardingFormData } from '@/schemas/onboarding';
import type { OnboardingProcess, Employee } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function EditOnboardingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [challenges, setChallenges] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [newChallenge, setNewChallenge] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UpdateOnboardingFormData>({
    resolver: zodResolver(updateOnboardingSchema),
  });

  useEffect(() => {
    if (id) {
      fetchOnboarding();
      fetchEmployees();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchOnboarding = async () => {
    try {
      setFetchLoading(true);
      const response = await onboardingApi.getOnboardingById(id);

      let data: OnboardingProcess | null = null;
      if ('success' in response && response.success && 'data' in response) {
        data = response.data as OnboardingProcess;
      } else if ('data' in response) {
        data = response.data as OnboardingProcess;
      } else if ('id' in response) {
        data = response as OnboardingProcess;
      }

      if (data) {
        // Set form values
        reset({
          status: data.status,
          currentPhase: data.currentPhase,
          startDate: format(new Date(data.startDate), 'yyyy-MM-dd'),
          targetCompletionDate: data.targetCompletionDate
            ? format(new Date(data.targetCompletionDate), 'yyyy-MM-dd')
            : undefined,
          actualCompletionDate: data.actualCompletionDate
            ? format(new Date(data.actualCompletionDate), 'yyyy-MM-dd')
            : undefined,
          assignedToId: data.assignedTo?.id || '',
          notes: data.notes || '',
          satisfactionRating: data.satisfactionRating,
          feedback: data.feedback || '',
          improvementSuggestions: data.improvementSuggestions || '',
        });
        setGoals(data.goals || []);
        setChallenges(data.challenges || []);
      } else {
        toast.error('Onboarding not found');
        router.push('/dashboard/hr/onboarding');
      }
    } catch (err) {
      console.error('Error fetching onboarding:', err);
      toast.error('Failed to fetch onboarding details');
      router.push('/dashboard/hr/onboarding');
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeesApi.getAllEmployees();

      let data: Employee[] = [];
      if ('success' in response && response.success && 'data' in response) {
        data = Array.isArray(response.data) ? response.data : [];
      } else if ('data' in response && Array.isArray(response.data)) {
        data = response.data;
      } else if (Array.isArray(response)) {
        data = response;
      }

      setEmployees(data);
    } catch (err) {
      console.error('Error fetching employees:', err);
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

  const addChallenge = () => {
    if (newChallenge.trim() && !challenges.includes(newChallenge.trim())) {
      const updatedChallenges = [...challenges, newChallenge.trim()];
      setChallenges(updatedChallenges);
      setValue('challenges', updatedChallenges);
      setNewChallenge('');
    }
  };

  const removeChallenge = (index: number) => {
    const updatedChallenges = challenges.filter((_, i) => i !== index);
    setChallenges(updatedChallenges);
    setValue('challenges', updatedChallenges);
  };

  const onSubmit = async (data: UpdateOnboardingFormData) => {
    try {
      setLoading(true);

      const payload = {
        ...data,
        goals: goals,
        challenges: challenges,
      };

      const response = await onboardingApi.updateOnboarding(id, payload);

      if ('success' in response && response.success) {
        toast.success('Onboarding updated successfully');
        router.push(`/dashboard/hr/onboarding/${id}`);
      } else {
        throw new Error('Failed to update onboarding');
      }
    } catch (err) {
      console.error('Error updating onboarding:', err);
      if (err instanceof Error) {
        toast.error(err.message || 'Failed to update onboarding');
      } else {
        toast.error('Failed to update onboarding');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
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
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Edit Onboarding</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Update onboarding details and progress
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          {/* Status and Phase */}
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Status & Phase</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  onValueChange={(value) =>
                    setValue('status', value as UpdateOnboardingFormData['status'])
                  }
                  defaultValue={undefined}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="ON_HOLD">On Hold</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-destructive flex items-center gap-1 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.status.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentPhase">Current Phase</Label>
                <Select
                  onValueChange={(value) =>
                    setValue('currentPhase', value as UpdateOnboardingFormData['currentPhase'])
                  }
                  defaultValue={undefined}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select phase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRE_BOARDING">Pre-Boarding</SelectItem>
                    <SelectItem value="FIRST_DAY">First Day</SelectItem>
                    <SelectItem value="FIRST_WEEK">First Week</SelectItem>
                    <SelectItem value="FIRST_MONTH">First Month</SelectItem>
                    <SelectItem value="FIRST_QUARTER">First Quarter</SelectItem>
                  </SelectContent>
                </Select>
                {errors.currentPhase && (
                  <p className="text-destructive flex items-center gap-1 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.currentPhase.message}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Dates */}
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Dates</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" {...register('startDate')} />
                {errors.startDate && (
                  <p className="text-destructive flex items-center gap-1 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.startDate.message}
                  </p>
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
                  <p className="text-destructive flex items-center gap-1 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.targetCompletionDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="actualCompletionDate">Actual Completion Date</Label>
                <Input
                  id="actualCompletionDate"
                  type="date"
                  {...register('actualCompletionDate')}
                />
                {errors.actualCompletionDate && (
                  <p className="text-destructive flex items-center gap-1 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.actualCompletionDate.message}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Assignment */}
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Assignment</h3>
            <div className="space-y-2">
              <Label htmlFor="assignedToId">Assigned To (HR Manager/Buddy)</Label>
              <Select
                onValueChange={(value) => setValue('assignedToId', value === 'none' ? '' : value)}
                defaultValue={undefined}
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
          </Card>

          {/* Goals */}
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Onboarding Goals</h3>
            <div className="space-y-2">
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
          </Card>

          {/* Challenges */}
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Challenges</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a challenge..."
                  value={newChallenge}
                  onChange={(e) => setNewChallenge(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addChallenge();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addChallenge}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {challenges.length > 0 && (
                <div className="mt-2 space-y-2">
                  {challenges.map((challenge, index) => (
                    <div
                      key={index}
                      className="bg-muted flex items-center justify-between rounded-md p-2"
                    >
                      <span className="text-sm">{challenge}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeChallenge(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Feedback */}
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Feedback & Evaluation</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="satisfactionRating">Satisfaction Rating (1-5)</Label>
                <Input
                  id="satisfactionRating"
                  type="number"
                  min="1"
                  max="5"
                  {...register('satisfactionRating', { valueAsNumber: true })}
                />
                {errors.satisfactionRating && (
                  <p className="text-destructive flex items-center gap-1 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.satisfactionRating.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback">Employee Feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="Enter employee feedback about the onboarding process..."
                  {...register('feedback')}
                  rows={4}
                />
                {errors.feedback && (
                  <p className="text-destructive flex items-center gap-1 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.feedback.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="improvementSuggestions">Improvement Suggestions</Label>
                <Textarea
                  id="improvementSuggestions"
                  placeholder="Enter suggestions for improving the onboarding process..."
                  {...register('improvementSuggestions')}
                  rows={4}
                />
                {errors.improvementSuggestions && (
                  <p className="text-destructive flex items-center gap-1 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.improvementSuggestions.message}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Notes */}
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Notes</h3>
            <div className="space-y-2">
              <Textarea
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
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
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
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
