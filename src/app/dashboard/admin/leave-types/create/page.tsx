'use client';

import { useState } from 'react';
import { useNavigation } from '@/hooks/use-navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leaveTypesApi } from '@/lib/api/leaveTypes';
import { createLeaveTypeSchema, type CreateLeaveTypeFormData } from '@/schemas/leaveType';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateLeaveTypePage() {
  const navigation = useNavigation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateLeaveTypeFormData>({
    resolver: zodResolver(createLeaveTypeSchema),
    defaultValues: {
      active: true,
      color: '#3B82F6',
    },
  });

  const activeValue = watch('active');

  const onSubmit = async (data: CreateLeaveTypeFormData) => {
    setError(null);
    setSubmitting(true);
    try {
      const response = await leaveTypesApi.createLeaveType(data);
      if (response.success || 'id' in response) {
        toast.success('Leave type created successfully');
        navigation.push('/dashboard/admin/leave-types');
      } else {
        setError(response.message || 'Failed to create leave type');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create leave type';
      setError(errorMessage);
      console.error('Error creating leave type:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Leave Type</h1>
        <p className="text-muted-foreground">Add a new leave type for employees</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Leave Type Information
            </CardTitle>
            <CardDescription>Basic leave type details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Leave Type Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Annual Leave, Sick Leave, Maternity Leave"
                {...register('name')}
              />
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
              <p className="text-muted-foreground text-xs">
                A brief description of this leave type
              </p>
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
                <Input
                  type="text"
                  placeholder="#3B82F6"
                  className="flex-1"
                  {...register('color')}
                />
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
              <h4 className="mb-2 text-sm font-medium">What happens next?</h4>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>• Leave type will be available for employees to request</li>
                <li>• Default days will be allocated to employee leave balances</li>
                <li>• You can edit or deactivate this leave type later</li>
                <li>• Inactive leave types won&apos;t be visible to employees</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigation.push('/dashboard/admin/leave-types')}
            disabled={submitting}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} className="cursor-pointer">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Create Leave Type
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
