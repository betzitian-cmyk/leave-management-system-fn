'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useNavigation } from '@/hooks/use-navigation';
import { jobPostingsApi, jobApplicationsApi } from '@/lib/api/recruitment';
import type { JobPosting, JobApplication } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  Users,
  FileText,
  Edit,
  Loader2,
  Building2,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

export default function JobPostingDetailPage() {
  const params = useParams();
  const navigation = useNavigation();
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobPosting = async () => {
    try {
      setLoading(true);
      const response = await jobPostingsApi.getJobPostingById(params.id as string);

      let jobData: JobPosting | null = null;
      if ('success' in response && response.success && 'data' in response) {
        jobData = response.data as JobPosting;
      } else if ('id' in response && 'title' in response) {
        jobData = response as unknown as JobPosting;
      }

      if (jobData) {
        setJobPosting(jobData);
        // Fetch applications for this job
        const appsResponse = await jobApplicationsApi.getAllApplications();
        if ('success' in appsResponse && appsResponse.success && 'data' in appsResponse) {
          setApplications(
            (appsResponse.data as JobApplication[]).filter(
              (app) => app.jobPosting.id === jobData.id
            )
          );
        } else if ('data' in appsResponse && Array.isArray(appsResponse.data)) {
          setApplications(
            appsResponse.data.filter((app: JobApplication) => app.jobPosting.id === jobData.id)
          );
        }
      } else {
        toast.error('Job posting not found');
        navigation.push('/dashboard/hr/recruitment');
      }
    } catch (err) {
      console.error('Error fetching job posting:', err);
      toast.error('Failed to fetch job posting details');
      navigation.push('/dashboard/hr/recruitment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchJobPosting();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }
    > = {
      DRAFT: { variant: 'secondary', label: 'Draft' },
      PUBLISHED: { variant: 'default', label: 'Published' },
      CLOSED: { variant: 'outline', label: 'Closed' },
      ARCHIVED: { variant: 'destructive', label: 'Archived' },
    };

    const config = variants[status] || variants.DRAFT;
    return (
      <Badge variant={config.variant} className="capitalize">
        {config.label}
      </Badge>
    );
  };

  const getAppStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }
    > = {
      PENDING: { variant: 'outline', label: 'Pending' },
      REVIEWING: { variant: 'secondary', label: 'Reviewing' },
      SHORTLISTED: { variant: 'default', label: 'Shortlisted' },
      REJECTED: { variant: 'destructive', label: 'Rejected' },
      HIRED: { variant: 'default', label: 'Hired' },
    };

    const config = variants[status] || variants.PENDING;
    return (
      <Badge variant={config.variant} className="capitalize">
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!jobPosting) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigation.push('/dashboard/hr/recruitment')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{jobPosting.title}</h1>
            <p className="text-muted-foreground mt-1">Job posting details and applications</p>
          </div>
        </div>
        <Button
          onClick={() =>
            navigation.push(`/dashboard/hr/recruitment/job-postings/${jobPosting.id}/edit`)
          }
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Briefcase className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>{getStatusBadge(jobPosting.status)}</CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Deadline</CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{formatDate(jobPosting.applicationDeadline)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Posted On</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{formatDate(jobPosting.createdAt)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Job Details */}
      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm">Department</span>
              </div>
              <Badge variant="outline" className="text-base">
                {jobPosting.department.name}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm">Location</span>
              </div>
              <p className="font-medium">{jobPosting.location}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Briefcase className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm">Job Type</span>
              </div>
              <Badge variant="outline">{jobPosting.type}</Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm">Experience Level</span>
              </div>
              <Badge variant="outline">{jobPosting.experienceLevel}</Badge>
            </div>

            {jobPosting.salaryRange && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground text-sm">Salary Range</span>
                </div>
                <p className="font-medium">
                  {jobPosting.salaryRange.currency} {jobPosting.salaryRange.min.toLocaleString()} -{' '}
                  {jobPosting.salaryRange.max.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Description</span>
            <p className="text-muted-foreground whitespace-pre-wrap">{jobPosting.description}</p>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Requirements</span>
            <ul className="text-muted-foreground list-disc space-y-1 pl-5">
              {jobPosting.requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Responsibilities</span>
            <ul className="text-muted-foreground list-disc space-y-1 pl-5">
              {jobPosting.responsibilities.map((resp, index) => (
                <li key={index}>{resp}</li>
              ))}
            </ul>
          </div>

          {jobPosting.benefits && jobPosting.benefits.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Benefits</span>
              <ul className="text-muted-foreground list-disc space-y-1 pl-5">
                {jobPosting.benefits.map((benefit, index) => (
                  <li key={index}>{benefit}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Applications */}
      <Card>
        <CardHeader>
          <CardTitle>Applications ({applications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center">
              <FileText className="text-muted-foreground mb-2 h-8 w-8" />
              <p className="text-muted-foreground text-sm">No applications yet</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow
                      key={app.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() =>
                        navigation.push(`/dashboard/hr/recruitment/applications/${app.id}`)
                      }
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {app.firstName} {app.lastName}
                          </p>
                          <p className="text-muted-foreground text-sm">{app.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{app.experience} years</TableCell>
                      <TableCell>{formatDate(app.createdAt)}</TableCell>
                      <TableCell>{getAppStatusBadge(app.status)}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
