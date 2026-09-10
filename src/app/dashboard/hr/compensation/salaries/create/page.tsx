'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@/hooks/use-navigation';
import { salaryApi } from '@/lib/api/compensation';
import { employeesApi } from '@/lib/api/employees';
import { createSalarySchema, type CreateSalaryFormData } from '@/schemas/salary';
import type { Employee } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function HRCreateSalaryPage() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [fetchingEmployees, setFetchingEmployees] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateSalaryFormData>({
    resolver: zodResolver(createSalarySchema),
    defaultValues: {
      employeeId: '',
      type: undefined,
      amount: undefined,
      payFrequency: undefined,
      effectiveDate: '',
      endDate: '',
      reason: '',
      notes: '',
      percentageIncrease: undefined,
      previousAmount: undefined,
    },
  });

  const formData = watch();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setFetchingEmployees(true);
      const response = await employeesApi.getAllEmployees();

      if ('success' in response && 'data' in response && response.success && response.data) {
        const responseData = response.data as Employee[] | { data: Employee[] };
        if (Array.isArray(responseData)) {
          setEmployees(responseData);
        } else if ('data' in responseData && Array.isArray(responseData.data)) {
          setEmployees(responseData.data);
        }
      } else if (Array.isArray(response)) {
        setEmployees(response);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    } finally {
      setFetchingEmployees(false);
    }
  };

  const onSubmit = async (data: CreateSalaryFormData) => {
    try {
      setLoading(true);
      const response = await salaryApi.createSalary(data);

      if ('success' in response && response.success) {
        toast.success('Salary created successfully');
        navigation.push('/dashboard/hr/compensation/salaries');
      } else if ('message' in response && typeof response.message === 'string') {
        toast.error(response.message || 'Failed to create salary');
      } else {
        toast.success('Salary created successfully');
        navigation.push('/dashboard/hr/compensation/salaries');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create salary';
      toast.error(errorMessage);
      console.error('Error creating salary:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigation.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Salary Record</h1>
          <p className="text-muted-foreground mt-1">Add a new salary record for an employee</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Salary Information</CardTitle>
            <CardDescription>Enter the salary details for the employee</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Employee Selection */}
            <div className="space-y-2">
              <Label htmlFor="employeeId">
                Employee <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.employeeId}
                onValueChange={(value) => setValue('employeeId', value)}
                disabled={fetchingEmployees}
              >
                <SelectTrigger id="employeeId">
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.user.firstName} {employee.user.lastName} - {employee.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.employeeId && (
                <div className="text-destructive flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.employeeId.message}</span>
                </div>
              )}
            </div>

            {/* Salary Type */}
            <div className="space-y-2">
              <Label htmlFor="type">
                Salary Type <span className="text-destructive">*</span>
              </Label>
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
                <Label htmlFor="amount">
                  Amount <span className="text-destructive">*</span>
                </Label>
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
                <Label htmlFor="payFrequency">
                  Pay Frequency <span className="text-destructive">*</span>
                </Label>
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
                <Label htmlFor="effectiveDate">
                  Effective Date <span className="text-destructive">*</span>
                </Label>
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
                <Label htmlFor="previousAmount">Previous Amount (Optional)</Label>
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
                <Label htmlFor="percentageIncrease">Percentage Increase (Optional)</Label>
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
              <Label htmlFor="reason">Reason (Optional)</Label>
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
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes about this salary record..."
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

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Salary Record'
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
