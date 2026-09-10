'use client';

import { useState, useEffect, useMemo } from 'react';
import { useNavigation } from '@/hooks/use-navigation';
import { jobPostingsApi, jobApplicationsApi } from '@/lib/api/recruitment';
import type { JobPosting, JobApplication } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Briefcase,
  Users,
  FileText,
  Loader2,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function HRRecruitmentPage() {
  const navigation = useNavigation();
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('job-postings');

  // Job Postings filters
  const [jobSearchTerm, setJobSearchTerm] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState<string>('all');

  // Applications filters
  const [appSearchTerm, setAppSearchTerm] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState<string>('all');

  const fetchJobPostings = async () => {
    try {
      const response = await jobPostingsApi.getAllJobPostings();
      if ('success' in response && response.success && 'data' in response) {
        const data = response.data;
        if (Array.isArray(data)) {
          setJobPostings(data);
        } else {
          setJobPostings([]);
        }
      } else if ('data' in response && Array.isArray(response.data)) {
        setJobPostings(response.data);
      } else if (Array.isArray(response)) {
        setJobPostings(response);
      } else {
        setJobPostings([]);
      }
    } catch (err) {
      console.error('Error fetching job postings:', err);
      toast.error('Failed to fetch job postings');
      setJobPostings([]);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await jobApplicationsApi.getAllApplications();
      if ('success' in response && response.success && 'data' in response) {
        const data = response.data;
        if (Array.isArray(data)) {
          setApplications(data);
        } else {
          setApplications([]);
        }
      } else if ('data' in response && Array.isArray(response.data)) {
        setApplications(response.data);
      } else if (Array.isArray(response)) {
        setApplications(response);
      } else {
        setApplications([]);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
      toast.error('Failed to fetch applications');
      setApplications([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchJobPostings(), fetchApplications()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getJobStatusBadge = (status: string) => {
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

  // Filter job postings
  const filteredJobPostings = useMemo(() => {
    return jobPostings.filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
        job.department.name.toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(jobSearchTerm.toLowerCase());

      const matchesStatus = jobStatusFilter === 'all' || job.status === jobStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [jobPostings, jobSearchTerm, jobStatusFilter]);

  // Filter applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const fullName = `${app.firstName} ${app.lastName}`.toLowerCase();
      const matchesSearch =
        fullName.includes(appSearchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(appSearchTerm.toLowerCase()) ||
        app.jobPosting.title.toLowerCase().includes(appSearchTerm.toLowerCase());

      const matchesStatus = appStatusFilter === 'all' || app.status === appStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, appSearchTerm, appStatusFilter]);

  const stats = useMemo(() => {
    return {
      totalJobs: jobPostings.length,
      activeJobs: jobPostings.filter((j) => j.status === 'PUBLISHED').length,
      totalApplications: applications.length,
      pendingApplications: applications.filter((a) => a.status === 'PENDING').length,
    };
  }, [jobPostings, applications]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recruitment</h1>
          <p className="text-muted-foreground mt-1">Manage job postings and applications</p>
        </div>
        <Button onClick={() => navigation.push('/dashboard/hr/recruitment/job-postings/create')}>
          <Plus className="mr-2 h-4 w-4" />
          New Job Posting
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <CheckCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeJobs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplications}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApplications}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="job-postings">Job Postings</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>

        {/* Job Postings Tab */}
        <TabsContent value="job-postings" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="relative lg:col-span-2">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    placeholder="Search by title, department, or location..."
                    value={jobSearchTerm}
                    onChange={(e) => setJobSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={jobStatusFilter} onValueChange={setJobStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Job Postings List */}
          <Card>
            <CardHeader>
              <CardTitle>Job Postings</CardTitle>
              <CardDescription>Showing {filteredJobPostings.length} job postings</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="text-primary h-8 w-8 animate-spin" />
                </div>
              ) : filteredJobPostings.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center">
                  <Briefcase className="text-muted-foreground mb-4 h-12 w-12" />
                  <h3 className="text-lg font-semibold">No job postings found</h3>
                  <p className="text-muted-foreground text-sm">
                    {jobPostings.length === 0
                      ? 'Create your first job posting'
                      : 'Try adjusting your filters'}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job Title</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredJobPostings.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell className="font-medium">{job.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{job.department.name}</Badge>
                          </TableCell>
                          <TableCell>{job.location}</TableCell>
                          <TableCell>{formatDate(job.applicationDeadline)}</TableCell>
                          <TableCell>{getJobStatusBadge(job.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigation.push(
                                      `/dashboard/hr/recruitment/job-postings/${job.id}`
                                    )
                                  }
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigation.push(
                                      `/dashboard/hr/recruitment/job-postings/${job.id}/edit`
                                    )
                                  }
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="relative lg:col-span-2">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    placeholder="Search by name, email, or job title..."
                    value={appSearchTerm}
                    onChange={(e) => setAppSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={appStatusFilter} onValueChange={setAppStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="REVIEWING">Reviewing</SelectItem>
                    <SelectItem value="SHORTLISTED">Shortlisted</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="HIRED">Hired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Applications List */}
          <Card>
            <CardHeader>
              <CardTitle>Applications</CardTitle>
              <CardDescription>Showing {filteredApplications.length} applications</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="text-primary h-8 w-8 animate-spin" />
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center">
                  <FileText className="text-muted-foreground mb-4 h-12 w-12" />
                  <h3 className="text-lg font-semibold">No applications found</h3>
                  <p className="text-muted-foreground text-sm">
                    {applications.length === 0
                      ? 'No applications submitted yet'
                      : 'Try adjusting your filters'}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Candidate</TableHead>
                        <TableHead>Job Title</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Applied On</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApplications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {app.firstName} {app.lastName}
                              </p>
                              <p className="text-muted-foreground text-sm">{app.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{app.jobPosting.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{app.jobPosting.department.name}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(app.createdAt)}</TableCell>
                          <TableCell>{getAppStatusBadge(app.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigation.push(
                                      `/dashboard/hr/recruitment/applications/${app.id}`
                                    )
                                  }
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {app.status === 'PENDING' || app.status === 'REVIEWING' ? (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      navigation.push(
                                        `/dashboard/hr/recruitment/applications/${app.id}/schedule-interview`
                                      )
                                    }
                                  >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Schedule Interview
                                  </DropdownMenuItem>
                                ) : null}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
