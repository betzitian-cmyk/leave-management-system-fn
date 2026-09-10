'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@/hooks/use-navigation';
import { benefitApi } from '@/lib/api/compensation';
import { updateBenefitSchema, type UpdateBenefitFormData } from '@/schemas/benefit';
import type { Benefit } from '@/types';
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
import { ArrowLeft, Loader2, AlertCircle, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export default function HREditBenefitPage() {
  const params = useParams();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [benefit, setBenefit] = useState<Benefit | null>(null);
  const [eligibilityCriteria, setEligibilityCriteria] = useState<string[]>([]);
  const [documentsRequired, setDocumentsRequired] = useState<string[]>([]);
  const [newCriterion, setNewCriterion] = useState('');
  const [newDocument, setNewDocument] = useState('');

  const benefitId = params.id as string;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UpdateBenefitFormData>({
    resolver: zodResolver(updateBenefitSchema),
  });

  const formData = watch();

  useEffect(() => {
    const fetchBenefit = async () => {
      try {
        setFetching(true);
        const response = await benefitApi.getBenefitById(benefitId);

        let fetchedBenefit: Benefit | null = null;
        if ('success' in response && 'data' in response) {
          fetchedBenefit = response.data as Benefit;
        } else if ('id' in response) {
          fetchedBenefit = response as Benefit;
        }

        if (fetchedBenefit) {
          setBenefit(fetchedBenefit);
          reset({
            name: fetchedBenefit.name,
            description: fetchedBenefit.description,
            type: fetchedBenefit.type,
            category: fetchedBenefit.category,
            cost: fetchedBenefit.cost || undefined,
            employeeContribution: fetchedBenefit.employeeContribution || undefined,
            employeeContributionPercentage:
              fetchedBenefit.employeeContributionPercentage || undefined,
            isActive: fetchedBenefit.isActive,
            requiresEnrollment: fetchedBenefit.requiresEnrollment,
            provider: fetchedBenefit.provider || undefined,
            contactInfo: fetchedBenefit.contactInfo || undefined,
            effectiveDate: fetchedBenefit.effectiveDate
              ? fetchedBenefit.effectiveDate.split('T')[0]
              : undefined,
            endDate: fetchedBenefit.endDate ? fetchedBenefit.endDate.split('T')[0] : undefined,
            notes: fetchedBenefit.notes || undefined,
            eligibilityCriteria: fetchedBenefit.eligibilityCriteria || undefined,
            documentsRequired: fetchedBenefit.documentsRequired || undefined,
          });
          if (fetchedBenefit.eligibilityCriteria) {
            setEligibilityCriteria(fetchedBenefit.eligibilityCriteria);
          }
          if (fetchedBenefit.documentsRequired) {
            setDocumentsRequired(fetchedBenefit.documentsRequired);
          }
        } else {
          toast.error('Failed to load benefit');
        }
      } catch (error) {
        console.error('Error fetching benefit:', error);
        toast.error('Failed to load benefit');
      } finally {
        setFetching(false);
      }
    };

    if (benefitId) {
      fetchBenefit();
    }
  }, [benefitId, reset]);

  const addCriterion = () => {
    if (newCriterion.trim()) {
      const updated = [...eligibilityCriteria, newCriterion.trim()];
      setEligibilityCriteria(updated);
      setValue('eligibilityCriteria', updated);
      setNewCriterion('');
    }
  };

  const removeCriterion = (index: number) => {
    const updated = eligibilityCriteria.filter((_, i) => i !== index);
    setEligibilityCriteria(updated);
    setValue('eligibilityCriteria', updated.length > 0 ? updated : undefined);
  };

  const addDocument = () => {
    if (newDocument.trim()) {
      const updated = [...documentsRequired, newDocument.trim()];
      setDocumentsRequired(updated);
      setValue('documentsRequired', updated);
      setNewDocument('');
    }
  };

  const removeDocument = (index: number) => {
    const updated = documentsRequired.filter((_, i) => i !== index);
    setDocumentsRequired(updated);
    setValue('documentsRequired', updated.length > 0 ? updated : undefined);
  };

  const onSubmit = async (data: UpdateBenefitFormData) => {
    try {
      setLoading(true);
      const response = await benefitApi.updateBenefit(benefitId, data);

      if ('success' in response && response.success) {
        toast.success('Benefit updated successfully');
        navigation.push(`/dashboard/hr/compensation/benefits/${benefitId}`);
      } else if ('message' in response && typeof response.message === 'string') {
        toast.error(response.message || 'Failed to update benefit');
      } else {
        toast.success('Benefit updated successfully');
        navigation.push(`/dashboard/hr/compensation/benefits/${benefitId}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update benefit';
      toast.error(errorMessage);
      console.error('Error updating benefit:', error);
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

  if (!benefit) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <h3 className="text-lg font-semibold">Benefit not found</h3>
        <Button
          onClick={() => navigation.push('/dashboard/hr/compensation/benefits')}
          className="mt-4 cursor-pointer"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Benefits
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
          <h1 className="text-3xl font-bold">Edit Benefit</h1>
          <p className="text-muted-foreground mt-1">Update benefit information</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Benefit Information</CardTitle>
            <CardDescription>Update the benefit details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Benefit Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && (
                <div className="text-destructive flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.name.message}</span>
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

            {/* Type and Category */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setValue(
                      'type',
                      value as
                        | 'HEALTH_INSURANCE'
                        | 'DENTAL_INSURANCE'
                        | 'VISION_INSURANCE'
                        | 'LIFE_INSURANCE'
                        | 'DISABILITY_INSURANCE'
                        | 'RETIREMENT_PLAN'
                        | 'PAID_TIME_OFF'
                        | 'SICK_LEAVE'
                        | 'MATERNITY_LEAVE'
                        | 'PATERNITY_LEAVE'
                        | 'EDUCATION_REIMBURSEMENT'
                        | 'TRANSPORTATION'
                        | 'MEAL_ALLOWANCE'
                        | 'GYM_MEMBERSHIP'
                        | 'OTHER'
                    )
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HEALTH_INSURANCE">Health Insurance</SelectItem>
                    <SelectItem value="DENTAL_INSURANCE">Dental Insurance</SelectItem>
                    <SelectItem value="VISION_INSURANCE">Vision Insurance</SelectItem>
                    <SelectItem value="LIFE_INSURANCE">Life Insurance</SelectItem>
                    <SelectItem value="DISABILITY_INSURANCE">Disability Insurance</SelectItem>
                    <SelectItem value="RETIREMENT_PLAN">Retirement Plan</SelectItem>
                    <SelectItem value="PAID_TIME_OFF">Paid Time Off</SelectItem>
                    <SelectItem value="SICK_LEAVE">Sick Leave</SelectItem>
                    <SelectItem value="MATERNITY_LEAVE">Maternity Leave</SelectItem>
                    <SelectItem value="PATERNITY_LEAVE">Paternity Leave</SelectItem>
                    <SelectItem value="EDUCATION_REIMBURSEMENT">Education Reimbursement</SelectItem>
                    <SelectItem value="TRANSPORTATION">Transportation</SelectItem>
                    <SelectItem value="MEAL_ALLOWANCE">Meal Allowance</SelectItem>
                    <SelectItem value="GYM_MEMBERSHIP">Gym Membership</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setValue(
                      'category',
                      value as
                        | 'INSURANCE'
                        | 'RETIREMENT'
                        | 'TIME_OFF'
                        | 'WELLNESS'
                        | 'PROFESSIONAL_DEVELOPMENT'
                        | 'LIFESTYLE'
                    )
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INSURANCE">Insurance</SelectItem>
                    <SelectItem value="RETIREMENT">Retirement</SelectItem>
                    <SelectItem value="TIME_OFF">Time Off</SelectItem>
                    <SelectItem value="WELLNESS">Wellness</SelectItem>
                    <SelectItem value="PROFESSIONAL_DEVELOPMENT">
                      Professional Development
                    </SelectItem>
                    <SelectItem value="LIFESTYLE">Lifestyle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cost Information */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="cost">Company Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  {...register('cost', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeContribution">Employee Amount</Label>
                <Input
                  id="employeeContribution"
                  type="number"
                  step="0.01"
                  {...register('employeeContribution', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeContributionPercentage">Employee %</Label>
                <Input
                  id="employeeContributionPercentage"
                  type="number"
                  step="0.01"
                  {...register('employeeContributionPercentage', { valueAsNumber: true })}
                />
              </div>
            </div>

            {/* Provider and Contact */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Input id="provider" {...register('provider')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactInfo">Contact Info</Label>
                <Input id="contactInfo" {...register('contactInfo')} />
              </div>
            </div>

            {/* Dates */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="effectiveDate">Effective Date</Label>
                <Input id="effectiveDate" type="date" {...register('effectiveDate')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" {...register('endDate')} />
              </div>
            </div>

            {/* Switches */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="requiresEnrollment"
                  checked={formData.requiresEnrollment ?? false}
                  onCheckedChange={(checked) => setValue('requiresEnrollment', checked)}
                />
                <Label htmlFor="requiresEnrollment" className="cursor-pointer">
                  Requires Employee Enrollment
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive ?? false}
                  onCheckedChange={(checked) => setValue('isActive', checked)}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Active Status
                </Label>
              </div>
            </div>

            {/* Eligibility Criteria */}
            <div className="space-y-2">
              <Label>Eligibility Criteria</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add criterion"
                  value={newCriterion}
                  onChange={(e) => setNewCriterion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCriterion())}
                />
                <Button type="button" onClick={addCriterion} size="sm" className="cursor-pointer">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {eligibilityCriteria.length > 0 && (
                <div className="mt-2 space-y-2">
                  {eligibilityCriteria.map((criterion, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <span className="text-sm">{criterion}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCriterion(index)}
                        className="cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Required Documents */}
            <div className="space-y-2">
              <Label>Required Documents</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add document"
                  value={newDocument}
                  onChange={(e) => setNewDocument(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDocument())}
                />
                <Button type="button" onClick={addDocument} size="sm" className="cursor-pointer">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {documentsRequired.length > 0 && (
                <div className="mt-2 space-y-2">
                  {documentsRequired.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <span className="text-sm">{doc}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(index)}
                        className="cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={3} {...register('notes')} />
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
                  'Update Benefit'
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
