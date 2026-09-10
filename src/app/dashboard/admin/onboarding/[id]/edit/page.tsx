'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useNavigation } from '@/hooks/use-navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { onboardingApi } from '@/lib/api/onboarding';
import { usersApi } from '@/lib/api/users';
import { updateOnboardingSchema, type UpdateOnboardingFormData } from '@/schemas/onboarding';
import type { OnboardingProcess, UserListItem } from '@/types';
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

export default function EditOnboardingPage() {
  const params = useParams();
  const navigation = useNavigation();
  const [onboarding, setOnboarding] = useState<OnboardingProcess | null>(null);
  const [hrUsers, setHrUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [goals, setGoals] = useState<string[]>(['']);
  const [challenges, setChallenges] = useState<string[]>(['']);

  const onboardingId = params.id as string;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateOnboardingFormData>({
    resolver: zodResolver(updateOnboardingSchema),
  });

  const formData = watch();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [onboardingResponse, usersResponse] = await Promise.all([
          onboardingApi.getOnboardingById(onboardingId),
          usersApi.getAllUsers(),
        ]);

        // Handle onboarding response
        let fetchedOnboarding: OnboardingProcess | null = null;
        if ('success' in onboardingResponse && 'data' in onboardingResponse) {
          fetchedOnboarding = onboardingResponse.data as OnboardingProcess;
        } else if ('id' in onboardingResponse) {
          fetchedOnboarding = onboardingResponse as OnboardingProcess;
        }

        if (fetchedOnboarding) {
          setOnboarding(fetchedOnboarding);

          // Set form values
          setValue('status', fetchedOnboarding.status);
          setValue('currentPhase', fetchedOnboarding.currentPhase);
          setValue('startDate', fetchedOnboarding.startDate.split('T')[0]);

          if (fetchedOnboarding.targetCompletionDate) {
            setValue('targetCompletionDate', fetchedOnboarding.targetCompletionDate.split('T')[0]);
          }

          if (fetchedOnboarding.actualCompletionDate) {
            setValue('actualCompletionDate', fetchedOnboarding.actualCompletionDate.split('T')[0]);
          }

          if (fetchedOnboarding.assignedTo) {
            setValue('assignedToId', fetchedOnboarding.assignedTo.id);
          }

          if (fetchedOnboarding.notes) {
            setValue('notes', fetchedOnboarding.notes);
          }

          if (fetchedOnboarding.feedback) {
            setValue('feedback', fetchedOnboarding.feedback);
          }

          if (fetchedOnboarding.satisfactionRating) {
            setValue('satisfactionRating', fetchedOnboarding.satisfactionRating);
          }

          if (fetchedOnboarding.improvementSuggestions) {
            setValue('improvementSuggestions', fetchedOnboarding.improvementSuggestions);
          }

          // Set goals
          if (fetchedOnboarding.goals && fetchedOnboarding.goals.length > 0) {
            setGoals(fetchedOnboarding.goals);
          }

          // Set challenges
          if (fetchedOnboarding.challenges && fetchedOnboarding.challenges.length > 0) {
            setChallenges(fetchedOnboarding.challenges);
          }
        }

        // Handle users response
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
        toast.error('Failed to load onboarding data');
      } finally {
        setLoading(false);
      }
    };

    if (onboardingId) {
      fetchData();
    }
  }, [onboardingId, setValue]);

  const onSubmit = async (data: UpdateOnboardingFormData) => {
    setSubmitting(true);
    try {
      // Filter out empty goals and challenges
      const filteredGoals = goals.filter((g) => g.trim() !== '');
      const filteredChallenges = challenges.filter((c) => c.trim() !== '');

      const submitData = {
        ...data,
        goals: filteredGoals.length > 0 ? filteredGoals : undefined,
        challenges: filteredChallenges.length > 0 ? filteredChallenges : undefined,
      };

      const response = await onboardingApi.updateOnboarding(onboardingId, submitData);

      if ('success' in response && response.success) {
        toast.success('Onboarding process updated successfully');
        navigation.push(`/dashboard/admin/onboarding/${onboardingId}`);
      } else if ('message' in response && typeof response.message === 'string') {
        toast.error(response.message || 'Failed to update onboarding process');
      } else {
        toast.success('Onboarding process updated successfully');
        navigation.push(`/dashboard/admin/onboarding/${onboardingId}`);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update onboarding process';
      toast.error(errorMessage);
      console.error('Error updating onboarding:', err);
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

  const addChallenge = () => {
    setChallenges([...challenges, '']);
  };

  const removeChallenge = (index: number) => {
    setChallenges(challenges.filter((_, i) => i !== index));
  };

  const updateChallenge = (index: number, value: string) => {
    const updated = [...challenges];
    updated[index] = value;
    setChallenges(updated);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!onboarding) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <UserPlus className="text-muted-foreground mb-4 h-12 w-12" />
        <h3 className="text-lg font-semibold">Onboarding process not found</h3>
        <p className="text-muted-foreground text-sm">
          The onboarding process you are looking for does not exist
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Onboarding Process</h1>
        <p className="text-muted-foreground">
          Update onboarding details for {onboarding.employee.firstName}{' '}
          {onboarding.employee.lastName}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Status & Phase */}
        <Card>
          <CardHeader>
            <CardTitle>Status & Phase</CardTitle>
            <CardDescription>Update onboarding progress status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setValue(
                      'status',
                      value as 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED'
                    )
                  }
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
                  <p className="text-destructive text-sm">{errors.status.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentPhase">Current Phase</Label>
                <Select
                  value={formData.currentPhase}
                  onValueChange={(value) =>
                    setValue(
                      'currentPhase',
                      value as
                        | 'PRE_BOARDING'
                        | 'FIRST_DAY'
                        | 'FIRST_WEEK'
                        | 'FIRST_MONTH'
                        | 'FIRST_QUARTER'
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select phase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRE_BOARDING">Pre-boarding</SelectItem>
                    <SelectItem value="FIRST_DAY">First Day</SelectItem>
                    <SelectItem value="FIRST_WEEK">First Week</SelectItem>
                    <SelectItem value="FIRST_MONTH">First Month</SelectItem>
                    <SelectItem value="FIRST_QUARTER">First Quarter</SelectItem>
                  </SelectContent>
                </Select>
                {errors.currentPhase && (
                  <p className="text-destructive text-sm">{errors.currentPhase.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Dates</CardTitle>
            <CardDescription>Manage onboarding timeline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" {...register('startDate')} />
                {errors.startDate && (
                  <p className="text-destructive text-sm">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetCompletionDate">Target Completion</Label>
                <Input
                  id="targetCompletionDate"
                  type="date"
                  {...register('targetCompletionDate')}
                />
                {errors.targetCompletionDate && (
                  <p className="text-destructive text-sm">{errors.targetCompletionDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="actualCompletionDate">Actual Completion</Label>
                <Input
                  id="actualCompletionDate"
                  type="date"
                  {...register('actualCompletionDate')}
                />
                {errors.actualCompletionDate && (
                  <p className="text-destructive text-sm">{errors.actualCompletionDate.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment</CardTitle>
            <CardDescription>Assign responsible HR manager or admin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="assignedToId">Assigned To</Label>
            <Select
              value={formData.assignedToId}
              onValueChange={(value) => setValue('assignedToId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select assignee" />
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
          </CardContent>
        </Card>

        {/* Goals */}
        <Card>
          <CardHeader>
            <CardTitle>Onboarding Goals</CardTitle>
            <CardDescription>Define or update objectives</CardDescription>
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

        {/* Challenges */}
        <Card>
          <CardHeader>
            <CardTitle>Challenges</CardTitle>
            <CardDescription>Document any challenges encountered</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {challenges.map((challenge, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="e.g., Delays in equipment setup"
                  value={challenge}
                  onChange={(e) => updateChallenge(index, e.target.value)}
                />
                {challenges.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeChallenge(index)}
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
              onClick={addChallenge}
              className="w-full cursor-pointer"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Challenge
            </Button>
          </CardContent>
        </Card>

        {/* Notes & Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>Notes & Feedback</CardTitle>
            <CardDescription>Additional information and employee feedback</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes..."
                rows={4}
                {...register('notes')}
              />
              {errors.notes && <p className="text-destructive text-sm">{errors.notes.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Employee Feedback</Label>
              <Textarea
                id="feedback"
                placeholder="Employee's feedback about the onboarding process..."
                rows={4}
                {...register('feedback')}
              />
              {errors.feedback && (
                <p className="text-destructive text-sm">{errors.feedback.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="satisfactionRating">Satisfaction Rating (1-5)</Label>
              <Input
                id="satisfactionRating"
                type="number"
                min="1"
                max="5"
                placeholder="Enter rating between 1-5"
                {...register('satisfactionRating', { valueAsNumber: true })}
              />
              {errors.satisfactionRating && (
                <p className="text-destructive text-sm">{errors.satisfactionRating.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="improvementSuggestions">Improvement Suggestions</Label>
              <Textarea
                id="improvementSuggestions"
                placeholder="Suggestions for improving the onboarding process..."
                rows={4}
                {...register('improvementSuggestions')}
              />
              {errors.improvementSuggestions && (
                <p className="text-destructive text-sm">{errors.improvementSuggestions.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigation.push(`/dashboard/admin/onboarding/${onboardingId}`)}
            disabled={submitting}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} className="cursor-pointer">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Update Onboarding
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
