'use client';

import { useState, useEffect } from 'react';
import { useNavigation } from '@/hooks/use-navigation';
import { onboardingApi } from '@/lib/api/onboarding';
import type { OnboardingProcess, OnboardingProcessStatus, OnboardingPhase } from '@/types';
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
  UserPlus,
  Calendar,
  Target,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

export default function OnboardingPage() {
  const navigation = useNavigation();
  const [onboardings, setOnboardings] = useState<OnboardingProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OnboardingProcessStatus>('all');
  const [phaseFilter, setPhaseFilter] = useState<'all' | OnboardingPhase>('all');

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [onboardingToDelete, setOnboardingToDelete] = useState<OnboardingProcess | null>(null);
  const [deleting, setDeleting] = useState(false);

  const itemsPerPage = 10;

  const fetchOnboardings = async () => {
    try {
      setLoading(true);
      const response = await onboardingApi.getAllOnboardings();

      if ('success' in response && 'data' in response && response.success && response.data) {
        const responseData = response.data as OnboardingProcess[] | { data: OnboardingProcess[] };
        if (Array.isArray(responseData)) {
          setOnboardings(responseData);
        } else if ('data' in responseData && Array.isArray(responseData.data)) {
          setOnboardings(responseData.data);
        }
      }
    } catch (err) {
      console.error('Error fetching onboardings:', err);
      toast.error('Failed to fetch onboarding processes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnboardings();
  }, []);

  // Frontend-side filtering
  const filteredOnboardings = onboardings.filter((onboarding) => {
    const matchesSearch =
      searchTerm === '' ||
      onboarding.employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      onboarding.employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      onboarding.employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      onboarding.employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      onboarding.employee.department.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || onboarding.status === statusFilter;
    const matchesPhase = phaseFilter === 'all' || onboarding.currentPhase === phaseFilter;

    return matchesSearch && matchesStatus && matchesPhase;
  });

  // Sorting
  const sortedOnboardings = [...filteredOnboardings].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Pagination
  const totalPages = Math.ceil(sortedOnboardings.length / itemsPerPage);
  const paginatedOnboardings = sortedOnboardings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = (onboarding: OnboardingProcess) => {
    setOnboardingToDelete(onboarding);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!onboardingToDelete) return;

    try {
      setDeleting(true);
      const response = await onboardingApi.deleteOnboarding(onboardingToDelete.id);

      if (
        (typeof response === 'object' &&
          response !== null &&
          'success' in response &&
          response.success) ||
        response === undefined
      ) {
        toast.success('Onboarding process deleted successfully');
        await fetchOnboardings();
      } else if (
        typeof response === 'object' &&
        response !== null &&
        'message' in response &&
        typeof response.message === 'string'
      ) {
        toast.error(response.message || 'Failed to delete onboarding process');
      } else {
        toast.success('Onboarding process deleted successfully');
        await fetchOnboardings();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete onboarding process';
      toast.error(errorMessage);
      console.error('Error deleting onboarding:', err);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setOnboardingToDelete(null);
    }
  };

  const getStatusBadge = (status: OnboardingProcessStatus) => {
    const statusConfig = {
      NOT_STARTED: { variant: 'secondary' as const, label: 'Not Started', className: '' },
      IN_PROGRESS: { variant: 'default' as const, label: 'In Progress', className: '' },
      COMPLETED: {
        variant: 'outline' as const,
        label: 'Completed',
        className: 'border-green-500 text-green-700 dark:text-green-400',
      },
      ON_HOLD: {
        variant: 'outline' as const,
        label: 'On Hold',
        className: 'border-yellow-500 text-yellow-700 dark:text-yellow-400',
      },
      CANCELLED: { variant: 'destructive' as const, label: 'Cancelled', className: '' },
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getPhaseBadge = (phase: OnboardingPhase) => {
    const phaseConfig = {
      PRE_BOARDING: {
        label: 'Pre-boarding',
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      },
      FIRST_DAY: {
        label: 'First Day',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      },
      FIRST_WEEK: {
        label: 'First Week',
        color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      },
      FIRST_MONTH: {
        label: 'First Month',
        color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      },
      FIRST_QUARTER: {
        label: 'First Quarter',
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      },
    };

    const config = phaseConfig[phase];
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Onboarding Management</h1>
          <p className="text-muted-foreground">Manage employee onboarding processes and tasks</p>
        </div>
        <Button
          onClick={() => navigation.push('/dashboard/admin/onboarding/create')}
          className="cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Onboarding
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Processes</CardTitle>
            <UserPlus className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onboardings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {onboardings.filter((o) => o.status === 'IN_PROGRESS').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Target className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {onboardings.filter((o) => o.status === 'COMPLETED').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not Started</CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {onboardings.filter((o) => o.status === 'NOT_STARTED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search by name, email, position, or department..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as 'all' | OnboardingProcessStatus);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Phase Filter */}
            <Select
              value={phaseFilter}
              onValueChange={(value) => {
                setPhaseFilter(value as 'all' | OnboardingPhase);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Phases</SelectItem>
                <SelectItem value="PRE_BOARDING">Pre-boarding</SelectItem>
                <SelectItem value="FIRST_DAY">First Day</SelectItem>
                <SelectItem value="FIRST_WEEK">First Week</SelectItem>
                <SelectItem value="FIRST_MONTH">First Month</SelectItem>
                <SelectItem value="FIRST_QUARTER">First Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent>
          {paginatedOnboardings.length === 0 ? (
            <div className="flex h-96 flex-col items-center justify-center">
              <UserPlus className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="text-lg font-semibold">No onboarding processes found</h3>
              <p className="text-muted-foreground text-sm">
                {searchTerm || statusFilter !== 'all' || phaseFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first onboarding process to get started'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Phase</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOnboardings.map((onboarding) => (
                      <TableRow key={onboarding.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {onboarding.employee.firstName} {onboarding.employee.lastName}
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {onboarding.employee.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{onboarding.employee.position}</TableCell>
                        <TableCell>{onboarding.employee.department.name}</TableCell>
                        <TableCell>{getStatusBadge(onboarding.status)}</TableCell>
                        <TableCell>{getPhaseBadge(onboarding.currentPhase)}</TableCell>
                        <TableCell>{formatDate(onboarding.startDate)}</TableCell>
                        <TableCell>
                          {onboarding.assignedTo
                            ? `${onboarding.assignedTo.firstName} ${onboarding.assignedTo.lastName}`
                            : 'Unassigned'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="cursor-pointer">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  navigation.push(`/dashboard/admin/onboarding/${onboarding.id}`)
                                }
                                className="cursor-pointer"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  navigation.push(
                                    `/dashboard/admin/onboarding/${onboarding.id}/edit`
                                  )
                                }
                                className="cursor-pointer"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(onboarding)}
                                className="text-destructive cursor-pointer"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-4 md:hidden">
                {paginatedOnboardings.map((onboarding) => (
                  <Card key={onboarding.id}>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">
                              {onboarding.employee.firstName} {onboarding.employee.lastName}
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {onboarding.employee.email}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="cursor-pointer">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  navigation.push(`/dashboard/admin/onboarding/${onboarding.id}`)
                                }
                                className="cursor-pointer"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  navigation.push(
                                    `/dashboard/admin/onboarding/${onboarding.id}/edit`
                                  )
                                }
                                className="cursor-pointer"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(onboarding)}
                                className="text-destructive cursor-pointer"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Position:</span>
                            <div className="font-medium">{onboarding.employee.position}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Department:</span>
                            <div className="font-medium">{onboarding.employee.department.name}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Start Date:</span>
                            <div className="font-medium">{formatDate(onboarding.startDate)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Assignee:</span>
                            <div className="font-medium">
                              {onboarding.assignedTo
                                ? `${onboarding.assignedTo.firstName} ${onboarding.assignedTo.lastName}`
                                : 'Unassigned'}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {getStatusBadge(onboarding.status)}
                          {getPhaseBadge(onboarding.currentPhase)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-muted-foreground text-sm">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, sortedOnboardings.length)} of{' '}
                    {sortedOnboardings.length} onboarding processes
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="cursor-pointer"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Onboarding Process</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the onboarding process for{' '}
              <span className="font-semibold">
                {onboardingToDelete?.employee.firstName} {onboardingToDelete?.employee.lastName}
              </span>
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
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
