'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useNavigation } from '@/hooks/use-navigation';
import { onboardingApi, onboardingTasksApi } from '@/lib/api/onboarding';
import type {
  OnboardingProcess,
  OnboardingTask,
  OnboardingProcessStatus,
  OnboardingPhase,
  TaskStatus,
} from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Loader2,
  Edit,
  UserPlus,
  Calendar,
  Target,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Building2,
  FileText,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

export default function OnboardingViewPage() {
  const params = useParams();
  const navigation = useNavigation();
  const [onboarding, setOnboarding] = useState<OnboardingProcess | null>(null);
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);

  const onboardingId = params.id as string;

  const fetchTasks = async () => {
    try {
      setTasksLoading(true);
      const response = await onboardingTasksApi.getTasksByOnboardingId(onboardingId);

      if ('success' in response && 'data' in response && response.success && response.data) {
        const responseData = response.data as OnboardingTask[] | { data: OnboardingTask[] };
        if (Array.isArray(responseData)) {
          setTasks(responseData);
        } else if ('data' in responseData && Array.isArray(responseData.data)) {
          setTasks(responseData.data);
        }
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      // Don't show error toast here as it's not critical
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await onboardingApi.getOnboardingById(onboardingId);

        let fetchedOnboarding: OnboardingProcess | null = null;
        if ('success' in response && 'data' in response) {
          fetchedOnboarding = response.data as OnboardingProcess;
        } else if ('id' in response) {
          fetchedOnboarding = response as OnboardingProcess;
        }

        if (fetchedOnboarding) {
          setOnboarding(fetchedOnboarding);
          // Fetch tasks
          await fetchTasks();
        } else {
          toast.error('Failed to load onboarding process');
        }
      } catch (err) {
        console.error('Error fetching onboarding:', err);
        toast.error('Failed to load onboarding process');
      } finally {
        setLoading(false);
      }
    };

    if (onboardingId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: OnboardingProcessStatus) => {
    const statusConfig = {
      NOT_STARTED: { variant: 'secondary' as const, label: 'Not Started', className: '' },
      IN_PROGRESS: { variant: 'default' as const, label: 'In Progress', className: '' },
      COMPLETED: {
        variant: 'outline' as const,
        label: 'Completed',
        className: 'border-green-500 text-green-700 dark:text-green-400',
      },
      ON_HOLD: {
        variant: 'outline' as const,
        label: 'On Hold',
        className: 'border-yellow-500 text-yellow-700 dark:text-yellow-400',
      },
      CANCELLED: { variant: 'destructive' as const, label: 'Cancelled', className: '' },
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getPhaseBadge = (phase: OnboardingPhase) => {
    const phaseConfig = {
      PRE_BOARDING: {
        label: 'Pre-boarding',
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      },
      FIRST_DAY: {
        label: 'First Day',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      },
      FIRST_WEEK: {
        label: 'First Week',
        color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      },
      FIRST_MONTH: {
        label: 'First Month',
        color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      },
      FIRST_QUARTER: {
        label: 'First Quarter',
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      },
    };

    const config = phaseConfig[phase];
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const getTaskStatusBadge = (status: TaskStatus) => {
    const statusConfig = {
      PENDING: { variant: 'secondary' as const, label: 'Pending', icon: Clock, className: '' },
      IN_PROGRESS: {
        variant: 'default' as const,
        label: 'In Progress',
        icon: TrendingUp,
        className: '',
      },
      COMPLETED: {
        variant: 'outline' as const,
        label: 'Completed',
        icon: CheckCircle,
        className: 'border-green-500 text-green-700 dark:text-green-400',
      },
      SKIPPED: { variant: 'outline' as const, label: 'Skipped', icon: AlertCircle, className: '' },
      ON_HOLD: {
        variant: 'outline' as const,
        label: 'On Hold',
        icon: Clock,
        className: 'border-yellow-500 text-yellow-700 dark:text-yellow-400',
      },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const calculateProgress = () => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
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
        <Button
          onClick={() => navigation.push('/dashboard/admin/onboarding')}
          className="mt-4 cursor-pointer"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Onboarding
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigation.push('/dashboard/admin/onboarding')}
            className="cursor-pointer"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Onboarding Details</h1>
            <p className="text-muted-foreground">
              View and manage onboarding process for {onboarding.employee.firstName}{' '}
              {onboarding.employee.lastName}
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigation.push(`/dashboard/admin/onboarding/${onboardingId}/edit`)}
          className="cursor-pointer"
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Overview</CardTitle>
          <CardDescription>Track the completion status of onboarding tasks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{calculateProgress()}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-success h-5 w-5" />
              <div>
                <p className="text-sm font-medium">
                  {tasks.filter((t) => t.status === 'COMPLETED').length} Completed
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="text-primary h-5 w-5" />
              <div>
                <p className="text-sm font-medium">
                  {tasks.filter((t) => t.status === 'IN_PROGRESS').length} In Progress
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-sm font-medium">
                  {tasks.filter((t) => t.status === 'PENDING').length} Pending
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Name</p>
                <p className="font-medium">
                  {onboarding.employee.firstName} {onboarding.employee.lastName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Email</p>
                <p className="font-medium">{onboarding.employee.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <UserPlus className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Position</p>
                <p className="font-medium">{onboarding.employee.position}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Department</p>
                <p className="font-medium">{onboarding.employee.department.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Onboarding Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Target className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Status</p>
                <div className="mt-1">{getStatusBadge(onboarding.status)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Current Phase</p>
                <div className="mt-1">{getPhaseBadge(onboarding.currentPhase)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Start Date</p>
                <p className="font-medium">{formatDate(onboarding.startDate)}</p>
              </div>
            </div>
            {onboarding.targetCompletionDate && (
              <div className="flex items-center gap-3">
                <Target className="text-muted-foreground h-5 w-5" />
                <div>
                  <p className="text-muted-foreground text-sm">Target Completion</p>
                  <p className="font-medium">{formatDate(onboarding.targetCompletionDate)}</p>
                </div>
              </div>
            )}
            {onboarding.assignedTo && (
              <div className="flex items-center gap-3">
                <User className="text-muted-foreground h-5 w-5" />
                <div>
                  <p className="text-muted-foreground text-sm">Assigned To</p>
                  <p className="font-medium">
                    {onboarding.assignedTo.firstName} {onboarding.assignedTo.lastName}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Goals */}
      {onboarding.goals && onboarding.goals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Onboarding Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {onboarding.goals.map((goal, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Target className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{goal}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Tasks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Onboarding Tasks</CardTitle>
              <CardDescription>Manage and track onboarding tasks</CardDescription>
            </div>
            <Button
              onClick={() =>
                navigation.push(`/dashboard/admin/onboarding/${onboardingId}/tasks/create`)
              }
              size="sm"
              className="cursor-pointer"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tasksLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="text-primary h-6 w-6 animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center">
              <FileText className="text-muted-foreground mb-2 h-8 w-8" />
              <p className="text-muted-foreground text-sm">No tasks added yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((task) => (
                    <TableRow
                      key={task.id}
                      className="cursor-pointer"
                      onClick={() =>
                        navigation.push(`/dashboard/admin/onboarding/tasks/${task.id}`)
                      }
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-muted-foreground line-clamp-1 text-sm">
                            {task.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{task.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            task.priority === 'CRITICAL' || task.priority === 'HIGH'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{getTaskStatusBadge(task.status)}</TableCell>
                      <TableCell>{task.dueDate ? formatDate(task.dueDate) : 'Not set'}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {onboarding.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">{onboarding.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Feedback & Rating */}
      {(onboarding.feedback || onboarding.satisfactionRating) && (
        <Card>
          <CardHeader>
            <CardTitle>Employee Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {onboarding.satisfactionRating && (
              <div>
                <p className="text-muted-foreground mb-2 text-sm">Satisfaction Rating</p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <CheckCircle
                      key={star}
                      className={`h-5 w-5 ${
                        star <= onboarding.satisfactionRating!
                          ? 'text-warning fill-current'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm font-medium">
                    {onboarding.satisfactionRating}/5
                  </span>
                </div>
              </div>
            )}
            {onboarding.feedback && (
              <div>
                <p className="text-muted-foreground mb-2 text-sm">Feedback</p>
                <p className="text-sm whitespace-pre-wrap">{onboarding.feedback}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
