'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useNavigation } from '@/hooks/use-navigation';
import { leaveRequestsApi } from '@/lib/api/leaveRequests';
import { documentsApi } from '@/lib/api/documents';
import type { LeaveRequest, Document } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Calendar,
  FileText,
  Clock,
  Loader2,
  Edit,
  X,
  Upload,
  Download,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

export default function EmployeeLeaveDetailPage() {
  const params = useParams();
  const navigation = useNavigation();
  const [leave, setLeave] = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  // Cancel Dialog
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Upload Dialog
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
        navigation.push('/dashboard/employee/leaves');
      }
    } catch (err) {
      console.error('Error fetching leave request:', err);
      toast.error('Failed to fetch leave request details');
      navigation.push('/dashboard/employee/leaves');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    if (!params.id) return;

    try {
      setLoadingDocuments(true);
      const response = await documentsApi.getDocumentsByLeaveRequest(params.id as string);
      if (response.success && response.data) {
        setDocuments(response.data);
      } else if (Array.isArray(response)) {
        setDocuments(response);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      // Don't show error toast for documents as it's not critical
    } finally {
      setLoadingDocuments(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchLeave();
      fetchDocuments();
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

  const handleOpenCancelDialog = () => {
    setCancelReason('');
    setShowCancelDialog(true);
  };

  const handleCloseCancelDialog = () => {
    setShowCancelDialog(false);
    setCancelReason('');
  };

  const handleCancel = async () => {
    if (!leave) return;

    try {
      setCancelling(true);
      await leaveRequestsApi.cancelLeaveRequest(leave.id, {
        reason: cancelReason || undefined,
      });
      toast.success('Leave request cancelled successfully');
      handleCloseCancelDialog();
      fetchLeave();
    } catch (error) {
      console.error('Error cancelling leave:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel leave request');
    } finally {
      setCancelling(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload PDF, Word, or image files.');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !leave) return;

    try {
      setUploading(true);
      const response = await documentsApi.uploadDocument(leave.id, selectedFile);

      if (response.success) {
        toast.success('Document uploaded successfully');
        setShowUploadDialog(false);
        setSelectedFile(null);
        fetchDocuments();
      } else {
        toast.error(response.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (document: Document) => {
    window.open(document.cloudinaryUrl, '_blank');
  };

  const handleOpenUploadDialog = () => {
    setSelectedFile(null);
    setShowUploadDialog(true);
  };

  const handleCloseUploadDialog = () => {
    setShowUploadDialog(false);
    setSelectedFile(null);
  };

  const getFileTypeIcon = (url: string) => {
    if (url.includes('.pdf')) return '📄';
    if (url.includes('.doc') || url.includes('.docx')) return '📝';
    if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png')) return '🖼️';
    return '📎';
  };

  const getFileName = (url: string) => {
    try {
      const parts = url.split('/');
      const fileName = parts[parts.length - 1];
      return fileName.split('?')[0]; // Remove query parameters
    } catch {
      return 'Document';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
            onClick={() => navigation.push('/dashboard/employee/leaves')}
            className="cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Leave Request Details</h1>
            <p className="text-muted-foreground mt-1">View your leave request details</p>
          </div>
        </div>
        {leave.status === 'PENDING' && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigation.push(`/dashboard/employee/leaves/${leave.id}/edit`)}
              className="cursor-pointer"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={handleOpenCancelDialog}
              className="cursor-pointer"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        )}
      </div>

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

      {/* Documents Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Documents</CardTitle>
            {leave.status === 'PENDING' && (
              <Button onClick={handleOpenUploadDialog} className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingDocuments ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="text-primary h-6 w-6 animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="text-muted-foreground mb-2 h-8 w-8" />
              <p className="text-muted-foreground text-sm">
                No documents uploaded for this leave request
              </p>
              {leave.status === 'PENDING' && (
                <p className="text-muted-foreground mt-1 text-xs">
                  Click Upload Document to add supporting documents
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="hover:bg-muted/50 flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex flex-1 items-center gap-3">
                    <div className="text-2xl">{getFileTypeIcon(document.cloudinaryUrl)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{getFileName(document.cloudinaryUrl)}</p>
                      <p className="text-muted-foreground text-xs">
                        Uploaded {formatDateTime(document.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(document)}
                      className="cursor-pointer"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(document)}
                      className="cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                <span className="text-muted-foreground text-sm">
                  {leave.status === 'APPROVED' ? 'Approved By' : 'Rejected By'}
                </span>
                <p className="font-medium">{leave.approvedBy}</p>
              </div>
            )}

            {leave.approvedAt && (
              <div className="space-y-2">
                <span className="text-muted-foreground text-sm">
                  {leave.status === 'APPROVED' ? 'Approved On' : 'Rejected On'}
                </span>
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

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a supporting document for your leave request. Accepted formats: PDF, Word,
              Images (max 10MB)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="document">Select Document</Label>
              <Input
                id="document"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              {selectedFile && (
                <p className="text-muted-foreground text-sm">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseUploadDialog} disabled={uploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="cursor-pointer"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Leave Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this leave request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancelReason">Cancellation Reason (Optional)</Label>
              <Textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Add any notes or comments..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseCancelDialog} disabled={cancelling}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Leave Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
