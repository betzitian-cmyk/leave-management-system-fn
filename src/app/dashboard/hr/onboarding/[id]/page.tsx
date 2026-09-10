'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Edit,
  Loader2,
  Mail,
  Briefcase,
  Building2,
  Calendar,
  Target,
  ClipboardList,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { onboardingApi, onboardingTasksApi } from '@/lib/api/onboarding';
import type {
  OnboardingProcess,
  OnboardingTask,
  OnboardingProcessStatus,
  OnboardingPhase,
  TaskStatus,
} from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function OnboardingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [onboarding, setOnboarding] = useState<OnboardingProcess | null>(null);
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [progress, setProgress] = useState({
    total: 0,
    completed: 0,
    percentage: 0,
  });

  useEffect(() => {
    if (id) {
      fetchOnboarding();
      fetchTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchOnboarding = async () => {
    try {
      setLoading(true);
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
        setOnboarding(data);
      } else {
        toast.error('Onboarding not found');
        router.push('/dashboard/hr/onboarding');
      }
    } catch (err) {
      console.error('Error fetching onboarding:', err);
      toast.error('Failed to fetch onboarding details');
      router.push('/dashboard/hr/onboarding');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await onboardingTasksApi.getTasksByOnboardingId(id);

      let data: OnboardingTask[] = [];
      if ('success' in response && response.success && 'data' in response) {
        const responseData = response.data;
        if ('data' in responseData && Array.isArray(responseData.data)) {
          data = responseData.data;
        } else if (Array.isArray(responseData)) {
          data = responseData;
        }
      } else if ('data' in response && Array.isArray(response.data)) {
        data = response.data;
      } else if (Array.isArray(response)) {
        data = response;
      }

      setTasks(data);

      // Calculate progress
      const total = data.length;
      const completed = data.filter((t) => t.status === 'COMPLETED').length;
      setProgress({
        total,
        completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      });
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  const getStatusBadge = (status: OnboardingProcessStatus) => {
    const variants: Record<
      OnboardingProcessStatus,
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }
    > = {
      NOT_STARTED: { variant: 'secondary', label: 'Not Started' },
      IN_PROGRESS: { variant: 'default', label: 'In Progress' },
      COMPLETED: { variant: 'outline', label: 'Completed' },
      ON_HOLD: { variant: 'secondary', label: 'On Hold' },
      CANCELLED: { variant: 'destructive', label: 'Cancelled' },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPhaseBadge = (phase: OnboardingPhase) => {
    const labels: Record<OnboardingPhase, string> = {
      PRE_BOARDING: 'Pre-Boarding',
      FIRST_DAY: 'First Day',
      FIRST_WEEK: 'First Week',
      FIRST_MONTH: 'First Month',
      FIRST_QUARTER: 'First Quarter',
    };
    return <Badge variant="outline">{labels[phase]}</Badge>;
  };

  const getTaskStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'IN_PROGRESS':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'SKIPPED':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'ON_HOLD':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <Circle className="text-muted-foreground h-5 w-5" />;
    }
  };

  const getTaskStatusLabel = (status: TaskStatus) => {
    const labels: Record<TaskStatus, string> = {
      PENDING: 'Pending',
      IN_PROGRESS: 'In Progress',
      COMPLETED: 'Completed',
      SKIPPED: 'Skipped',
      ON_HOLD: 'On Hold',
    };
    return labels[status];
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!onboarding) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Onboarding Details</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              View and manage onboarding progress
            </p>
          </div>
        </div>
        <Button onClick={() => router.push(`/dashboard/hr/onboarding/${id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      {/* Employee Info Card */}
      <Card className="p-6">
        <div className="flex flex-col items-start gap-6 sm:flex-row">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="text-2xl">
              {onboarding.employee.firstName[0]}
              {onboarding.employee.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-bold">
                {onboarding.employee.firstName} {onboarding.employee.lastName}
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {getStatusBadge(onboarding.status)}
                {getPhaseBadge(onboarding.currentPhase)}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="text-muted-foreground h-4 w-4" />
                <span>{onboarding.employee.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="text-muted-foreground h-4 w-4" />
                <span>{onboarding.employee.position}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="text-muted-foreground h-4 w-4" />
                <span>{onboarding.employee.department.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="text-muted-foreground h-4 w-4" />
                <span>Start: {format(new Date(onboarding.startDate), 'MMM dd, yyyy')}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Progress Card */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Overall Progress</h3>
            <span className="text-2xl font-bold">{progress.percentage}%</span>
          </div>
          <Progress value={progress.percentage} className="h-3" />
          <div className="grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-4">
            <div>
              <p className="text-muted-foreground text-sm">Total Tasks</p>
              <p className="mt-1 text-2xl font-bold">{progress.total}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Completed</p>
              <p className="mt-1 text-2xl font-bold text-green-600">{progress.completed}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Remaining</p>
              <p className="mt-1 text-2xl font-bold">{progress.total - progress.completed}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Assigned To</p>
              <p className="mt-1 text-sm font-medium">
                {onboarding.assignedTo
                  ? `${onboarding.assignedTo.firstName} ${onboarding.assignedTo.lastName}`
                  : 'Unassigned'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Onboarding Details */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Onboarding Details</h3>
          <div className="space-y-4">
            {onboarding.targetCompletionDate && (
              <div>
                <p className="text-muted-foreground text-sm">Target Completion</p>
                <p className="font-medium">
                  {format(new Date(onboarding.targetCompletionDate), 'MMM dd, yyyy')}
                </p>
              </div>
            )}
            {onboarding.actualCompletionDate && (
              <div>
                <p className="text-muted-foreground text-sm">Actual Completion</p>
                <p className="font-medium">
                  {format(new Date(onboarding.actualCompletionDate), 'MMM dd, yyyy')}
                </p>
              </div>
            )}
            {onboarding.notes && (
              <div>
                <p className="text-muted-foreground text-sm">Notes</p>
                <p className="mt-1 text-sm">{onboarding.notes}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Goals */}
        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Target className="h-5 w-5" />
            Onboarding Goals
          </h3>
          {onboarding.goals && onboarding.goals.length > 0 ? (
            <ul className="space-y-2">
              {onboarding.goals.map((goal, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">No goals defined</p>
          )}
        </Card>
      </div>

      {/* Tasks */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <ClipboardList className="h-5 w-5" />
            Tasks
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/hr/onboarding/${id}/tasks`)}
          >
            Manage Tasks
          </Button>
        </div>
        {tasks.length === 0 ? (
          <div className="py-8 text-center">
            <ClipboardList className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <p className="text-muted-foreground">No tasks created yet</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => router.push(`/dashboard/hr/onboarding/${id}/tasks`)}
            >
              Add Tasks
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="bg-muted/50 hover:bg-muted flex items-center gap-3 rounded-lg p-3 transition-colors"
              >
                {getTaskStatusIcon(task.status)}
                <div className="flex-1">
                  <p className="font-medium">{task.title}</p>
                  <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline" className="text-xs">
                      {task.category}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {task.priority}
                    </Badge>
                    <span>{getTaskStatusLabel(task.status)}</span>
                    {task.dueDate && <span>• Due {format(new Date(task.dueDate), 'MMM dd')}</span>}
                  </div>
                </div>
              </div>
            ))}
            {tasks.length > 5 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => router.push(`/dashboard/hr/onboarding/${id}/tasks`)}
              >
                View all {tasks.length} tasks
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Feedback Section (if available) */}
      {(onboarding.feedback ||
        onboarding.satisfactionRating ||
        (onboarding.challenges && onboarding.challenges.length > 0)) && (
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Feedback & Challenges</h3>
          <div className="space-y-4">
            {onboarding.satisfactionRating && (
              <div>
                <p className="text-muted-foreground text-sm">Satisfaction Rating</p>
                <p className="text-2xl font-bold">{onboarding.satisfactionRating}/5</p>
              </div>
            )}
            {onboarding.challenges && onboarding.challenges.length > 0 && (
              <div>
                <p className="text-muted-foreground mb-2 text-sm">Challenges Encountered</p>
                <ul className="space-y-1">
                  {onboarding.challenges.map((challenge, index) => (
                    <li key={index} className="text-sm">
                      • {challenge}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {onboarding.feedback && (
              <div>
                <p className="text-muted-foreground text-sm">Employee Feedback</p>
                <p className="mt-1 text-sm">{onboarding.feedback}</p>
              </div>
            )}
            {onboarding.improvementSuggestions && (
              <div>
                <p className="text-muted-foreground text-sm">Improvement Suggestions</p>
                <p className="mt-1 text-sm">{onboarding.improvementSuggestions}</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
