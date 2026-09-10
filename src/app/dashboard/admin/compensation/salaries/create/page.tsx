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
import { ArrowLeft, Loader2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateSalaryPage() {
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
  });

  const formData = watch();

  useEffect(() => {
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
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast.error('Failed to fetch employees');
      } finally {
        setFetchingEmployees(false);
      }
    };

    fetchEmployees();
  }, []);

  const onSubmit = async (data: CreateSalaryFormData) => {
    try {
      setLoading(true);
      const response = await salaryApi.createSalary(data);

      if ('success' in response && response.success) {
        toast.success('Salary created successfully');
        navigation.push('/dashboard/admin/compensation');
      } else if ('message' in response && typeof response.message === 'string') {
        toast.error(response.message || 'Failed to create salary');
      } else {
        toast.success('Salary created successfully');
        navigation.push('/dashboard/admin/compensation');
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigation.push('/dashboard/admin/compensation')}
          className="cursor-pointer"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Salary Record</h1>
          <p className="text-muted-foreground">Add a new salary record for an employee</p>
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
                    <SelectTrigger>
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
                    <p className="text-destructive text-sm">{errors.employeeId.message}</p>
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
                      <p className="text-destructive text-sm">{errors.amount.message}</p>
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
                    <Label htmlFor="effectiveDate">
                      Effective Date <span className="text-destructive">*</span>
                    </Label>
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
                    <Label htmlFor="previousAmount">Previous Amount (Optional)</Label>
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
                    <Label htmlFor="percentageIncrease">Percentage Increase (Optional)</Label>
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
                  <Label htmlFor="reason">Reason (Optional)</Label>
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
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any additional notes about this salary record..."
                    rows={4}
                    {...register('notes')}
                  />
                  {errors.notes && (
                    <p className="text-destructive text-sm">{errors.notes.message}</p>
                  )}
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
                  Quick Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium">Salary Types</h4>
                  <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-4">
                    <li>Base Salary: Regular fixed salary</li>
                    <li>Hourly Rate: Pay per hour worked</li>
                    <li>Commission: Sales-based compensation</li>
                    <li>Bonus: One-time additional payment</li>
                    <li>Allowance: Special allowances</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium">Pay Frequency</h4>
                  <p className="text-muted-foreground mt-2">
                    Choose how often the employee receives this compensation.
                  </p>
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
                        Creating...
                      </>
                    ) : (
                      'Create Salary Record'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full cursor-pointer"
                    onClick={() => navigation.push('/dashboard/admin/compensation')}
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
