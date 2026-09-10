'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useNavigation } from '@/hooks/use-navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { attendanceApi } from '@/lib/api/attendance';
import { updateAttendanceSchema, type UpdateAttendanceFormData } from '@/schemas/attendance';
import type { Attendance, AttendanceStatus } from '@/types';
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
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function EditAttendancePage() {
  const params = useParams();
  const navigation = useNavigation();
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateAttendanceFormData>({
    resolver: zodResolver(updateAttendanceSchema),
  });

  const formData = watch();
  const attendanceId = params.id as string;

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const response = await attendanceApi.getAttendanceById(attendanceId);

        let data: Attendance | null = null;
        if (response.success && response.data) {
          data = response.data;
        } else if ('id' in response) {
          data = response as unknown as Attendance;
        }

        if (data) {
          setAttendance(data);

          // Set form values
          setValue('status', data.status);
          setValue('checkInTime', data.checkInTime || '');
          setValue('checkOutTime', data.checkOutTime || '');
          setValue('notes', data.notes || '');
        } else {
          toast.error('Failed to load attendance record');
          navigation.push('/dashboard/admin/attendance');
        }
      } catch (err) {
        console.error('Error fetching attendance:', err);
        toast.error('Failed to load attendance record');
        navigation.push('/dashboard/admin/attendance');
      } finally {
        setLoading(false);
      }
    };

    if (attendanceId) {
      fetchAttendance();
    }
  }, [attendanceId, navigation, setValue]);

  const onSubmit = async (data: UpdateAttendanceFormData) => {
    setSaving(true);
    try {
      const submitData = {
        ...data,
        checkInTime: data.checkInTime || undefined,
        checkOutTime: data.checkOutTime || undefined,
        notes: data.notes || undefined,
      };
      const response = await attendanceApi.updateAttendance(attendanceId, submitData);

      if (response.success) {
        toast.success('Attendance updated successfully!');
        navigation.push(`/dashboard/admin/attendance/${attendanceId}`);
      } else {
        toast.error(response.message || 'Failed to update attendance');
      }
    } catch (error: unknown) {
      console.error('Error updating attendance:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update attendance';
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

  if (!attendance) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigation.push(`/dashboard/admin/attendance/${attendanceId}`)}
          className="cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Attendance</h1>
          <p className="text-muted-foreground">
            Update attendance record for {attendance.employee.user.firstName}{' '}
            {attendance.employee.user.lastName}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Status</CardTitle>
              <CardDescription>Update the attendance status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setValue('status', value as AttendanceStatus)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRESENT">Present</SelectItem>
                    <SelectItem value="ABSENT">Absent</SelectItem>
                    <SelectItem value="HALF_DAY">Half Day</SelectItem>
                    <SelectItem value="LEAVE">Leave</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-destructive text-sm">{errors.status.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Time Information */}
          <Card>
            <CardHeader>
              <CardTitle>Time Information</CardTitle>
              <CardDescription>Update check-in and check-out times</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="checkInTime">Check In Time (HH:MM)</Label>
                <Input
                  id="checkInTime"
                  type="time"
                  {...register('checkInTime')}
                  placeholder="09:00"
                />
                {errors.checkInTime && (
                  <p className="text-destructive text-sm">{errors.checkInTime.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkOutTime">Check Out Time (HH:MM)</Label>
                <Input
                  id="checkOutTime"
                  type="time"
                  {...register('checkOutTime')}
                  placeholder="17:00"
                />
                {errors.checkOutTime && (
                  <p className="text-destructive text-sm">{errors.checkOutTime.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>Update notes or comments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Enter any additional notes..."
                  rows={4}
                />
                {errors.notes && <p className="text-destructive text-sm">{errors.notes.message}</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigation.push(`/dashboard/admin/attendance/${attendanceId}`)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
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
      </form>
    </div>
  );
}
