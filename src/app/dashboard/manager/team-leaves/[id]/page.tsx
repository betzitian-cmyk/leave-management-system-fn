'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useNavigation } from '@/hooks/use-navigation';
import { leaveRequestsApi } from '@/lib/api/leaveRequests';
import type { LeaveRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Calendar,
  User,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Mail,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ManagerTeamLeaveDetailPage() {
  const params = useParams();
  const navigation = useNavigation();
  const [leave, setLeave] = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(true);

  // Approve Dialog
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [approveReason, setApproveReason] = useState('');
  const [approving, setApproving] = useState(false);

  // Reject Dialog
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const fetchLeave = async () => {
    try {
      setLoading(true);
      const response = await leaveRequestsApi.getLeaveRequestById(params.id as string);

      let leaveData: LeaveRequest | null = null;
      if (response.success && response.data) {
        leaveData = response.data;
      } else if ('id' in response && 'employee' in response) {
        leaveData = response as unknown as LeaveRequest;
      }

      if (leaveData) {
        setLeave(leaveData);
      } else {
        toast.error('Leave request not found');
        navigation.push('/dashboard/manager/team-leaves');
      }
    } catch (err) {
      console.error('Error fetching leave request:', err);
      toast.error('Failed to fetch leave request details');
      navigation.push('/dashboard/manager/team-leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchLeave();
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  const handleOpenApproveDialog = () => {
    setApproveReason('');
    setShowApproveDialog(true);
  };

  const handleCloseApproveDialog = () => {
    setShowApproveDialog(false);
    setApproveReason('');
  };

  const handleApprove = async () => {
    if (!leave) return;

    try {
      setApproving(true);
      await leaveRequestsApi.approveLeaveRequest(leave.id, {
        comments: approveReason || undefined,
      });
      toast.success('Leave request approved successfully');
      handleCloseApproveDialog();
      fetchLeave();
    } catch (error) {
      console.error('Error approving leave:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve leave request');
    } finally {
      setApproving(false);
    }
  };

  const handleOpenRejectDialog = () => {
    setRejectReason('');
    setShowRejectDialog(true);
  };

  const handleCloseRejectDialog = () => {
    setShowRejectDialog(false);
    setRejectReason('');
  };

  const handleReject = async () => {
    if (!leave) return;

    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setRejecting(true);
      await leaveRequestsApi.rejectLeaveRequest(leave.id, {
        reason: rejectReason,
      });
      toast.success('Leave request rejected successfully');
      handleCloseRejectDialog();
      fetchLeave();
    } catch (error) {
      console.error('Error rejecting leave:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reject leave request');
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!leave) {
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
            onClick={() => navigation.push('/dashboard/manager/team-leaves')}
            className="cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Team Leave Request Details</h1>
            <p className="text-muted-foreground mt-1">
              Review and manage team member leave request
            </p>
          </div>
        </div>
        {leave.status === 'PENDING' && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleOpenRejectDialog} className="cursor-pointer">
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button onClick={handleOpenApproveDialog} className="cursor-pointer">
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </div>
        )}
      </div>

      {/* Employee Information */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={leave.employee.user.profilePicture || undefined} />
              <AvatarFallback className="text-lg">
                {leave.employee.user.firstName[0]}
                {leave.employee.user.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-xl font-semibold">
                  {leave.employee.user.firstName} {leave.employee.user.lastName}
                </h3>
                <div className="text-muted-foreground mt-2 flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {leave.employee.user.email}
                  </div>
                  {leave.employee.department && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {leave.employee.department.name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Details */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm">Leave Type</span>
              </div>
              <Badge variant="outline" className="text-base">
                {leave.leaveType.name}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm">Status</span>
              </div>
              {getStatusBadge(leave.status)}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm">Start Date</span>
              </div>
              <p className="font-medium">{formatDate(leave.startDate)}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm">End Date</span>
              </div>
              <p className="font-medium">{formatDate(leave.endDate)}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm">Duration</span>
              </div>
              <p className="font-medium">{leave.numberOfDays} days</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm">Requested On</span>
              </div>
              <p className="font-medium">{formatDateTime(leave.createdAt)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-muted-foreground text-sm">Reason</span>
            <p className="text-foreground bg-muted/50 rounded-md border p-3">{leave.reason}</p>
          </div>
        </CardContent>
      </Card>

      {/* Approval/Rejection Information */}
      {(leave.status === 'APPROVED' || leave.status === 'REJECTED') && (
        <Card>
          <CardHeader>
            <CardTitle>
              {leave.status === 'APPROVED' ? 'Approval' : 'Rejection'} Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {leave.approvedBy && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground text-sm">
                    {leave.status === 'APPROVED' ? 'Approved By' : 'Rejected By'}
                  </span>
                </div>
                <p className="font-medium">{leave.approvedBy}</p>
              </div>
            )}

            {leave.approvedAt && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground text-sm">
                    {leave.status === 'APPROVED' ? 'Approved On' : 'Rejected On'}
                  </span>
                </div>
                <p className="font-medium">{formatDateTime(leave.approvedAt)}</p>
              </div>
            )}

            {leave.approvalReason && (
              <div className="space-y-2">
                <span className="text-muted-foreground text-sm">
                  {leave.status === 'APPROVED' ? 'Approval Note' : 'Rejection Reason'}
                </span>
                <p className="text-foreground bg-muted/50 rounded-md border p-3">
                  {leave.approvalReason}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Leave Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this leave request for{' '}
              <strong>
                {leave.employee.user.firstName} {leave.employee.user.lastName}
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
            <Button onClick={handleApprove} disabled={approving} className="cursor-pointer">
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
                {leave.employee.user.firstName} {leave.employee.user.lastName}
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
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejecting}
              className="cursor-pointer"
            >
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
