'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useNavigation } from '@/hooks/use-navigation';
import { jobPostingsApi } from '@/lib/api/recruitment';
import type { JobPosting, JobPostingStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Loader2,
  Edit,
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Users,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function JobPostingViewPage() {
  const params = useParams();
  const navigation = useNavigation();
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);

  const jobId = params.id as string;

  useEffect(() => {
    const fetchJobPosting = async () => {
      try {
        setLoading(true);
        const response = await jobPostingsApi.getJobPostingById(jobId);

        let fetchedJob: JobPosting | null = null;
        if ('success' in response && 'data' in response) {
          fetchedJob = response.data as JobPosting;
        } else if ('id' in response) {
          fetchedJob = response as JobPosting;
        }

        if (fetchedJob) {
          setJobPosting(fetchedJob);
        } else {
          toast.error('Failed to load job posting');
        }
      } catch (err) {
        console.error('Error fetching job posting:', err);
        toast.error('Failed to load job posting');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJobPosting();
    }
  }, [jobId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: JobPostingStatus) => {
    const variants: Record<
      JobPostingStatus,
      {
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
        text: string;
        icon: React.ComponentType<{ className?: string }>;
      }
    > = {
      DRAFT: { variant: 'secondary', text: 'Draft', icon: FileText },
      PUBLISHED: { variant: 'default', text: 'Published', icon: CheckCircle },
      CLOSED: { variant: 'destructive', text: 'Closed', icon: XCircle },
      ARCHIVED: { variant: 'outline', text: 'Archived', icon: Clock },
    };

    const { variant, text, icon: Icon } = variants[status];

    return (
      <Badge variant={variant} className="text-sm">
        <Icon className="mr-1 h-4 w-4" />
        {text}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      FULL_TIME: 'Full-Time',
      PART_TIME: 'Part-Time',
      CONTRACT: 'Contract',
      INTERNSHIP: 'Internship',
    };
    return labels[type] || type;
  };

  const handleBack = () => {
    navigation.push('/dashboard/admin/recruitment');
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
        <Button variant="outline" onClick={handleBack} className="cursor-pointer">
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleBack} className="cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-3xl font-bold tracking-tight">{jobPosting.title}</h2>
          </div>
          <div className="text-muted-foreground flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {jobPosting.department.name}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {jobPosting.location}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="h-4 w-4" />
              {getTypeLabel(jobPosting.type)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {getStatusBadge(jobPosting.status)}
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigation.push(`/dashboard/admin/recruitment/${jobId}/edit`)}
            className="cursor-pointer"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            size="sm"
            onClick={() => navigation.push(`/dashboard/admin/recruitment/${jobId}/applications`)}
            className="cursor-pointer"
          >
            <Users className="mr-2 h-4 w-4" />
            View Applications
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Job Description */}
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{jobPosting.description}</p>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {jobPosting.requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Responsibilities */}
          <Card>
            <CardHeader>
              <CardTitle>Responsibilities</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {jobPosting.responsibilities.map((resp, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Benefits */}
          {jobPosting.benefits && jobPosting.benefits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {jobPosting.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Job Details */}
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-muted-foreground text-sm">Experience Level</p>
                <p className="font-medium">{jobPosting.experienceLevel}</p>
              </div>

              <div>
                <p className="text-muted-foreground text-sm">Employment Type</p>
                <p className="font-medium">{getTypeLabel(jobPosting.type)}</p>
              </div>

              <div>
                <p className="text-muted-foreground text-sm">Department</p>
                <p className="font-medium">{jobPosting.department.name}</p>
              </div>

              <div>
                <p className="text-muted-foreground text-sm">Location</p>
                <p className="flex items-center gap-1 font-medium">
                  <MapPin className="h-4 w-4" />
                  {jobPosting.location}
                </p>
              </div>

              {jobPosting.salaryRange && (
                <div>
                  <p className="text-muted-foreground text-sm">Salary Range</p>
                  <p className="flex items-center gap-1 font-medium">
                    <DollarSign className="h-4 w-4" />
                    {jobPosting.salaryRange.min.toLocaleString()} -{' '}
                    {jobPosting.salaryRange.max.toLocaleString()} {jobPosting.salaryRange.currency}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Important Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Important Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-muted-foreground text-sm">Application Deadline</p>
                <p className="flex items-center gap-1 font-medium">
                  <Calendar className="h-4 w-4" />
                  {formatDate(jobPosting.applicationDeadline)}
                </p>
              </div>

              {jobPosting.publishedAt && (
                <div>
                  <p className="text-muted-foreground text-sm">Published On</p>
                  <p className="flex items-center gap-1 font-medium">
                    <Calendar className="h-4 w-4" />
                    {formatDate(jobPosting.publishedAt)}
                  </p>
                </div>
              )}

              {jobPosting.closedAt && (
                <div>
                  <p className="text-muted-foreground text-sm">Closed On</p>
                  <p className="flex items-center gap-1 font-medium">
                    <Calendar className="h-4 w-4" />
                    {formatDate(jobPosting.closedAt)}
                  </p>
                </div>
              )}

              <div>
                <p className="text-muted-foreground text-sm">Created On</p>
                <p className="flex items-center gap-1 font-medium">
                  <Calendar className="h-4 w-4" />
                  {formatDate(jobPosting.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground text-sm">Last Updated</p>
                <p className="flex items-center gap-1 font-medium">
                  <Calendar className="h-4 w-4" />
                  {formatDate(jobPosting.updatedAt)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full cursor-pointer justify-start"
                onClick={() =>
                  navigation.push(`/dashboard/admin/recruitment/${jobId}/applications`)
                }
              >
                <Users className="mr-2 h-4 w-4" />
                View Applications
              </Button>
              <Button
                variant="outline"
                className="w-full cursor-pointer justify-start"
                onClick={() => navigation.push(`/dashboard/admin/recruitment/${jobId}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Posting
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
