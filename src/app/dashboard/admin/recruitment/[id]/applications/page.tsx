'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useNavigation } from '@/hooks/use-navigation';
import { jobApplicationsApi, jobPostingsApi } from '@/lib/api/recruitment';
import type { JobApplication, JobPosting, ApplicationStatus } from '@/types';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  Edit2,
  Trash2,
  Star,
  Mail,
  Phone,
  Calendar,
  Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';

export default function JobApplicationsPage() {
  const params = useParams();
  const navigation = useNavigation();
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ApplicationStatus>('all');

  // Update dialog
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [applicationToUpdate, setApplicationToUpdate] = useState<JobApplication | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>('PENDING');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [updating, setUpdating] = useState(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<JobApplication | null>(null);
  const [deleting, setDeleting] = useState(false);

  const jobId = params.id as string;
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [jobResponse, appsResponse] = await Promise.all([
        jobPostingsApi.getJobPostingById(jobId),
        jobApplicationsApi.getAllApplications(),
      ]);

      let fetchedJob: JobPosting | null = null;
      // Handle response that might be wrapped or direct
      if ('success' in jobResponse && 'data' in jobResponse) {
        fetchedJob = jobResponse.data as JobPosting;
      } else if ('id' in jobResponse) {
        fetchedJob = jobResponse as JobPosting;
      }
      setJobPosting(fetchedJob);

      // Handle response that might be wrapped or direct
      if ('success' in appsResponse && 'data' in appsResponse) {
        const responseData = appsResponse.data as JobApplication[] | { data: JobApplication[] };
        let allApplications: JobApplication[] = [];

        if (Array.isArray(responseData)) {
          allApplications = responseData;
        } else if ('data' in responseData && Array.isArray(responseData.data)) {
          allApplications = responseData.data;
        }

        // Filter applications by jobPostingId on the frontend
        const filteredApps = allApplications.filter((app) => app.jobPosting.id === jobId);
        setApplications(filteredApps);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    const variants: Record<
      ApplicationStatus,
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; text: string }
    > = {
      PENDING: { variant: 'secondary', text: 'Pending' },
      REVIEWING: { variant: 'outline', text: 'Reviewing' },
      SHORTLISTED: { variant: 'default', text: 'Shortlisted' },
      REJECTED: { variant: 'destructive', text: 'Rejected' },
      HIRED: { variant: 'default', text: 'Hired' },
    };

    const { variant, text } = variants[status];
    return <Badge variant={variant}>{text}</Badge>;
  };

  const filteredApplications = applications.filter((app) => {
    const searchMatch =
      app.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase());

    const statusMatch = statusFilter === 'all' || app.status === statusFilter;

    return searchMatch && statusMatch;
  });

  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentApplications = filteredApplications.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleUpdateStatus = (application: JobApplication) => {
    setApplicationToUpdate(application);
    setSelectedStatus(application.status);
    setNotes(application.notes || '');
    setRating(application.rating);
    setUpdateDialogOpen(true);
  };

  const confirmUpdate = async () => {
    if (!applicationToUpdate) return;

    setUpdating(true);
    try {
      const response = await jobApplicationsApi.updateApplication(applicationToUpdate.id, {
        status: selectedStatus,
        notes: notes || undefined,
        rating: rating,
      });

      if ('success' in response && response.success) {
        toast.success('Application updated successfully');
        await fetchData();
      } else if ('message' in response && typeof response.message === 'string') {
        toast.error(response.message || 'Failed to update application');
      } else {
        toast.success('Application updated successfully');
        await fetchData();
      }
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Failed to update application');
    } finally {
      setUpdating(false);
      setUpdateDialogOpen(false);
      setApplicationToUpdate(null);
    }
  };

  const handleDelete = (application: JobApplication) => {
    setApplicationToDelete(application);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!applicationToDelete) return;

    setDeleting(true);
    try {
      const response = await jobApplicationsApi.deleteApplication(applicationToDelete.id);

      // Type guard to check if response is an object
      if (response && typeof response === 'object' && 'success' in response && response.success) {
        toast.success('Application deleted successfully');
        await fetchData();
      } else if (
        response &&
        typeof response === 'object' &&
        'message' in response &&
        typeof response.message === 'string'
      ) {
        toast.error(response.message || 'Failed to delete application');
      } else {
        toast.success('Application deleted successfully');
        await fetchData();
      }
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Failed to delete application');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setApplicationToDelete(null);
    }
  };

  const handleBack = () => {
    navigation.push(`/dashboard/admin/recruitment/${jobId}`);
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleBack} className="cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-3xl font-bold tracking-tight">Applications</h2>
          </div>
          {jobPosting && (
            <p className="text-muted-foreground">
              Applications for: <span className="font-medium">{jobPosting.title}</span>
            </p>
          )}
        </div>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle>All Applications</CardTitle>
            <div className="text-muted-foreground text-sm">
              {filteredApplications.length} of {applications.length} applications
              {searchTerm && ' (filtered)'}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as 'all' | ApplicationStatus)}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
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
        </CardHeader>

        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentApplications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground text-center">
                      No applications found
                    </TableCell>
                  </TableRow>
                ) : (
                  currentApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {app.firstName} {app.lastName}
                          </div>
                          <div className="text-muted-foreground text-sm">{app.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{app.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {app.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{app.experience} years</TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell>
                        {app.rating ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{app.rating}/5</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not rated</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {formatDate(app.createdAt)}
                        </div>
                      </TableCell>
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
                                navigation.push(
                                  `/dashboard/admin/recruitment/applications/${app.id}`
                                )
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => handleUpdateStatus(app)}
                            >
                              <Edit2 className="mr-2 h-4 w-4" />
                              Update Status
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() =>
                                navigation.push(
                                  `/dashboard/admin/recruitment/interviews/create?applicationId=${app.id}`
                                )
                              }
                            >
                              <Briefcase className="mr-2 h-4 w-4" />
                              Schedule Interview
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive cursor-pointer"
                              onClick={() => handleDelete(app)}
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
            {currentApplications.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">No applications found</div>
            ) : (
              currentApplications.map((app) => (
                <Card key={app.id}>
                  <CardContent>
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">
                          {app.firstName} {app.lastName}
                        </h3>
                        <p className="text-muted-foreground text-sm">{app.email}</p>
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
                              navigation.push(`/dashboard/admin/recruitment/applications/${app.id}`)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => handleUpdateStatus(app)}
                          >
                            <Edit2 className="mr-2 h-4 w-4" />
                            Update Status
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() =>
                              navigation.push(
                                `/dashboard/admin/recruitment/interviews/create?applicationId=${app.id}`
                              )
                            }
                          >
                            <Briefcase className="mr-2 h-4 w-4" />
                            Schedule Interview
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive cursor-pointer"
                            onClick={() => handleDelete(app)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <p>{app.phone}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Experience:</span>
                        <p>{app.experience} years</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <div className="mt-1">{getStatusBadge(app.status)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rating:</span>
                        {app.rating ? (
                          <div className="mt-1 flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{app.rating}/5</span>
                          </div>
                        ) : (
                          <p className="text-muted-foreground mt-1">Not rated</p>
                        )}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Applied:</span>
                        <p>{formatDate(app.createdAt)}</p>
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
                Showing {startIndex + 1} to {Math.min(endIndex, filteredApplications.length)} of{' '}
                {filteredApplications.length} entries
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

      {/* Update Status Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Application Status</DialogTitle>
            <DialogDescription>
              Update the status and add notes for{' '}
              {applicationToUpdate &&
                `${applicationToUpdate.firstName} ${applicationToUpdate.lastName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value as ApplicationStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REVIEWING">Reviewing</SelectItem>
                  <SelectItem value="SHORTLISTED">Shortlisted</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="HIRED">Hired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">Rating (1-5)</Label>
              <Select
                value={rating?.toString() || ''}
                onValueChange={(value) => setRating(value ? parseInt(value) : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No rating</SelectItem>
                  <SelectItem value="1">1 - Poor</SelectItem>
                  <SelectItem value="2">2 - Fair</SelectItem>
                  <SelectItem value="3">3 - Good</SelectItem>
                  <SelectItem value="4">4 - Very Good</SelectItem>
                  <SelectItem value="5">5 - Excellent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes or comments..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpdateDialogOpen(false)}
              disabled={updating}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button onClick={confirmUpdate} disabled={updating} className="cursor-pointer">
              {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {updating ? 'Updating...' : 'Update Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the application from{' '}
              {applicationToDelete &&
                `${applicationToDelete.firstName} ${applicationToDelete.lastName}`}
              ? This action cannot be undone.
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
              {deleting ? 'Deleting...' : 'Delete Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
