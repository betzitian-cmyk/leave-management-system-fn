'use client';

import { useState, useEffect } from 'react';
import { useNavigation } from '@/hooks/use-navigation';
import { jobPostingsApi } from '@/lib/api/recruitment';
import type { JobPosting, JobPostingStatus, JobType, ExperienceLevel } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  Edit,
  Trash2,
  FileText,
  Briefcase,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

export default function RecruitmentPage() {
  const navigation = useNavigation();
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | JobPostingStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | JobType>('all');
  const [levelFilter, setLevelFilter] = useState<'all' | ExperienceLevel>('all');

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<JobPosting | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);

  const itemsPerPage = 10;

  const fetchJobPostings = async () => {
    try {
      setLoading(true);
      const response = await jobPostingsApi.getAllJobPostings();

      if ('success' in response && 'data' in response && response.success && response.data) {
        const responseData = response.data as JobPosting[] | { data: JobPosting[] };
        if (Array.isArray(responseData)) {
          setJobPostings(responseData);
        } else if ('data' in responseData && Array.isArray(responseData.data)) {
          setJobPostings(responseData.data);
        }
      }
    } catch (err) {
      console.error('Error fetching job postings:', err);
      toast.error('Failed to fetch job postings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobPostings();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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
      <Badge variant={variant}>
        <Icon className="mr-1 h-3 w-3" />
        {text}
      </Badge>
    );
  };

  const getTypeBadge = (type: JobType) => {
    const labels: Record<JobType, string> = {
      FULL_TIME: 'Full-Time',
      PART_TIME: 'Part-Time',
      CONTRACT: 'Contract',
      INTERNSHIP: 'Internship',
    };

    return <Badge variant="outline">{labels[type]}</Badge>;
  };

  const filteredJobPostings = jobPostings.filter((job) => {
    const searchMatch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.department.name.toLowerCase().includes(searchTerm.toLowerCase());

    const statusMatch = statusFilter === 'all' || job.status === statusFilter;
    const typeMatch = typeFilter === 'all' || job.type === typeFilter;
    const levelMatch = levelFilter === 'all' || job.experienceLevel === levelFilter;

    return searchMatch && statusMatch && typeMatch && levelMatch;
  });

  const totalPages = Math.ceil(filteredJobPostings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentJobPostings = filteredJobPostings.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleDelete = (job: JobPosting) => {
    setJobToDelete(job);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!jobToDelete) return;

    setDeleting(true);
    try {
      const response = await jobPostingsApi.deleteJobPosting(jobToDelete.id);

      if (response && typeof response === 'object' && 'success' in response && response.success) {
        toast.success('Job posting deleted successfully');
        await fetchJobPostings();
      } else if (
        response &&
        typeof response === 'object' &&
        'message' in response &&
        typeof response.message === 'string'
      ) {
        toast.error(response.message || 'Failed to delete job posting');
      } else {
        toast.success('Job posting deleted successfully');
        await fetchJobPostings();
      }
    } catch (error) {
      console.error('Error deleting job posting:', error);
      toast.error('Failed to delete job posting');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setJobToDelete(null);
    }
  };

  const handlePublish = async (id: string) => {
    setPublishing(id);
    try {
      // Get current user ID from localStorage or context
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      const response = await jobPostingsApi.publishJobPosting(id, user?.id || '');

      if ('success' in response && response.success) {
        toast.success('Job posting published successfully');
        await fetchJobPostings();
      } else if ('message' in response && typeof response.message === 'string') {
        toast.error(response.message || 'Failed to publish job posting');
      } else {
        toast.success('Job posting published successfully');
        await fetchJobPostings();
      }
    } catch (error) {
      console.error('Error publishing job posting:', error);
      toast.error('Failed to publish job posting');
    } finally {
      setPublishing(null);
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Recruitment Management</h2>
          <p className="text-muted-foreground">Manage job postings, applications, and interviews</p>
        </div>
        <Button
          onClick={() => navigation.push('/dashboard/admin/recruitment/create')}
          className="cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Job Posting
        </Button>
      </div>

      {/* Job Postings Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle>Job Postings</CardTitle>
            <div className="text-muted-foreground text-sm">
              {filteredJobPostings.length} of {jobPostings.length} job postings
              {searchTerm && ' (filtered)'}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
              <Input
                placeholder="Search by title, location, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-2">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as 'all' | JobPostingStatus)}
              >
                <SelectTrigger className="w-full sm:w-[130px]">
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

              <Select
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value as 'all' | JobType)}
              >
                <SelectTrigger className="w-full sm:w-[130px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="FULL_TIME">Full-Time</SelectItem>
                  <SelectItem value="PART_TIME">Part-Time</SelectItem>
                  <SelectItem value="CONTRACT">Contract</SelectItem>
                  <SelectItem value="INTERNSHIP">Internship</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={levelFilter}
                onValueChange={(value) => setLevelFilter(value as 'all' | ExperienceLevel)}
              >
                <SelectTrigger className="w-full sm:w-[130px]">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="ENTRY">Entry</SelectItem>
                  <SelectItem value="JUNIOR">Junior</SelectItem>
                  <SelectItem value="MID">Mid</SelectItem>
                  <SelectItem value="SENIOR">Senior</SelectItem>
                  <SelectItem value="LEAD">Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentJobPostings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-muted-foreground text-center">
                      No job postings found
                    </TableCell>
                  </TableRow>
                ) : (
                  currentJobPostings.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{job.title}</div>
                          <div className="text-muted-foreground text-sm">
                            ID: {job.id.slice(0, 8)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{job.department.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(job.type)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{job.experienceLevel}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(job.applicationDeadline)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 cursor-pointer p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() =>
                                navigation.push(`/dashboard/admin/recruitment/${job.id}`)
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() =>
                                navigation.push(`/dashboard/admin/recruitment/${job.id}/edit`)
                              }
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {job.status === 'DRAFT' && (
                              <DropdownMenuItem
                                className="cursor-pointer text-green-600"
                                onClick={() => handlePublish(job.id)}
                                disabled={publishing === job.id}
                              >
                                {publishing === job.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Publishing...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Publish
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() =>
                                navigation.push(
                                  `/dashboard/admin/recruitment/${job.id}/applications`
                                )
                              }
                            >
                              <Briefcase className="mr-2 h-4 w-4" />
                              View Applications
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive cursor-pointer"
                              onClick={() => handleDelete(job)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="space-y-4 lg:hidden">
            {currentJobPostings.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">No job postings found</div>
            ) : (
              currentJobPostings.map((job) => (
                <Card key={job.id}>
                  <CardContent>
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{job.title}</h3>
                        <p className="text-muted-foreground text-sm">ID: {job.id.slice(0, 8)}...</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 cursor-pointer p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() =>
                              navigation.push(`/dashboard/admin/recruitment/${job.id}`)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() =>
                              navigation.push(`/dashboard/admin/recruitment/${job.id}/edit`)
                            }
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {job.status === 'DRAFT' && (
                            <DropdownMenuItem
                              className="cursor-pointer text-green-600"
                              onClick={() => handlePublish(job.id)}
                              disabled={publishing === job.id}
                            >
                              {publishing === job.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Publishing...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Publish
                                </>
                              )}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() =>
                              navigation.push(`/dashboard/admin/recruitment/${job.id}/applications`)
                            }
                          >
                            <Briefcase className="mr-2 h-4 w-4" />
                            View Applications
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive cursor-pointer"
                            onClick={() => handleDelete(job)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Department:</span>
                        <p>{job.department.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Location:</span>
                        <p className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <div className="mt-1">{getTypeBadge(job.type)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Level:</span>
                        <div className="mt-1">
                          <Badge variant="secondary">{job.experienceLevel}</Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Deadline:</span>
                        <p className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(job.applicationDeadline)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <div className="mt-1">{getStatusBadge(job.status)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 0 && (
            <div className="mt-4 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="text-muted-foreground text-center text-sm sm:text-left">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredJobPostings.length)} of{' '}
                {filteredJobPostings.length} entries
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job Posting</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{jobToDelete?.title}&quot;? This action cannot
              be undone and will also delete all associated applications and interviews.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
              className="cursor-pointer"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deleting ? 'Deleting...' : 'Delete Job Posting'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
