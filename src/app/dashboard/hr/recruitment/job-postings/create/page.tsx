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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateJobPostingPage() {
  const navigation = useNavigation();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateJobPostingFormData>({
    resolver: zodResolver(createJobPostingSchema),
    defaultValues: {
      requirements: [''],
      responsibilities: [''],
      benefits: [''],
    },
  });

  const requirements = watch('requirements') || [''];
  const responsibilities = watch('responsibilities') || [''];

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentsApi.getAllDepartments();

      if (Array.isArray(response)) {
        setDepartments(response);
      } else if (response.success && response.data) {
        setDepartments(response.data);
      } else if ('data' in response && Array.isArray(response.data)) {
        setDepartments(response.data);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
      toast.error('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CreateJobPostingFormData) => {
    try {
      setSubmitting(true);

      // Filter out empty strings from arrays
      const payload = {
        ...data,
        requirements: data.requirements.filter((r) => r.trim()),
        responsibilities: data.responsibilities.filter((r) => r.trim()),
        benefits: data.benefits?.filter((b) => b.trim()) || undefined,
      };

      await jobPostingsApi.createJobPosting(payload);
      toast.success('Job posting created successfully');
      navigation.push('/dashboard/hr/recruitment');
    } catch (error) {
      console.error('Error creating job posting:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create job posting');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  const addItem = (field: 'requirements' | 'responsibilities') => {
    const current = watch(field) || [];
    setValue(field, [...current, '']);
  };

  const removeItem = (field: 'requirements' | 'responsibilities', index: number) => {
    const current = watch(field) || [];
    setValue(
      field,
      current.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigation.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Job Posting</h1>
          <p className="text-muted-foreground mt-1">Post a new job opening</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Job Information</CardTitle>
            <CardDescription>Enter the details for the new job posting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Job Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Job Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Senior Software Engineer"
                {...register('title')}
              />
              {errors.title && (
                <div className="text-destructive flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.title.message}</span>
                </div>
              )}
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="departmentId">
                Department <span className="text-destructive">*</span>
              </Label>
              <Select onValueChange={(value) => setValue('departmentId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a department" />
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
                <div className="text-destructive flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.departmentId.message}</span>
                </div>
              )}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">
                  Location <span className="text-destructive">*</span>
                </Label>
                <Input id="location" placeholder="e.g., New York, NY" {...register('location')} />
                {errors.location && (
                  <div className="text-destructive flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.location.message}</span>
                  </div>
                )}
              </div>

              {/* Job Type */}
              <div className="space-y-2">
                <Label htmlFor="type">
                  Job Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  onValueChange={(value) =>
                    setValue('type', value as 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP')
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULL_TIME">Full Time</SelectItem>
                    <SelectItem value="PART_TIME">Part Time</SelectItem>
                    <SelectItem value="CONTRACT">Contract</SelectItem>
                    <SelectItem value="INTERNSHIP">Internship</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                  <div className="text-destructive flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.type.message}</span>
                  </div>
                )}
              </div>

              {/* Experience Level */}
              <div className="space-y-2">
                <Label htmlFor="experienceLevel">
                  Experience Level <span className="text-destructive">*</span>
                </Label>
                <Select
                  onValueChange={(value) =>
                    setValue(
                      'experienceLevel',
                      value as 'ENTRY' | 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD'
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTRY">Entry</SelectItem>
                    <SelectItem value="JUNIOR">Junior</SelectItem>
                    <SelectItem value="MID">Mid-Level</SelectItem>
                    <SelectItem value="SENIOR">Senior</SelectItem>
                    <SelectItem value="LEAD">Lead</SelectItem>
                  </SelectContent>
                </Select>
                {errors.experienceLevel && (
                  <div className="text-destructive flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.experienceLevel.message}</span>
                  </div>
                )}
              </div>

              {/* Application Deadline */}
              <div className="space-y-2">
                <Label htmlFor="applicationDeadline">
                  Application Deadline <span className="text-destructive">*</span>
                </Label>
                <Input id="applicationDeadline" type="date" {...register('applicationDeadline')} />
                {errors.applicationDeadline && (
                  <div className="text-destructive flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.applicationDeadline.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Detailed job description..."
                rows={6}
                {...register('description')}
              />
              {errors.description && (
                <div className="text-destructive flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.description.message}</span>
                </div>
              )}
            </div>

            {/* Requirements */}
            <div className="space-y-2">
              <Label>
                Requirements <span className="text-destructive">*</span>
              </Label>
              {requirements.map((_, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Requirement ${index + 1}`}
                    {...register(`requirements.${index}` as const)}
                  />
                  {requirements.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeItem('requirements', index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => addItem('requirements')}>
                Add Requirement
              </Button>
              {errors.requirements && (
                <div className="text-destructive flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.requirements.message}</span>
                </div>
              )}
            </div>

            {/* Responsibilities */}
            <div className="space-y-2">
              <Label>
                Responsibilities <span className="text-destructive">*</span>
              </Label>
              {responsibilities.map((_, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Responsibility ${index + 1}`}
                    {...register(`responsibilities.${index}` as const)}
                  />
                  {responsibilities.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeItem('responsibilities', index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => addItem('responsibilities')}>
                Add Responsibility
              </Button>
              {errors.responsibilities && (
                <div className="text-destructive flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.responsibilities.message}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Job Posting'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigation.back()}
                disabled={submitting}
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
