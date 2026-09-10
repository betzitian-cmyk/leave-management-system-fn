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
import { ArrowLeft, Loader2, Award } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateBonusPage() {
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

  const onSubmit = async (data: CreateBonusFormData) => {
    try {
      setLoading(true);
      const response = await bonusApi.createBonus(data);

      if ('success' in response && response.success) {
        toast.success('Bonus created successfully');
        navigation.push('/dashboard/admin/compensation');
      } else if ('message' in response && typeof response.message === 'string') {
        toast.error(response.message || 'Failed to create bonus');
      } else {
        toast.success('Bonus created successfully');
        navigation.push('/dashboard/admin/compensation');
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
          <h1 className="text-2xl font-bold tracking-tight">Create Bonus</h1>
          <p className="text-muted-foreground">Add a new bonus for an employee</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2">
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
                    <p className="text-destructive text-sm">{errors.title.message}</p>
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
                    <p className="text-destructive text-sm">{errors.description.message}</p>
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
                    <SelectTrigger>
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
                  {errors.type && <p className="text-destructive text-sm">{errors.type.message}</p>}
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
                      <p className="text-destructive text-sm">{errors.amount.message}</p>
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
                      <p className="text-destructive text-sm">{errors.percentage.message}</p>
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
                    <Label htmlFor="paymentDate">Payment Date (Optional)</Label>
                    <Input id="paymentDate" type="date" {...register('paymentDate')} />
                    {errors.paymentDate && (
                      <p className="text-destructive text-sm">{errors.paymentDate.message}</p>
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
                    <p className="text-destructive text-sm">{errors.criteria.message}</p>
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
                  <Award className="h-5 w-5" />
                  Quick Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium">Bonus Types</h4>
                  <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-4">
                    <li>Performance: Based on performance review</li>
                    <li>Annual: Yearly bonus</li>
                    <li>Quarterly: Every quarter</li>
                    <li>Project: Completion of specific project</li>
                    <li>Referral: Employee referral bonus</li>
                    <li>Sign On: New hire incentive</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium">Tax Information</h4>
                  <p className="text-muted-foreground mt-2">
                    Most bonuses are taxable. Enter tax amount if already calculated.
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
                      'Create Bonus'
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
