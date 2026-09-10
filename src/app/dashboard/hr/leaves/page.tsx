'use client';

import { useState, useEffect, useMemo } from 'react';
import { useNavigation } from '@/hooks/use-navigation';
import { leaveRequestsApi } from '@/lib/api/leaveRequests';
import { leaveTypesApi } from '@/lib/api/leaveTypes';
import type { LeaveRequest, LeaveType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
  Loader2,
  FileText,
  Clock,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

export default function HRLeavesPage() {
  const navigation = useNavigation();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Approve Dialog
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [approvingLeave, setApprovingLeave] = useState<LeaveRequest | null>(null);
  const [approveReason, setApproveReason] = useState('');
  const [approving, setApproving] = useState(false);

  // Reject Dialog
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectingLeave, setRejectingLeave] = useState<LeaveRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const response = await leaveRequestsApi.getAllLeaveRequests();
      if (response.success && response.data) {
        setLeaves(response.data);
      } else if (Array.isArray(response)) {
        setLeaves(response);
      }
    } catch (err) {
      console.error('Error fetching leave requests:', err);
      toast.error('Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const response = await leaveTypesApi.getAllLeaveTypes();
      if (response.success && response.data) {
        setLeaveTypes(response.data);
      } else if (Array.isArray(response)) {
        setLeaveTypes(response);
      }
    } catch (err) {
      console.error('Error fetching leave types:', err);
    }
  };

  useEffect(() => {
    fetchLeaves();
    fetchLeaveTypes();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }
    > = {
      PENDING: { variant: 'outline', label: 'Pending' },
      APPROVED: { variant: 'default', label: 'Approved' },
      REJECTED: { variant: 'destructive', label: 'Rejected' },
      CANCELLED: { variant: 'secondary', label: 'Cancelled' },
    };

    const config = variants[status] || variants.PENDING;
    return (
      <Badge variant={config.variant} className="capitalize">
        {config.label}
      </Badge>
    );
  };

  // Filter and sort leave requests
  const filteredLeaves = useMemo(() => {
    const filtered = leaves.filter((leave) => {
      const fullName =
        `${leave.employee.user.firstName} ${leave.employee.user.lastName}`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchTerm.toLowerCase()) ||
        leave.employee.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        leave.reason.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || leave.status === statusFilter;
      const matchesType = typeFilter === 'all' || leave.leaveType.id === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'date') {
        comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      } else if (sortBy === 'status') {
        comparison = a.status.localeCompare(b.status);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [leaves, searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  const stats = useMemo(() => {
    return {
      total: leaves.length,
      pending: leaves.filter((l) => l.status === 'PENDING').length,
      approved: leaves.filter((l) => l.status === 'APPROVED').length,
      rejected: leaves.filter((l) => l.status === 'REJECTED').length,
    };
  }, [leaves]);

  const handleOpenApproveDialog = (leave: LeaveRequest) => {
    setApprovingLeave(leave);
    setApproveReason('');
    setShowApproveDialog(true);
  };

  const handleCloseApproveDialog = () => {
    setShowApproveDialog(false);
    setApprovingLeave(null);
    setApproveReason('');
  };

  const handleApprove = async () => {
    if (!approvingLeave) return;

    try {
      setApproving(true);
      await leaveRequestsApi.approveLeaveRequest(approvingLeave.id, {
        comments: approveReason || undefined,
      });
      toast.success('Leave request approved successfully');
      handleCloseApproveDialog();
      fetchLeaves();
    } catch (error) {
      console.error('Error approving leave:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve leave request');
    } finally {
      setApproving(false);
    }
  };

  const handleOpenRejectDialog = (leave: LeaveRequest) => {
    setRejectingLeave(leave);
    setRejectReason('');
    setShowRejectDialog(true);
  };

  const handleCloseRejectDialog = () => {
    setShowRejectDialog(false);
    setRejectingLeave(null);
    setRejectReason('');
  };

  const handleReject = async () => {
    if (!rejectingLeave) return;

    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setRejecting(true);
      await leaveRequestsApi.rejectLeaveRequest(rejectingLeave.id, {
        reason: rejectReason,
      });
      toast.success('Leave request rejected successfully');
      handleCloseRejectDialog();
      fetchLeaves();
    } catch (error) {
      console.error('Error rejecting leave:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reject leave request');
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leave Requests</h1>
          <p className="text-muted-foreground mt-1">Manage and review employee leave requests</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search by employee, email, or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Leave Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {leaveTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(value) => {
                const [newSortBy, newSortOrder] = value.split('-') as [
                  'date' | 'status',
                  'asc' | 'desc',
                ];
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                <SelectItem value="status-desc">Status (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>All Leave Requests</CardTitle>
          <CardDescription>Showing {filteredLeaves.length} leave requests</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center">
              <Calendar className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="text-lg font-semibold">No leave requests found</h3>
              <p className="text-muted-foreground text-sm">
                {leaves.length === 0
                  ? 'No leave requests submitted yet'
                  : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeaves.map((leave) => (
                        <TableRow key={leave.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={leave.employee.user.profilePicture || undefined}
                                />
                                <AvatarFallback>
                                  {leave.employee.user.firstName[0]}
                                  {leave.employee.user.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {leave.employee.user.firstName} {leave.employee.user.lastName}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                  {leave.employee.department?.name || 'No Department'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{leave.leaveType.name}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{formatDate(leave.startDate)}</div>
                              <div className="text-muted-foreground">
                                to {formatDate(leave.endDate)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{leave.numberOfDays} days</TableCell>
                          <TableCell>{getStatusBadge(leave.status)}</TableCell>
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
                                    navigation.push(`/dashboard/hr/leaves/${leave.id}`)
                                  }
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {leave.status === 'PENDING' && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handleOpenApproveDialog(leave)}
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleOpenRejectDialog(leave)}
                                      className="text-destructive"
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="space-y-4 md:hidden">
                {filteredLeaves.map((leave) => (
                  <Card key={leave.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={leave.employee.user.profilePicture || undefined} />
                              <AvatarFallback>
                                {leave.employee.user.firstName[0]}
                                {leave.employee.user.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {leave.employee.user.firstName} {leave.employee.user.lastName}
                              </p>
                              <p className="text-muted-foreground text-sm">
                                {leave.employee.department?.name || 'No Department'}
                              </p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => navigation.push(`/dashboard/hr/leaves/${leave.id}`)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {leave.status === 'PENDING' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleOpenApproveDialog(leave)}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleOpenRejectDialog(leave)}
                                    className="text-destructive"
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="grid gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Leave Type:</span>
                            <Badge variant="outline">{leave.leaveType.name}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Duration:</span>
                            <span className="font-medium">
                              {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Days:</span>
                            <span className="font-medium">{leave.numberOfDays} days</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            {getStatusBadge(leave.status)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Leave Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this leave request for{' '}
              <strong>
                {approvingLeave?.employee.user.firstName} {approvingLeave?.employee.user.lastName}
              </strong>
              ?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approveReason">Approval Note (Optional)</Label>
              <Textarea
                id="approveReason"
                value={approveReason}
                onChange={(e) => setApproveReason(e.target.value)}
                placeholder="Add any notes or comments..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseApproveDialog} disabled={approving}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={approving}>
              {approving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                'Approve'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this leave request from{' '}
              <strong>
                {rejectingLeave?.employee.user.firstName} {rejectingLeave?.employee.user.lastName}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">
                Rejection Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Provide a clear reason for rejection..."
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseRejectDialog} disabled={rejecting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejecting}>
              {rejecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
