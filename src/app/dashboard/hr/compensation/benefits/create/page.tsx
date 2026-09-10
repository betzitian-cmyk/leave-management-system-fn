'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@/hooks/use-navigation';
import { benefitApi } from '@/lib/api/compensation';
import { createBenefitSchema, type CreateBenefitFormData } from '@/schemas/benefit';
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

export default function HRCreateBenefitPage() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [eligibilityCriteria, setEligibilityCriteria] = useState<string[]>([]);
  const [documentsRequired, setDocumentsRequired] = useState<string[]>([]);
  const [newCriterion, setNewCriterion] = useState('');
  const [newDocument, setNewDocument] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateBenefitFormData>({
    resolver: zodResolver(createBenefitSchema),
    defaultValues: {
      name: '',
      description: '',
      type: undefined,
      category: undefined,
      cost: undefined,
      employeeContribution: undefined,
      employeeContributionPercentage: undefined,
      requiresEnrollment: false,
      effectiveDate: '',
      endDate: '',
      eligibilityCriteria: undefined,
      documentsRequired: undefined,
      provider: '',
      contactInfo: '',
      notes: '',
    },
  });

  const formData = watch();

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

  const onSubmit = async (data: CreateBenefitFormData) => {
    try {
      setLoading(true);
      const response = await benefitApi.createBenefit(data);

      if ('success' in response && response.success) {
        toast.success('Benefit created successfully');
        navigation.push('/dashboard/hr/compensation/benefits');
      } else if ('message' in response && typeof response.message === 'string') {
        toast.error(response.message || 'Failed to create benefit');
      } else {
        toast.success('Benefit created successfully');
        navigation.push('/dashboard/hr/compensation/benefits');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create benefit';
      toast.error(errorMessage);
      console.error('Error creating benefit:', error);
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
          <h1 className="text-3xl font-bold">Create Benefit</h1>
          <p className="text-muted-foreground mt-1">Add a new employee benefit</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Benefit Information</CardTitle>
            <CardDescription>Enter the benefit details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Benefit Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Health Insurance, Dental Plan"
                {...register('name')}
              />
              {errors.name && (
                <div className="text-destructive flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.name.message}</span>
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
                placeholder="Describe the benefit and what it covers..."
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

            {/* Type and Category */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">
                  Type <span className="text-destructive">*</span>
                </Label>
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
                    <SelectValue placeholder="Select type" />
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
                {errors.type && (
                  <div className="text-destructive flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.type.message}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
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
                    <SelectValue placeholder="Select category" />
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
                {errors.category && (
                  <div className="text-destructive flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.category.message}</span>
                  </div>
                )}
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
                  placeholder="0.00"
                  {...register('cost', { valueAsNumber: true })}
                />
                {errors.cost && (
                  <div className="text-destructive flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.cost.message}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeContribution">Employee Amount</Label>
                <Input
                  id="employeeContribution"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('employeeContribution', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeContributionPercentage">Employee %</Label>
                <Input
                  id="employeeContributionPercentage"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('employeeContributionPercentage', { valueAsNumber: true })}
                />
              </div>
            </div>

            {/* Provider and Contact */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Input id="provider" placeholder="e.g., Blue Cross" {...register('provider')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactInfo">Contact Info</Label>
                <Input id="contactInfo" placeholder="Phone or email" {...register('contactInfo')} />
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

            {/* Requires Enrollment */}
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

            {/* Eligibility Criteria */}
            <div className="space-y-2">
              <Label>Eligibility Criteria</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Full-time employees only"
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
                  placeholder="e.g., Medical certificate"
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
              <Textarea
                id="notes"
                placeholder="Additional information..."
                rows={3}
                {...register('notes')}
              />
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
                  'Create Benefit'
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
