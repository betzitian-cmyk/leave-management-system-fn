'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@/hooks/use-navigation';
import { salaryApi } from '@/lib/api/compensation';
import { updateSalarySchema, type UpdateSalaryFormData } from '@/schemas/salary';
import type { Salary } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function HREditSalaryPage() {
  const params = useParams();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [salary, setSalary] = useState<Salary | null>(null);

  const salaryId = params.id as string;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UpdateSalaryFormData>({
    resolver: zodResolver(updateSalarySchema),
  });

  const formData = watch();

  useEffect(() => {
    const fetchSalary = async () => {
      try {
        setFetching(true);
        const response = await salaryApi.getSalaryById(salaryId);

        let fetchedSalary: Salary | null = null;
        if ('success' in response && 'data' in response) {
          fetchedSalary = response.data as Salary;
        } else if ('id' in response) {
          fetchedSalary = response as Salary;
        }

        if (fetchedSalary) {
          setSalary(fetchedSalary);
          reset({
            type: fetchedSalary.type,
            amount: fetchedSalary.amount,
            payFrequency: fetchedSalary.payFrequency,
            effectiveDate: fetchedSalary.effectiveDate.split('T')[0],
            endDate: fetchedSalary.endDate ? fetchedSalary.endDate.split('T')[0] : undefined,
            reason: fetchedSalary.reason || undefined,
            notes: fetchedSalary.notes || undefined,
            percentageIncrease: fetchedSalary.percentageIncrease || undefined,
            previousAmount: fetchedSalary.previousAmount || undefined,
            isActive: fetchedSalary.isActive,
          });
        } else {
          toast.error('Failed to load salary record');
        }
      } catch (error) {
        console.error('Error fetching salary:', error);
        toast.error('Failed to load salary record');
      } finally {
        setFetching(false);
      }
    };

    if (salaryId) {
      fetchSalary();
    }
  }, [salaryId, reset]);

  const onSubmit = async (data: UpdateSalaryFormData) => {
    try {
      setLoading(true);
      const response = await salaryApi.updateSalary(salaryId, data);

      if ('success' in response && response.success) {
        toast.success('Salary updated successfully');
        navigation.push(`/dashboard/hr/compensation/salaries/${salaryId}`);
      } else if ('message' in response && typeof response.message === 'string') {
        toast.error(response.message || 'Failed to update salary');
      } else {
        toast.success('Salary updated successfully');
        navigation.push(`/dashboard/hr/compensation/salaries/${salaryId}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update salary';
      toast.error(errorMessage);
      console.error('Error updating salary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!salary) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <h3 className="text-lg font-semibold">Salary record not found</h3>
        <Button
          onClick={() => navigation.push('/dashboard/hr/compensation/salaries')}
          className="mt-4 cursor-pointer"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Salaries
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigation.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Salary Record</h1>
          <p className="text-muted-foreground mt-1">
            Update salary information for {salary.employee.firstName} {salary.employee.lastName}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Salary Information</CardTitle>
            <CardDescription>Update the salary details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Salary Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Salary Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setValue(
                    'type',
                    value as 'BASE_SALARY' | 'HOURLY_RATE' | 'COMMISSION' | 'BONUS' | 'ALLOWANCE'
                  )
                }
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select salary type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BASE_SALARY">Base Salary</SelectItem>
                  <SelectItem value="HOURLY_RATE">Hourly Rate</SelectItem>
                  <SelectItem value="COMMISSION">Commission</SelectItem>
                  <SelectItem value="BONUS">Bonus</SelectItem>
                  <SelectItem value="ALLOWANCE">Allowance</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <div className="text-destructive flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.type.message}</span>
                </div>
              )}
            </div>

            {/* Amount and Pay Frequency */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('amount', { valueAsNumber: true })}
                />
                {errors.amount && (
                  <div className="text-destructive flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.amount.message}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="payFrequency">Pay Frequency</Label>
                <Select
                  value={formData.payFrequency}
                  onValueChange={(value) =>
                    setValue(
                      'payFrequency',
                      value as 'HOURLY' | 'DAILY' | 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY' | 'ANNUALLY'
                    )
                  }
                >
                  <SelectTrigger id="payFrequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOURLY">Hourly</SelectItem>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="BI_WEEKLY">Bi-Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="ANNUALLY">Annually</SelectItem>
                  </SelectContent>
                </Select>
                {errors.payFrequency && (
                  <div className="text-destructive flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.payFrequency.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="effectiveDate">Effective Date</Label>
                <Input id="effectiveDate" type="date" {...register('effectiveDate')} />
                {errors.effectiveDate && (
                  <div className="text-destructive flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.effectiveDate.message}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input id="endDate" type="date" {...register('endDate')} />
                {errors.endDate && (
                  <div className="text-destructive flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.endDate.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Previous Amount and Percentage Increase */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="previousAmount">Previous Amount</Label>
                <Input
                  id="previousAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('previousAmount', { valueAsNumber: true })}
                />
                {errors.previousAmount && (
                  <div className="text-destructive flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.previousAmount.message}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="percentageIncrease">Percentage Increase</Label>
                <Input
                  id="percentageIncrease"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('percentageIncrease', { valueAsNumber: true })}
                />
                {errors.percentageIncrease && (
                  <div className="text-destructive flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.percentageIncrease.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                placeholder="e.g., Annual increment, Promotion, etc."
                {...register('reason')}
              />
              {errors.reason && (
                <div className="text-destructive flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.reason.message}</span>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes..."
                rows={4}
                {...register('notes')}
              />
              {errors.notes && (
                <div className="text-destructive flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.notes.message}</span>
                </div>
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setValue('isActive', checked)}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active Status
              </Label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Salary Record'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigation.back()}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
