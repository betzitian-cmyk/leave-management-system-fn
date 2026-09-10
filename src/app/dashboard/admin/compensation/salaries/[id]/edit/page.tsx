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
import { ArrowLeft, Loader2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function EditSalaryPage() {
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
          // Set form values
          setValue('type', fetchedSalary.type);
          setValue('amount', fetchedSalary.amount);
          setValue('payFrequency', fetchedSalary.payFrequency);
          setValue('effectiveDate', fetchedSalary.effectiveDate.split('T')[0]);
          if (fetchedSalary.endDate) {
            setValue('endDate', fetchedSalary.endDate.split('T')[0]);
          }
          if (fetchedSalary.reason) setValue('reason', fetchedSalary.reason);
          if (fetchedSalary.notes) setValue('notes', fetchedSalary.notes);
          if (fetchedSalary.percentageIncrease) {
            setValue('percentageIncrease', fetchedSalary.percentageIncrease);
          }
          if (fetchedSalary.previousAmount)
            setValue('previousAmount', fetchedSalary.previousAmount);
          setValue('isActive', fetchedSalary.isActive);
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
  }, [salaryId, setValue]);

  const onSubmit = async (data: UpdateSalaryFormData) => {
    try {
      setLoading(true);
      const response = await salaryApi.updateSalary(salaryId, data);

      if ('success' in response && response.success) {
        toast.success('Salary updated successfully');
        navigation.push(`/dashboard/admin/compensation/salaries/${salaryId}`);
      } else if ('message' in response && typeof response.message === 'string') {
        toast.error(response.message || 'Failed to update salary');
      } else {
        toast.success('Salary updated successfully');
        navigation.push(`/dashboard/admin/compensation/salaries/${salaryId}`);
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
        <DollarSign className="text-muted-foreground mb-4 h-12 w-12" />
        <h3 className="text-lg font-semibold">Salary record not found</h3>
        <Button
          onClick={() => navigation.push('/dashboard/admin/compensation')}
          className="mt-4 cursor-pointer"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Compensation
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigation.push(`/dashboard/admin/compensation/salaries/${salaryId}`)}
          className="cursor-pointer"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Salary Record</h1>
          <p className="text-muted-foreground">
            Update salary information for {salary.employee.firstName} {salary.employee.lastName}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2">
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
                        value as
                          | 'BASE_SALARY'
                          | 'HOURLY_RATE'
                          | 'COMMISSION'
                          | 'BONUS'
                          | 'ALLOWANCE'
                      )
                    }
                  >
                    <SelectTrigger>
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
                  {errors.type && <p className="text-destructive text-sm">{errors.type.message}</p>}
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
                      <p className="text-destructive text-sm">{errors.amount.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payFrequency">Pay Frequency</Label>
                    <Select
                      value={formData.payFrequency}
                      onValueChange={(value) =>
                        setValue(
                          'payFrequency',
                          value as
                            | 'HOURLY'
                            | 'DAILY'
                            | 'WEEKLY'
                            | 'BI_WEEKLY'
                            | 'MONTHLY'
                            | 'ANNUALLY'
                        )
                      }
                    >
                      <SelectTrigger>
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
                      <p className="text-destructive text-sm">{errors.payFrequency.message}</p>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="effectiveDate">Effective Date</Label>
                    <Input id="effectiveDate" type="date" {...register('effectiveDate')} />
                    {errors.effectiveDate && (
                      <p className="text-destructive text-sm">{errors.effectiveDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date (Optional)</Label>
                    <Input id="endDate" type="date" {...register('endDate')} />
                    {errors.endDate && (
                      <p className="text-destructive text-sm">{errors.endDate.message}</p>
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
                      <p className="text-destructive text-sm">{errors.previousAmount.message}</p>
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
                      <p className="text-destructive text-sm">
                        {errors.percentageIncrease.message}
                      </p>
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
                    <p className="text-destructive text-sm">{errors.reason.message}</p>
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
                    <p className="text-destructive text-sm">{errors.notes.message}</p>
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
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-6 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Employee Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">
                    {salary.employee.firstName} {salary.employee.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Position</p>
                  <p className="font-medium">{salary.employee.position}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Department</p>
                  <p className="font-medium">{salary.employee.department.name}</p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
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
                    className="w-full cursor-pointer"
                    onClick={() =>
                      navigation.push(`/dashboard/admin/compensation/salaries/${salaryId}`)
                    }
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
