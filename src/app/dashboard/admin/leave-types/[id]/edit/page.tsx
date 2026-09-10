'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useNavigation } from '@/hooks/use-navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leaveTypesApi } from '@/lib/api/leaveTypes';
import { updateLeaveTypeSchema, type UpdateLeaveTypeFormData } from '@/schemas/leaveType';
import type { LeaveType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function EditLeaveTypePage() {
  const params = useParams();
  const navigation = useNavigation();
  const [leaveType, setLeaveType] = useState<LeaveType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<UpdateLeaveTypeFormData>({
    resolver: zodResolver(updateLeaveTypeSchema),
  });

  const activeValue = watch('active');

  useEffect(() => {
    const fetchLeaveType = async () => {
      try {
        setLoading(true);
        const response = await leaveTypesApi.getLeaveTypeById(params.id as string);

        let leaveTypeData: LeaveType | null = null;
        if (response.success && response.data) {
          leaveTypeData = response.data;
        } else if ('id' in response) {
          leaveTypeData = response as unknown as LeaveType;
        }

        if (leaveTypeData) {
          setLeaveType(leaveTypeData);
          reset({
            name: leaveTypeData.name,
            description: leaveTypeData.description || '',
            defaultDays: leaveTypeData.defaultDays,
            color: leaveTypeData.color || '#3B82F6',
            active: leaveTypeData.active,
          });
        }
      } catch (err) {
        console.error('Error fetching leave type:', err);
        toast.error('Failed to load leave type data');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchLeaveType();
    }
  }, [params.id, reset]);

  const onSubmit = async (data: UpdateLeaveTypeFormData) => {
    setSaving(true);
    try {
      const response = await leaveTypesApi.updateLeaveType(params.id as string, data);
      if (response.success || 'id' in response) {
        toast.success('Leave type updated successfully');
        navigation.push('/dashboard/admin/leave-types');
      }
    } catch (error) {
      console.error('Error updating leave type:', error);
      toast.error('Failed to update leave type');
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

  if (!leaveType) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          onClick={() => navigation.push('/dashboard/admin/leave-types')}
          className="cursor-pointer"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Leave Types
        </Button>
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-center">Leave type not found</p>
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
              onClick={() => navigation.push('/dashboard/admin/leave-types')}
              className="cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-3xl font-bold tracking-tight">Edit Leave Type</h2>
          </div>
          <p className="text-muted-foreground">
            Update leave type information for {leaveType.name}
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
          <CardTitle>Leave Type Information</CardTitle>
          <CardDescription>Update leave type details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Leave Type Name *</Label>
            <Input id="name" placeholder="e.g., Annual Leave, Sick Leave" {...register('name')} />
            {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
            <p className="text-muted-foreground text-xs">The official name of the leave type</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter leave type description..."
              rows={4}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-destructive text-sm">{errors.description.message}</p>
            )}
            <p className="text-muted-foreground text-xs">A brief description of this leave type</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultDays">Default Days *</Label>
            <Input
              id="defaultDays"
              type="number"
              placeholder="e.g., 15"
              {...register('defaultDays', { valueAsNumber: true })}
            />
            {errors.defaultDays && (
              <p className="text-destructive text-sm">{errors.defaultDays.message}</p>
            )}
            <p className="text-muted-foreground text-xs">
              Default number of days allocated per year
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="color"
                type="color"
                className="h-10 w-20 cursor-pointer"
                {...register('color')}
              />
              <Input type="text" placeholder="#3B82F6" className="flex-1" {...register('color')} />
            </div>
            {errors.color && <p className="text-destructive text-sm">{errors.color.message}</p>}
            <p className="text-muted-foreground text-xs">
              Color code for visual identification (hex format)
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="active"
              checked={activeValue}
              onCheckedChange={(checked) => setValue('active', checked as boolean)}
            />
            <Label htmlFor="active" className="cursor-pointer text-sm font-normal">
              Active (employees can request this leave type)
            </Label>
          </div>

          <div className="bg-muted rounded-md p-4">
            <h4 className="mb-2 text-sm font-medium">Current Information</h4>
            <div className="text-muted-foreground space-y-1 text-sm">
              <p>
                <strong>Current Name:</strong> {leaveType.name}
              </p>
              <p>
                <strong>Current Default Days:</strong> {leaveType.defaultDays}
              </p>
              <p>
                <strong>Current Status:</strong> {leaveType.active ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
