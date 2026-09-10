'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useNavigation } from '@/hooks/use-navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { jobPostingsApi } from '@/lib/api/recruitment';
import { departmentsApi } from '@/lib/api/departments';
import { updateJobPostingSchema, type UpdateJobPostingFormData } from '@/schemas/jobPosting';
import type { JobPosting, Department } from '@/types';
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
import { Save, Loader2, Plus, X, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function EditJobPostingPage() {
  const params = useParams();
  const navigation = useNavigation();
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requirements, setRequirements] = useState<string[]>(['']);
  const [responsibilities, setResponsibilities] = useState<string[]>(['']);
  const [benefits, setBenefits] = useState<string[]>(['']);
  const [showSalaryRange, setShowSalaryRange] = useState(false);

  const jobId = params.id as string;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateJobPostingFormData>({
    resolver: zodResolver(updateJobPostingSchema),
  });

  const formData = watch();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [jobResponse, deptResponse] = await Promise.all([
          jobPostingsApi.getJobPostingById(jobId),
          departmentsApi.getAllDepartments(),
        ]);

        if (
          'success' in deptResponse &&
          'data' in deptResponse &&
          deptResponse.success &&
          deptResponse.data
        ) {
          setDepartments(deptResponse.data as Department[]);
        }

        let fetchedJob: JobPosting | null = null;
        if ('success' in jobResponse && 'data' in jobResponse) {
          fetchedJob = jobResponse.data as JobPosting;
        } else if ('id' in jobResponse) {
          fetchedJob = jobResponse as JobPosting;
        }

        if (fetchedJob) {
          setJobPosting(fetchedJob);
          setValue('title', fetchedJob.title);
          setValue('description', fetchedJob.description);
          setValue('departmentId', fetchedJob.department.id);
          setValue('location', fetchedJob.location);
          setValue('type', fetchedJob.type);
          setValue('experienceLevel', fetchedJob.experienceLevel);
          setValue('applicationDeadline', fetchedJob.applicationDeadline.split('T')[0]);
          setValue('status', fetchedJob.status);

          setRequirements(fetchedJob.requirements || ['']);
          setResponsibilities(fetchedJob.responsibilities || ['']);
          setBenefits(fetchedJob.benefits || ['']);

          if (fetchedJob.salaryRange) {
            setShowSalaryRange(true);
            setValue('salaryRange', {
              min: fetchedJob.salaryRange.min,
              max: fetchedJob.salaryRange.max,
              currency: fetchedJob.salaryRange.currency as 'USD' | 'EUR' | 'GBP',
            });
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Failed to load job posting');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchData();
    }
  }, [jobId, setValue]);

  const onSubmit = async (data: UpdateJobPostingFormData) => {
    setSubmitting(true);
    try {
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
        salaryRange: showSalaryRange ? data.salaryRange : undefined,
      };

      const response = await jobPostingsApi.updateJobPosting(jobId, submitData);

      if ('success' in response && response.success) {
        toast.success('Job posting updated successfully');
        navigation.push(`/dashboard/admin/recruitment/${jobId}`);
      } else if ('message' in response && typeof response.message === 'string') {
        toast.error(response.message || 'Failed to update job posting');
      } else {
        toast.success('Job posting updated successfully');
        navigation.push(`/dashboard/admin/recruitment/${jobId}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update job posting';
      toast.error(errorMessage);
      console.error('Error updating job posting:', err);
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

  if (!jobPosting) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          onClick={() => navigation.push('/dashboard/admin/recruitment')}
          className="cursor-pointer"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Recruitment
        </Button>
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-center">Job posting not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigation.push(`/dashboard/admin/recruitment/${jobId}`)}
              className="cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Edit Job Posting</h1>
          </div>
          <p className="text-muted-foreground">Update job posting details and requirements</p>
        </div>
        <Button onClick={handleSubmit(onSubmit)} disabled={submitting} className="cursor-pointer">
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
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
                <Label htmlFor="title">Job Title</Label>
                <Input id="title" {...register('title')} />
                {errors.title && <p className="text-destructive text-sm">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="departmentId">Department</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) => setValue('departmentId', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
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
                <Label htmlFor="location">Location</Label>
                <Input id="location" {...register('location')} />
                {errors.location && (
                  <p className="text-destructive text-sm">{errors.location.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Employment Type</Label>
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
                <Label htmlFor="experienceLevel">Experience Level</Label>
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
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setValue('status', value as 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-destructive text-sm">{errors.status.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="applicationDeadline">Application Deadline</Label>
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
              <CardDescription>Salary range and additional benefits</CardDescription>
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
                          value={formData.salaryRange?.min || ''}
                          onChange={(e) =>
                            setValue('salaryRange', {
                              min: parseFloat(e.target.value) || 0,
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
                          value={formData.salaryRange?.max || ''}
                          onChange={(e) =>
                            setValue('salaryRange', {
                              min: formData.salaryRange?.min || 0,
                              max: parseFloat(e.target.value) || 0,
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
                <Label>Benefits</Label>
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
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={6} {...register('description')} />
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
      </form>
    </div>
  );
}
