'use client';

import { useState, useEffect, useMemo } from 'react';
import { leaveRequestsApi } from '@/lib/api/leaveRequests';
import { documentsApi } from '@/lib/api/documents';
import type { LeaveRequest, Document } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { FileText, Loader2, Upload, Download, Eye, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function EmployeeDocumentsPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<string | null>(null);

  // Upload Dialog
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchLeaveRequests = async () => {
    try {
      const response = await leaveRequestsApi.getMyLeaveRequests();
      if (response.success && response.data) {
        setLeaveRequests(response.data);
      } else if (Array.isArray(response)) {
        setLeaveRequests(response);
      }
    } catch (err) {
      console.error('Error fetching leave requests:', err);
      toast.error('Failed to fetch leave requests');
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      // Fetch documents for all leave requests
      const allDocuments: Document[] = [];

      const response = await leaveRequestsApi.getMyLeaveRequests();
      const leaves = Array.isArray(response)
        ? response
        : response.success && response.data
          ? response.data
          : [];

      for (const leave of leaves) {
        try {
          const docResponse = await documentsApi.getDocumentsByLeaveRequest(leave.id);
          if (docResponse.success && docResponse.data) {
            allDocuments.push(...docResponse.data);
          } else if (Array.isArray(docResponse)) {
            allDocuments.push(...docResponse);
          }
        } catch (err) {
          // Skip if documents fetch fails for a leave request
          console.error(`Error fetching documents for leave ${leave.id}:`, err);
        }
      }

      setDocuments(allDocuments);
    } catch (err) {
      console.error('Error fetching documents:', err);
      toast.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
    fetchDocuments();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  // Group documents by leave request
  const documentsByLeaveRequest = useMemo(() => {
    const grouped: Record<string, { leave: LeaveRequest; documents: Document[] }> = {};

    leaveRequests.forEach((leave) => {
      grouped[leave.id] = {
        leave,
        documents: documents.filter((doc) => doc.leaveRequestId === leave.id),
      };
    });

    return grouped;
  }, [leaveRequests, documents]);

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
    if (!selectedFile || !selectedLeaveRequest) return;

    try {
      setUploading(true);
      const response = await documentsApi.uploadDocument(selectedLeaveRequest, selectedFile);

      if (response.success) {
        toast.success('Document uploaded successfully');
        setShowUploadDialog(false);
        setSelectedFile(null);
        setSelectedLeaveRequest(null);
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

  const handleOpenUploadDialog = (leaveRequestId: string) => {
    setSelectedLeaveRequest(leaveRequestId);
    setSelectedFile(null);
    setShowUploadDialog(true);
  };

  const handleCloseUploadDialog = () => {
    setShowUploadDialog(false);
    setSelectedFile(null);
    setSelectedLeaveRequest(null);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Documents</h1>
          <p className="text-muted-foreground mt-1">
            View and manage documents for your leave requests
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Leave Requests</CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaveRequests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Requests with Documents</CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                Object.values(documentsByLeaveRequest).filter((group) => group.documents.length > 0)
                  .length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents by Leave Request */}
      {loading ? (
        <Card>
          <CardContent className="flex h-64 items-center justify-center">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      ) : Object.keys(documentsByLeaveRequest).length === 0 ? (
        <Card>
          <CardContent className="flex h-64 flex-col items-center justify-center">
            <FileText className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="text-lg font-semibold">No leave requests found</h3>
            <p className="text-muted-foreground text-sm">
              You have not submitted any leave requests yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.values(documentsByLeaveRequest).map((group) => (
            <Card key={group.leave.id}>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{group.leave.leaveType.name} Leave</CardTitle>
                      {getStatusBadge(group.leave.status)}
                    </div>
                    <CardDescription>
                      {formatDate(group.leave.startDate)} - {formatDate(group.leave.endDate)} (
                      {group.leave.numberOfDays} days)
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => handleOpenUploadDialog(group.leave.id)}
                    disabled={group.leave.status !== 'PENDING'}
                    className="cursor-pointer"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {group.documents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="text-muted-foreground mb-2 h-8 w-8" />
                    <p className="text-muted-foreground text-sm">
                      No documents uploaded for this leave request
                    </p>
                    {group.leave.status === 'PENDING' && (
                      <p className="text-muted-foreground mt-1 text-xs">
                        Click Upload Document to add supporting documents
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {group.documents.map((document) => (
                      <div
                        key={document.id}
                        className="hover:bg-muted/50 flex items-center justify-between rounded-md border p-3"
                      >
                        <div className="flex flex-1 items-center gap-3">
                          <div className="text-2xl">{getFileTypeIcon(document.cloudinaryUrl)}</div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">
                              {getFileName(document.cloudinaryUrl)}
                            </p>
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
          ))}
        </div>
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
    </div>
  );
}
