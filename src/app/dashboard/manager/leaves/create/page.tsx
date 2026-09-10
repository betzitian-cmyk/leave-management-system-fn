'use client';

import { useState, useEffect } from 'react';
import { useNavigation } from '@/hooks/use-navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leaveRequestsApi } from '@/lib/api/leaveRequests';
import { leaveTypesApi } from '@/lib/api/leaveTypes';
import { createLeaveRequestSchema, type CreateLeaveRequestFormData } from '@/schemas/leaveRequest';
import type { LeaveType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateLeaveRequestPage() {
  const navigation = useNavigation();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateLeaveRequestFormData>({
    resolver: zodResolver(createLeaveRequestSchema),
  });

  const leaveTypeId = watch('leaveTypeId');

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        setLoadingTypes(true);
        const response = await leaveTypesApi.getAllLeaveTypes();
        if (response.success && response.data) {
          setLeaveTypes(response.data);
        } else if (Array.isArray(response)) {
          setLeaveTypes(response);
        }
      } catch (err) {
        console.error('Error fetching leave types:', err);
        toast.error('Failed to load leave types');
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchLeaveTypes();
  }, []);

  const onSubmit = async (data: CreateLeaveRequestFormData) => {
    setSubmitting(true);
    try {
      const response = await leaveRequestsApi.createLeaveRequest(data);

      if (response.success) {
        toast.success('Leave request created successfully!');
        navigation.push('/dashboard/manager/leaves');
      } else {
        toast.error(response.message || 'Failed to create leave request');
      }
    } catch (error: unknown) {
      console.error('Error creating leave request:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create leave request';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingTypes) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
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
              onClick={() => navigation.push('/dashboard/manager/leaves')}
              className="cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-3xl font-bold tracking-tight">Create Leave Request</h2>
          </div>
          <p className="text-muted-foreground">Submit a new leave request</p>
        </div>
        <Button onClick={handleSubmit(onSubmit)} disabled={submitting} className="cursor-pointer">
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Submit Request
            </>
          )}
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Leave Information</CardTitle>
            <CardDescription>Enter the details for your leave request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="leaveTypeId">
                Leave Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={leaveTypeId}
                onValueChange={(value) => setValue('leaveTypeId', value, { shouldValidate: true })}
              >
                <SelectTrigger id="leaveTypeId">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.leaveTypeId && (
                <p className="text-destructive text-sm">{errors.leaveTypeId.message}</p>
              )}
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
                placeholder="Please provide a reason for your leave request (minimum 10 characters)..."
                rows={4}
                className={errors.reason ? 'border-destructive' : ''}
              />
              {errors.reason && <p className="text-destructive text-sm">{errors.reason.message}</p>}
              <p className="text-muted-foreground text-xs">
                Minimum 10 characters, maximum 500 characters
              </p>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
