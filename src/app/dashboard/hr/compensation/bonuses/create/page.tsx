'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@/hooks/use-navigation';
import { bonusApi } from '@/lib/api/compensation';
import { employeesApi } from '@/lib/api/employees';
import { createBonusSchema, type CreateBonusFormData } from '@/schemas/bonus';
import type { Employee } from '@/types';
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

export default function HRCreateBonusPage() {
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
  } = useForm<CreateBonusFormData>({
    resolver: zodResolver(createBonusSchema),
    defaultValues: {
      employeeId: '',
      title: '',
      description: '',
      type: undefined,
      amount: undefined,
      percentage: undefined,
      effectiveDate: '',
      paymentDate: '',
      criteria: '',
      notes: '',
      paymentMethod: '',
      isTaxable: true,
      taxAmount: undefined,
      netAmount: undefined,
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

  const onSubmit = async (data: CreateBonusFormData) => {
    try {
      setLoading(true);
      const response = await bonusApi.createBonus(data);

      if ('success' in response && response.success) {
        toast.success('Bonus created successfully');
        navigation.push('/dashboard/hr/compensation/bonuses');
      } else if ('message' in response && typeof response.message === 'string') {
        toast.error(response.message || 'Failed to create bonus');
      } else {
        toast.success('Bonus created successfully');
        navigation.push('/dashboard/hr/compensation/bonuses');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create bonus';
      toast.error(errorMessage);
      console.error('Error creating bonus:', error);
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
          <h1 className="text-3xl font-bold">Create Bonus</h1>
          <p className="text-muted-foreground mt-1">Add a new bonus for an employee</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Bonus Information</CardTitle>
            <CardDescription>Enter the bonus details for the employee</CardDescription>
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

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Bonus Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Q4 Performance Bonus, Annual Bonus"
                {...register('title')}
              />
              {errors.title && (
                <div className="text-destructive flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.title.message}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the reason for this bonus..."
                rows={4}
                {...register('description')}
              />
              {errors.description && (
                <div className="text-destructive flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.description.message}</span>
                </div>
              )}
            </div>

            {/* Bonus Type */}
            <div className="space-y-2">
              <Label htmlFor="type">
                Bonus Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setValue(
                    'type',
                    value as
                      | 'PERFORMANCE'
                      | 'ANNUAL'
                      | 'QUARTERLY'
                      | 'PROJECT'
                      | 'REFERRAL'
                      | 'RETENTION'
                      | 'SIGN_ON'
                      | 'MILESTONE'
                      | 'OTHER'
                  )
                }
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select bonus type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERFORMANCE">Performance</SelectItem>
                  <SelectItem value="ANNUAL">Annual</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="PROJECT">Project</SelectItem>
                  <SelectItem value="REFERRAL">Referral</SelectItem>
                  <SelectItem value="RETENTION">Retention</SelectItem>
                  <SelectItem value="SIGN_ON">Sign On</SelectItem>
                  <SelectItem value="MILESTONE">Milestone</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <div className="text-destructive flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.type.message}</span>
                </div>
              )}
            </div>

            {/* Amount and Percentage */}
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
                <Label htmlFor="percentage">Percentage of Base Salary (Optional)</Label>
                <Input
                  id="percentage"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('percentage', { valueAsNumber: true })}
                />
                {errors.percentage && (
                  <div className="text-destructive flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.percentage.message}</span>
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
                <Label htmlFor="paymentDate">Payment Date (Optional)</Label>
                <Input id="paymentDate" type="date" {...register('paymentDate')} />
                {errors.paymentDate && (
                  <div className="text-destructive flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.paymentDate.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tax Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isTaxable"
                  checked={formData.isTaxable ?? true}
                  onCheckedChange={(checked) => setValue('isTaxable', checked)}
                />
                <Label htmlFor="isTaxable" className="cursor-pointer">
                  This bonus is taxable
                </Label>
              </div>

              {formData.isTaxable && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="taxAmount">Tax Amount (Optional)</Label>
                    <Input
                      id="taxAmount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register('taxAmount', { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="netAmount">Net Amount (Optional)</Label>
                    <Input
                      id="netAmount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register('netAmount', { valueAsNumber: true })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Criteria */}
            <div className="space-y-2">
              <Label htmlFor="criteria">Performance Criteria (Optional)</Label>
              <Textarea
                id="criteria"
                placeholder="What criteria were met for this bonus?"
                rows={3}
                {...register('criteria')}
              />
              {errors.criteria && (
                <div className="text-destructive flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.criteria.message}</span>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method (Optional)</Label>
              <Input
                id="paymentMethod"
                placeholder="e.g., Direct deposit, Check"
                {...register('paymentMethod')}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
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

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Bonus'
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
