'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@/hooks/use-navigation';
import { bonusApi } from '@/lib/api/compensation';
import { updateBonusSchema, type UpdateBonusFormData } from '@/schemas/bonus';
import type { Bonus } from '@/types';
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

export default function HREditBonusPage() {
  const params = useParams();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [bonus, setBonus] = useState<Bonus | null>(null);

  const bonusId = params.id as string;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UpdateBonusFormData>({
    resolver: zodResolver(updateBonusSchema),
  });

  const formData = watch();

  useEffect(() => {
    const fetchBonus = async () => {
      try {
        setFetching(true);
        const response = await bonusApi.getBonusById(bonusId);

        let fetchedBonus: Bonus | null = null;
        if ('success' in response && 'data' in response) {
          fetchedBonus = response.data as Bonus;
        } else if ('id' in response) {
          fetchedBonus = response as Bonus;
        }

        if (fetchedBonus) {
          setBonus(fetchedBonus);
          reset({
            title: fetchedBonus.title,
            description: fetchedBonus.description,
            type: fetchedBonus.type,
            amount: fetchedBonus.amount,
            percentage: fetchedBonus.percentage || undefined,
            effectiveDate: fetchedBonus.effectiveDate.split('T')[0],
            paymentDate: fetchedBonus.paymentDate
              ? fetchedBonus.paymentDate.split('T')[0]
              : undefined,
            status: fetchedBonus.status,
            criteria: fetchedBonus.criteria || undefined,
            notes: fetchedBonus.notes || undefined,
            paymentMethod: fetchedBonus.paymentMethod || undefined,
            referenceNumber: fetchedBonus.referenceNumber || undefined,
            isTaxable: fetchedBonus.isTaxable,
            taxAmount: fetchedBonus.taxAmount || undefined,
            netAmount: fetchedBonus.netAmount || undefined,
            rejectionReason: fetchedBonus.rejectionReason || undefined,
          });
        } else {
          toast.error('Failed to load bonus');
        }
      } catch (error) {
        console.error('Error fetching bonus:', error);
        toast.error('Failed to load bonus');
      } finally {
        setFetching(false);
      }
    };

    if (bonusId) {
      fetchBonus();
    }
  }, [bonusId, reset]);

  const onSubmit = async (data: UpdateBonusFormData) => {
    try {
      setLoading(true);
      const response = await bonusApi.updateBonus(bonusId, data);

      if ('success' in response && response.success) {
        toast.success('Bonus updated successfully');
        navigation.push(`/dashboard/hr/compensation/bonuses/${bonusId}`);
      } else if ('message' in response && typeof response.message === 'string') {
        toast.error(response.message || 'Failed to update bonus');
      } else {
        toast.success('Bonus updated successfully');
        navigation.push(`/dashboard/hr/compensation/bonuses/${bonusId}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update bonus';
      toast.error(errorMessage);
      console.error('Error updating bonus:', error);
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

  if (!bonus) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <h3 className="text-lg font-semibold">Bonus not found</h3>
        <Button
          onClick={() => navigation.push('/dashboard/hr/compensation/bonuses')}
          className="mt-4 cursor-pointer"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Bonuses
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
          <h1 className="text-3xl font-bold">Edit Bonus</h1>
          <p className="text-muted-foreground mt-1">
            Update bonus for {bonus.employee.firstName} {bonus.employee.lastName}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Bonus Information</CardTitle>
            <CardDescription>Update the bonus details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Bonus Title</Label>
              <Input id="title" {...register('title')} />
              {errors.title && (
                <div className="text-destructive flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.title.message}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={4} {...register('description')} />
              {errors.description && (
                <div className="text-destructive flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.description.message}</span>
                </div>
              )}
            </div>

            {/* Type and Status */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Bonus Type</Label>
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
                    <SelectValue />
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setValue(
                      'status',
                      value as 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED' | 'REJECTED'
                    )
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Amount and Percentage */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
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
                <Label htmlFor="percentage">Percentage</Label>
                <Input
                  id="percentage"
                  type="number"
                  step="0.01"
                  {...register('percentage', { valueAsNumber: true })}
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="effectiveDate">Effective Date</Label>
                <Input id="effectiveDate" type="date" {...register('effectiveDate')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentDate">Payment Date</Label>
                <Input id="paymentDate" type="date" {...register('paymentDate')} />
              </div>
            </div>

            {/* Tax Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isTaxable"
                  checked={formData.isTaxable ?? false}
                  onCheckedChange={(checked) => setValue('isTaxable', checked)}
                />
                <Label htmlFor="isTaxable" className="cursor-pointer">
                  This bonus is taxable
                </Label>
              </div>

              {formData.isTaxable && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="taxAmount">Tax Amount</Label>
                    <Input
                      id="taxAmount"
                      type="number"
                      step="0.01"
                      {...register('taxAmount', { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="netAmount">Net Amount</Label>
                    <Input
                      id="netAmount"
                      type="number"
                      step="0.01"
                      {...register('netAmount', { valueAsNumber: true })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Criteria */}
            <div className="space-y-2">
              <Label htmlFor="criteria">Performance Criteria</Label>
              <Textarea id="criteria" rows={3} {...register('criteria')} />
            </div>

            {/* Payment Method and Reference */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Input id="paymentMethod" {...register('paymentMethod')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="referenceNumber">Reference Number</Label>
                <Input id="referenceNumber" {...register('referenceNumber')} />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={4} {...register('notes')} />
            </div>

            {/* Rejection Reason */}
            {formData.status === 'REJECTED' && (
              <div className="space-y-2">
                <Label htmlFor="rejectionReason">Rejection Reason</Label>
                <Textarea id="rejectionReason" rows={3} {...register('rejectionReason')} />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Bonus'
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
