'use client';

import { useEffect, useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Loader2,
  Plus,
  Edit,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { onboardingTasksApi } from '@/lib/api/onboarding';
import { employeesApi } from '@/lib/api/employees';
import {
  createOnboardingTaskSchema,
  updateOnboardingTaskSchema,
  type CreateOnboardingTaskFormData,
  type UpdateOnboardingTaskFormData,
} from '@/schemas/onboarding';
import type { OnboardingTask, TaskStatus, Employee } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function OnboardingTasksPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<OnboardingTask | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const createForm = useForm<CreateOnboardingTaskFormData>({
    resolver: zodResolver(createOnboardingTaskSchema),
    defaultValues: {
      onboardingId: id,
      priority: 'MEDIUM',
    },
  });

  const editForm = useForm<UpdateOnboardingTaskFormData>({
    resolver: zodResolver(updateOnboardingTaskSchema),
  });

  useEffect(() => {
    if (id) {
      fetchTasks();
      fetchEmployees();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
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
    } catch (err) {
      console.error('Error fetching tasks:', err);
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
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

  const handleCreateTask = async (data: CreateOnboardingTaskFormData) => {
    try {
      setSubmitting(true);
      const response = await onboardingTasksApi.createTask(data);

      if ('success' in response && response.success) {
        toast.success('Task created successfully');
        setShowCreateDialog(false);
        createForm.reset({ onboardingId: id, priority: 'MEDIUM' });
        fetchTasks();
      } else {
        throw new Error('Failed to create task');
      }
    } catch (err) {
      console.error('Error creating task:', err);
      toast.error('Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTask = async (data: UpdateOnboardingTaskFormData) => {
    if (!editingTask) return;

    try {
      setSubmitting(true);
      const response = await onboardingTasksApi.updateTask(editingTask.id, data);

      if ('success' in response && response.success) {
        toast.success('Task updated successfully');
        setShowEditDialog(false);
        setEditingTask(null);
        editForm.reset();
        fetchTasks();
      } else {
        throw new Error('Failed to update task');
      }
    } catch (err) {
      console.error('Error updating task:', err);
      toast.error('Failed to update task');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (task: OnboardingTask) => {
    setEditingTask(task);
    editForm.reset({
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : undefined,
      assignedTo: task.assignedTo || '',
      notes: task.notes || '',
    });
    setShowEditDialog(true);
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
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Onboarding Tasks</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage tasks for this onboarding process
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-muted-foreground space-y-2">
            <p className="text-lg font-medium">No tasks yet</p>
            <p className="text-sm">Create tasks to track the onboarding progress</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Task
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} className="p-4 transition-shadow hover:shadow-md">
              <div className="flex items-start gap-4">
                {getTaskStatusIcon(task.status)}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold">{task.title}</h3>
                      <p className="text-muted-foreground mt-1 text-sm">{task.description}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{task.category}</Badge>
                        <Badge variant="secondary">{task.priority}</Badge>
                        <Badge>{getTaskStatusLabel(task.status)}</Badge>
                        {task.dueDate && (
                          <span className="text-muted-foreground text-xs">
                            Due {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                          </span>
                        )}
                        {task.isRequired && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(task)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Task Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreateTask)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-title">Title *</Label>
                <Input id="create-title" {...createForm.register('title')} />
                {createForm.formState.errors.title && (
                  <p className="text-destructive text-sm">
                    {createForm.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-description">Description *</Label>
                <Textarea
                  id="create-description"
                  {...createForm.register('description')}
                  rows={3}
                />
                {createForm.formState.errors.description && (
                  <p className="text-destructive text-sm">
                    {createForm.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select
                    onValueChange={(value) =>
                      createForm.setValue(
                        'category',
                        value as CreateOnboardingTaskFormData['category']
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOCUMENTATION">Documentation</SelectItem>
                      <SelectItem value="TRAINING">Training</SelectItem>
                      <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                      <SelectItem value="ACCESS">Access</SelectItem>
                      <SelectItem value="ORIENTATION">Orientation</SelectItem>
                      <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                      <SelectItem value="SOCIAL">Social</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {createForm.formState.errors.category && (
                    <p className="text-destructive text-sm">
                      {createForm.formState.errors.category.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    onValueChange={(value) =>
                      createForm.setValue(
                        'priority',
                        value as CreateOnboardingTaskFormData['priority']
                      )
                    }
                    defaultValue="MEDIUM"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-dueDate">Due Date</Label>
                  <Input id="create-dueDate" type="date" {...createForm.register('dueDate')} />
                </div>

                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <Select
                    onValueChange={(value) =>
                      createForm.setValue('assignedTo', value === 'none' ? '' : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.user.firstName} {employee.user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEditTask)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input id="edit-title" {...editForm.register('title')} />
                {editForm.formState.errors.title && (
                  <p className="text-destructive text-sm">
                    {editForm.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea id="edit-description" {...editForm.register('description')} rows={3} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    onValueChange={(value) =>
                      editForm.setValue(
                        'category',
                        value as UpdateOnboardingTaskFormData['category']
                      )
                    }
                    defaultValue={editingTask?.category}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOCUMENTATION">Documentation</SelectItem>
                      <SelectItem value="TRAINING">Training</SelectItem>
                      <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                      <SelectItem value="ACCESS">Access</SelectItem>
                      <SelectItem value="ORIENTATION">Orientation</SelectItem>
                      <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                      <SelectItem value="SOCIAL">Social</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    onValueChange={(value) =>
                      editForm.setValue(
                        'priority',
                        value as UpdateOnboardingTaskFormData['priority']
                      )
                    }
                    defaultValue={editingTask?.priority}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    onValueChange={(value) =>
                      editForm.setValue('status', value as UpdateOnboardingTaskFormData['status'])
                    }
                    defaultValue={editingTask?.status}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="SKIPPED">Skipped</SelectItem>
                      <SelectItem value="ON_HOLD">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-dueDate">Due Date</Label>
                <Input id="edit-dueDate" type="date" {...editForm.register('dueDate')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea id="edit-notes" {...editForm.register('notes')} rows={3} />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
