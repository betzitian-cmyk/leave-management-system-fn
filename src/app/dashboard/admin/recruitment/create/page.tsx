'use client';

import { useState, useEffect } from 'react';
import { useNavigation } from '@/hooks/use-navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { jobPostingsApi } from '@/lib/api/recruitment';
import { departmentsApi } from '@/lib/api/departments';
import { createJobPostingSchema, type CreateJobPostingFormData } from '@/schemas/jobPosting';
import type { Department } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Briefcase, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateJobPostingPage() {
  const navigation = useNavigation();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requirements, setRequirements] = useState<string[]>(['']);
  const [responsibilities, setResponsibilities] = useState<string[]>(['']);
  const [benefits, setBenefits] = useState<string[]>(['']);
  const [showSalaryRange, setShowSalaryRange] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateJobPostingFormData>({
    resolver: zodResolver(createJobPostingSchema),
    defaultValues: {
      title: '',
      description: '',
      departmentId: '',
      location: '',
      type: 'FULL_TIME',
      experienceLevel: 'MID',
      applicationDeadline: '',
    },
  });

  const formData = watch();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await departmentsApi.getAllDepartments();

        // Handle both wrapped and direct responses
        if ('success' in response && 'data' in response && response.success && response.data) {
          setDepartments(response.data);
        } else if (Array.isArray(response)) {
          setDepartments(response as Department[]);
        }
      } catch (err) {
        console.error('Error fetching departments:', err);
        toast.error('Failed to load departments');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const onSubmit = async (data: CreateJobPostingFormData) => {
    setSubmitting(true);
    try {
      // Filter out empty requirements and responsibilities
      const filteredRequirements = requirements.filter((r) => r.trim() !== '');
      const filteredResponsibilities = responsibilities.filter((r) => r.trim() !== '');
      const filteredBenefits = benefits.filter((b) => b.trim() !== '');

      if (filteredRequirements.length === 0) {
        toast.error('Please add at least one requirement');
        setSubmitting(false);
        return;
      }

      if (filteredResponsibilities.length === 0) {
        toast.error('Please add at least one responsibility');
        setSubmitting(false);
        return;
      }

      const submitData = {
        ...data,
        requirements: filteredRequirements,
        responsibilities: filteredResponsibilities,
        benefits: filteredBenefits.length > 0 ? filteredBenefits : undefined,
      };

      const response = await jobPostingsApi.createJobPosting(submitData);

      if ('success' in response && response.success) {
        toast.success('Job posting created successfully');
        navigation.push('/dashboard/admin/recruitment');
      } else if ('message' in response && typeof response.message === 'string') {
        toast.error(response.message || 'Failed to create job posting');
      } else {
        toast.success('Job posting created successfully');
        navigation.push('/dashboard/admin/recruitment');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create job posting';
      toast.error(errorMessage);
      console.error('Error creating job posting:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const addRequirement = () => {
    setRequirements([...requirements, '']);
  };

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const updateRequirement = (index: number, value: string) => {
    const updated = [...requirements];
    updated[index] = value;
    setRequirements(updated);
  };

  const addResponsibility = () => {
    setResponsibilities([...responsibilities, '']);
  };

  const removeResponsibility = (index: number) => {
    setResponsibilities(responsibilities.filter((_, i) => i !== index));
  };

  const updateResponsibility = (index: number, value: string) => {
    const updated = [...responsibilities];
    updated[index] = value;
    setResponsibilities(updated);
  };

  const addBenefit = () => {
    setBenefits([...benefits, '']);
  };

  const removeBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };

  const updateBenefit = (index: number, value: string) => {
    const updated = [...benefits];
    updated[index] = value;
    setBenefits(updated);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Job Posting</h1>
        <p className="text-muted-foreground">
          Create a new job posting to attract qualified candidates
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Essential details about the position</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Senior Software Engineer"
                  {...register('title')}
                />
                {errors.title && <p className="text-destructive text-sm">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="departmentId">Department *</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) => setValue('departmentId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.departmentId && (
                  <p className="text-destructive text-sm">{errors.departmentId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="e.g., New York, NY / Remote"
                  {...register('location')}
                />
                {errors.location && (
                  <p className="text-destructive text-sm">{errors.location.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Employment Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setValue('type', value as 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULL_TIME">Full-Time</SelectItem>
                    <SelectItem value="PART_TIME">Part-Time</SelectItem>
                    <SelectItem value="CONTRACT">Contract</SelectItem>
                    <SelectItem value="INTERNSHIP">Internship</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-destructive text-sm">{errors.type.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="experienceLevel">Experience Level *</Label>
                <Select
                  value={formData.experienceLevel}
                  onValueChange={(value) =>
                    setValue(
                      'experienceLevel',
                      value as 'ENTRY' | 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD'
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTRY">Entry Level</SelectItem>
                    <SelectItem value="JUNIOR">Junior</SelectItem>
                    <SelectItem value="MID">Mid Level</SelectItem>
                    <SelectItem value="SENIOR">Senior</SelectItem>
                    <SelectItem value="LEAD">Lead</SelectItem>
                  </SelectContent>
                </Select>
                {errors.experienceLevel && (
                  <p className="text-destructive text-sm">{errors.experienceLevel.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="applicationDeadline">Application Deadline *</Label>
                <Input id="applicationDeadline" type="date" {...register('applicationDeadline')} />
                {errors.applicationDeadline && (
                  <p className="text-destructive text-sm">{errors.applicationDeadline.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Salary & Benefits */}
          <Card>
            <CardHeader>
              <CardTitle>Compensation & Benefits</CardTitle>
              <CardDescription>Salary range and additional benefits (optional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Salary Range</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSalaryRange(!showSalaryRange)}
                    className="cursor-pointer"
                  >
                    {showSalaryRange ? 'Remove' : 'Add'} Salary Range
                  </Button>
                </div>

                {showSalaryRange && (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="salaryMin" className="text-xs">
                          Minimum ($)
                        </Label>
                        <Input
                          id="salaryMin"
                          type="number"
                          placeholder="50000"
                          onChange={(e) =>
                            setValue('salaryRange', {
                              ...formData.salaryRange,
                              min: parseFloat(e.target.value),
                              max: formData.salaryRange?.max || 0,
                              currency: formData.salaryRange?.currency || 'USD',
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="salaryMax" className="text-xs">
                          Maximum ($)
                        </Label>
                        <Input
                          id="salaryMax"
                          type="number"
                          placeholder="80000"
                          onChange={(e) =>
                            setValue('salaryRange', {
                              ...formData.salaryRange,
                              min: formData.salaryRange?.min || 0,
                              max: parseFloat(e.target.value),
                              currency: formData.salaryRange?.currency || 'USD',
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="currency" className="text-xs">
                        Currency
                      </Label>
                      <Select
                        value={formData.salaryRange?.currency || 'USD'}
                        onValueChange={(value) =>
                          setValue('salaryRange', {
                            ...formData.salaryRange,
                            min: formData.salaryRange?.min || 0,
                            max: formData.salaryRange?.max || 0,
                            currency: value as 'USD' | 'EUR' | 'GBP',
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Benefits (Optional)</Label>
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="e.g., Health Insurance, 401k"
                      value={benefit}
                      onChange={(e) => updateBenefit(index, e.target.value)}
                    />
                    {benefits.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBenefit(index)}
                        className="cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBenefit}
                  className="w-full cursor-pointer"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Benefit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Job Description</CardTitle>
            <CardDescription>Detailed description of the position</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Provide a detailed description of the job, including the role overview, team structure, and company culture..."
              rows={6}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-destructive text-sm">{errors.description.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
            <CardDescription>Skills and qualifications needed for the role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {requirements.map((requirement, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="e.g., 5+ years of experience in software development"
                  value={requirement}
                  onChange={(e) => updateRequirement(index, e.target.value)}
                />
                {requirements.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRequirement(index)}
                    className="cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRequirement}
              className="w-full cursor-pointer"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Requirement
            </Button>
          </CardContent>
        </Card>

        {/* Responsibilities */}
        <Card>
          <CardHeader>
            <CardTitle>Responsibilities</CardTitle>
            <CardDescription>Key duties and tasks for this position</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {responsibilities.map((responsibility, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="e.g., Lead development of new features"
                  value={responsibility}
                  onChange={(e) => updateResponsibility(index, e.target.value)}
                />
                {responsibilities.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeResponsibility(index)}
                    className="cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addResponsibility}
              className="w-full cursor-pointer"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Responsibility
            </Button>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigation.push('/dashboard/admin/recruitment')}
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
                <Briefcase className="mr-2 h-4 w-4" />
                Create Job Posting
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
