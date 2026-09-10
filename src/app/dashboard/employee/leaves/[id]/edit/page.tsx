'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useNavigation } from '@/hooks/use-navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leaveRequestsApi } from '@/lib/api/leaveRequests';
import { updateLeaveRequestSchema, type UpdateLeaveRequestFormData } from '@/schemas/leaveRequest';
import type { LeaveRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function EditLeaveRequestPage() {
  const params = useParams();
  const navigation = useNavigation();
  const [leaveRequest, setLeaveRequest] = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UpdateLeaveRequestFormData>({
    resolver: zodResolver(updateLeaveRequestSchema),
  });

  const requestId = params.id as string;

  useEffect(() => {
    const fetchLeaveRequest = async () => {
      try {
        setLoading(true);
        const response = await leaveRequestsApi.getLeaveRequestById(requestId);

        let data: LeaveRequest | null = null;
        if (response.success && response.data) {
          data = response.data;
        } else if ('id' in response) {
          data = response as unknown as LeaveRequest;
        }

        if (data) {
          // Check if request can be edited (only PENDING)
          if (data.status !== 'PENDING') {
            toast.error(
              `Cannot edit ${data.status} leave request. Only PENDING requests can be modified.`
            );
            navigation.push(`/dashboard/employee/leaves/${requestId}`);
            return;
          }

          setLeaveRequest(data);

          // Set form values
          setValue('startDate', data.startDate.split('T')[0]);
          setValue('endDate', data.endDate.split('T')[0]);
          setValue('reason', data.reason);
        } else {
          toast.error('Failed to load leave request');
          navigation.push('/dashboard/employee/leaves');
        }
      } catch (err) {
        console.error('Error fetching leave request:', err);
        toast.error('Failed to load leave request');
        navigation.push('/dashboard/employee/leaves');
      } finally {
        setLoading(false);
      }
    };

    if (requestId) {
      fetchLeaveRequest();
    }
  }, [requestId, navigation, setValue]);

  const onSubmit = async (data: UpdateLeaveRequestFormData) => {
    setSaving(true);
    try {
      const response = await leaveRequestsApi.updateLeaveRequest(requestId, data);

      if (response.success) {
        toast.success('Leave request updated successfully!');
        navigation.push(`/dashboard/employee/leaves/${requestId}`);
      } else {
        toast.error(response.message || 'Failed to update leave request');
      }
    } catch (error: unknown) {
      console.error('Error updating leave request:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update leave request';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!leaveRequest) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          onClick={() => navigation.push('/dashboard/employee/leaves')}
          className="cursor-pointer"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Leave Requests
        </Button>
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-center">Leave request not found</p>
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
              onClick={() => navigation.push(`/dashboard/employee/leaves/${requestId}`)}
              className="cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-3xl font-bold tracking-tight">Edit Leave Request</h2>
          </div>
          <p className="text-muted-foreground">Modify your leave request details</p>
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

      {/* Warning Alert */}
      <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
        <CardContent>
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                Important Notice
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Updating the leave request dates will recalculate the number of days and adjust your
                leave balance. You will be notified of any changes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Leave Information</CardTitle>
            <CardDescription>Current leave request details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Leave Type</Label>
              <Input value={leaveRequest.leaveType.name} disabled className="bg-muted" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  Start Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register('startDate')}
                  className={errors.startDate ? 'border-destructive' : ''}
                />
                {errors.startDate && (
                  <p className="text-destructive text-sm">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">
                  End Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register('endDate')}
                  className={errors.endDate ? 'border-destructive' : ''}
                />
                {errors.endDate && (
                  <p className="text-destructive text-sm">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                {...register('reason')}
                placeholder="Please provide a reason for your leave request..."
                rows={4}
                className={errors.reason ? 'border-destructive' : ''}
              />
              {errors.reason && <p className="text-destructive text-sm">{errors.reason.message}</p>}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
