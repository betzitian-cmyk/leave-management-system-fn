'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useNavigation } from '@/hooks/use-navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leaveRequestsApi } from '@/lib/api/leaveRequests';
import {
  approveLeaveRequestSchema,
  rejectLeaveRequestSchema,
  type ApproveLeaveRequestFormData,
  type RejectLeaveRequestFormData,
} from '@/schemas/leaveRequest';
import type { LeaveRequest, LeaveRequestStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2,
  ArrowLeft,
  Calendar,
  User,
  Building2,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
} from 'lucide-react';
import { toast } from 'sonner';

const InfoItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | React.ReactNode;
}) => (
  <Card>
    <CardContent>
      <div className="flex items-start space-x-3">
        <Icon className="text-muted-foreground mt-0.5 h-5 w-5" />
        <div className="flex-1">
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
          <p className="mt-1 text-sm font-semibold">{value}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function LeaveRequestViewPage() {
  const params = useParams();
  const navigation = useNavigation();
  const [leaveRequest, setLeaveRequest] = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const approveForm = useForm<ApproveLeaveRequestFormData>({
    resolver: zodResolver(approveLeaveRequestSchema),
  });

  const rejectForm = useForm<RejectLeaveRequestFormData>({
    resolver: zodResolver(rejectLeaveRequestSchema),
  });

  const requestId = params.id as string;

  useEffect(() => {
    const fetchLeaveRequest = async () => {
      try {
        setLoading(true);
        const response = await leaveRequestsApi.getLeaveRequestById(requestId);

        if (response.success && response.data) {
          setLeaveRequest(response.data);
        } else if ('id' in response) {
          setLeaveRequest(response as unknown as LeaveRequest);
        } else {
          toast.error('Failed to load leave request details');
        }
      } catch (err) {
        console.error('Error fetching leave request:', err);
        toast.error('Failed to load leave request details');
      } finally {
        setLoading(false);
      }
    };

    if (requestId) {
      fetchLeaveRequest();
    }
  }, [requestId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: LeaveRequestStatus) => {
    const variants: Record<
      LeaveRequestStatus,
      {
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
        text: string;
        icon: React.ComponentType<{ className?: string }>;
      }
    > = {
      PENDING: { variant: 'outline', text: 'Pending', icon: Clock },
      APPROVED: { variant: 'default', text: 'Approved', icon: CheckCircle },
      REJECTED: { variant: 'destructive', text: 'Rejected', icon: XCircle },
      CANCELLED: { variant: 'secondary', text: 'Cancelled', icon: XCircle },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const handleApprove = async (data: ApproveLeaveRequestFormData) => {
    setProcessing(true);
    try {
      await leaveRequestsApi.approveLeaveRequest(requestId, data);
      toast.success('Leave request approved successfully');
      setApproveDialogOpen(false);

      // Refresh the leave request
      const response = await leaveRequestsApi.getLeaveRequestById(requestId);
      if (response.success && response.data) {
        setLeaveRequest(response.data);
      } else if ('id' in response) {
        setLeaveRequest(response as unknown as LeaveRequest);
      }
    } catch (error) {
      console.error('Error approving leave request:', error);
      toast.error('Failed to approve leave request');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (data: RejectLeaveRequestFormData) => {
    setProcessing(true);
    try {
      await leaveRequestsApi.rejectLeaveRequest(requestId, data);
      toast.success('Leave request rejected');
      setRejectDialogOpen(false);

      // Refresh the leave request
      const response = await leaveRequestsApi.getLeaveRequestById(requestId);
      if (response.success && response.data) {
        setLeaveRequest(response.data);
      } else if ('id' in response) {
        setLeaveRequest(response as unknown as LeaveRequest);
      }
    } catch (error) {
      console.error('Error rejecting leave request:', error);
      toast.error('Failed to reject leave request');
    } finally {
      setProcessing(false);
    }
  };

  const handleBack = () => {
    navigation.push('/dashboard/admin/leave-requests');
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!leaveRequest) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={handleBack} className="cursor-pointer">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Leave Requests
        </Button>
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-center">Leave request not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
        <div className="flex items-start space-x-4">
          <Button variant="outline" size="icon" onClick={handleBack} className="cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {leaveRequest.employee.user.firstName} {leaveRequest.employee.user.lastName} - Leave
              Request
            </h1>
            <p className="text-muted-foreground">{leaveRequest.leaveType.name}</p>
            <div className="mt-2">{getStatusBadge(leaveRequest.status)}</div>
          </div>
        </div>
        {leaveRequest.status === 'PENDING' && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="cursor-pointer"
              onClick={() => navigation.push(`/dashboard/admin/leave-requests/${requestId}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="default"
              className="cursor-pointer"
              onClick={() => setApproveDialogOpen(true)}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="cursor-pointer"
              onClick={() => setRejectDialogOpen(true)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </div>
        )}
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="cursor-pointer">
            Overview
          </TabsTrigger>
          <TabsTrigger value="details" className="cursor-pointer">
            Details
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              icon={User}
              label="Employee"
              value={`${leaveRequest.employee.user.firstName} ${leaveRequest.employee.user.lastName}`}
            />
            <InfoItem
              icon={Building2}
              label="Department"
              value={leaveRequest.employee.department?.name || 'N/A'}
            />
            <InfoItem icon={Calendar} label="Leave Type" value={leaveRequest.leaveType.name} />
            <InfoItem
              icon={Calendar}
              label="Start Date"
              value={formatDate(leaveRequest.startDate)}
            />
            <InfoItem icon={Calendar} label="End Date" value={formatDate(leaveRequest.endDate)} />
            <InfoItem
              icon={Clock}
              label="Number of Days"
              value={`${leaveRequest.numberOfDays} days`}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Reason for Leave
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">{leaveRequest.reason}</p>
            </CardContent>
          </Card>

          {leaveRequest.approvalReason && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Approver Comments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{leaveRequest.approvalReason}</p>
              </CardContent>
            </Card>
          )}

          {leaveRequest.rejectionReason && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  Rejection Reason
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{leaveRequest.rejectionReason}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Request ID</p>
                  <p className="mt-1 font-mono text-sm font-semibold">{leaveRequest.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Status</p>
                  <div className="mt-1">{getStatusBadge(leaveRequest.status)}</div>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Created At</p>
                  <p className="mt-1 text-sm font-semibold">{formatDate(leaveRequest.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Last Updated</p>
                  <p className="mt-1 text-sm font-semibold">{formatDate(leaveRequest.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Employee Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Employee Name</p>
                  <p className="mt-1 text-sm font-semibold">
                    {leaveRequest.employee.user.firstName} {leaveRequest.employee.user.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Email</p>
                  <p className="mt-1 text-sm font-semibold">{leaveRequest.employee.user.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Department</p>
                  <p className="mt-1 text-sm font-semibold">
                    {leaveRequest.employee.department?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Employee ID</p>
                  <p className="mt-1 font-mono text-sm font-semibold">{leaveRequest.employee.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <form onSubmit={approveForm.handleSubmit(handleApprove)}>
            <DialogHeader>
              <DialogTitle>Approve Leave Request</DialogTitle>
              <DialogDescription>
                Are you sure you want to approve this leave request? You can add optional comments.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="approveComments">Comments (Optional)</Label>
                <Textarea
                  id="approveComments"
                  placeholder="Add any comments..."
                  rows={3}
                  {...approveForm.register('comments')}
                />
                {approveForm.formState.errors.comments && (
                  <p className="text-destructive text-sm">
                    {approveForm.formState.errors.comments.message}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setApproveDialogOpen(false)}
                disabled={processing}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={processing} className="cursor-pointer">
                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {processing ? 'Approving...' : 'Approve Request'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <form onSubmit={rejectForm.handleSubmit(handleReject)}>
            <DialogHeader>
              <DialogTitle>Reject Leave Request</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this leave request.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="rejectReason">Rejection Reason *</Label>
                <Textarea
                  id="rejectReason"
                  placeholder="Explain why this request is being rejected..."
                  rows={4}
                  {...rejectForm.register('reason')}
                />
                {rejectForm.formState.errors.reason && (
                  <p className="text-destructive text-sm">
                    {rejectForm.formState.errors.reason.message}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectDialogOpen(false)}
                disabled={processing}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={processing}
                className="cursor-pointer"
              >
                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {processing ? 'Rejecting...' : 'Reject Request'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
