'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useNavigation } from '@/hooks/use-navigation';
import { jobApplicationsApi, interviewsApi } from '@/lib/api/recruitment';
import type { JobApplication, Interview } from '@/types';
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
import {
  ArrowLeft,
  Mail,
  Phone,
  FileText,
  Briefcase,
  DollarSign,
  Calendar,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ApplicationDetailPage() {
  const params = useParams();
  const navigation = useNavigation();
  const [application, setApplication] = useState<JobApplication | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  // Update status dialog
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const response = await jobApplicationsApi.getApplicationById(params.id as string);

      let appData: JobApplication | null = null;
      if ('success' in response && response.success && 'data' in response) {
        appData = response.data as JobApplication;
      } else if ('id' in response && 'firstName' in response) {
        appData = response as unknown as JobApplication;
      }

      if (appData) {
        setApplication(appData);
        // Fetch interviews for this application
        try {
          const interviewsResponse = await interviewsApi.getAllInterviews();
          if (
            'success' in interviewsResponse &&
            interviewsResponse.success &&
            'data' in interviewsResponse
          ) {
            setInterviews(
              (interviewsResponse.data as Interview[]).filter(
                (interview) => interview.jobApplication.id === appData.id
              )
            );
          } else if ('data' in interviewsResponse && Array.isArray(interviewsResponse.data)) {
            setInterviews(
              interviewsResponse.data.filter(
                (interview: Interview) => interview.jobApplication.id === appData.id
              )
            );
          }
        } catch (err) {
          console.error('Error fetching interviews:', err);
        }
      } else {
        toast.error('Application not found');
        navigation.push('/dashboard/hr/recruitment');
      }
    } catch (err) {
      console.error('Error fetching application:', err);
      toast.error('Failed to fetch application details');
      navigation.push('/dashboard/hr/recruitment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchApplication();
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
    return new Date(dateString).toLocaleString('en-US', {
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

  const handleOpenStatusDialog = (status: string) => {
    setNewStatus(status);
    setStatusNotes('');
    setShowStatusDialog(true);
  };

  const handleCloseStatusDialog = () => {
    setShowStatusDialog(false);
    setNewStatus('');
    setStatusNotes('');
  };

  const handleUpdateStatus = async () => {
    if (!application) return;

    try {
      setUpdating(true);
      await jobApplicationsApi.updateApplication(application.id, {
        status: newStatus as 'PENDING' | 'REVIEWING' | 'SHORTLISTED' | 'REJECTED' | 'HIRED',
        notes: statusNotes || undefined,
      });
      toast.success('Application status updated successfully');
      handleCloseStatusDialog();
      fetchApplication();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!application) {
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
            <h1 className="text-3xl font-bold">
              {application.firstName} {application.lastName}
            </h1>
            <p className="text-muted-foreground mt-1">
              Application for {application.jobPosting.title}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {application.status === 'PENDING' && (
            <>
              <Button variant="outline" onClick={() => handleOpenStatusDialog('REVIEWING')}>
                <Clock className="mr-2 h-4 w-4" />
                Review
              </Button>
              <Button onClick={() => handleOpenStatusDialog('SHORTLISTED')}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Shortlist
              </Button>
            </>
          )}
          {application.status === 'REVIEWING' && (
            <>
              <Button variant="outline" onClick={() => handleOpenStatusDialog('REJECTED')}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button onClick={() => handleOpenStatusDialog('SHORTLISTED')}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Shortlist
              </Button>
            </>
          )}
          {application.status === 'SHORTLISTED' && (
            <>
              <Button variant="outline" onClick={() => handleOpenStatusDialog('REJECTED')}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button onClick={() => handleOpenStatusDialog('HIRED')}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Hired
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Candidate Information */}
      <Card>
        <CardHeader>
          <CardTitle>Candidate Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm">Full Name</span>
              </div>
              <p className="font-medium">
                {application.firstName} {application.lastName}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm">Email</span>
              </div>
              <p className="font-medium">{application.email}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm">Phone</span>
              </div>
              <p className="font-medium">{application.phone}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Briefcase className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm">Experience</span>
              </div>
              <p className="font-medium">{application.experience} years</p>
            </div>

            {application.expectedSalary && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground text-sm">Expected Salary</span>
                </div>
                <p className="font-medium">${application.expectedSalary.toLocaleString()}</p>
              </div>
            )}

            {application.availability && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground text-sm">Availability</span>
                </div>
                <p className="font-medium">{application.availability}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Application Details */}
      <Card>
        <CardHeader>
          <CardTitle>Application Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Briefcase className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm">Position</span>
              </div>
              <p className="font-medium">{application.jobPosting.title}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm">Department</span>
              </div>
              <Badge variant="outline">{application.jobPosting.department.name}</Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm">Status</span>
              </div>
              {getStatusBadge(application.status)}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm">Applied On</span>
              </div>
              <p className="font-medium">{formatDate(application.createdAt)}</p>
            </div>
          </div>

          {application.coverLetter && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="text-muted-foreground h-4 w-4" />
                <span className="text-sm font-medium">Cover Letter</span>
              </div>
              <p className="text-muted-foreground bg-muted/50 rounded-md border p-3 whitespace-pre-wrap">
                {application.coverLetter}
              </p>
            </div>
          )}

          {application.resume && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="text-muted-foreground h-4 w-4" />
                <span className="text-sm font-medium">Resume</span>
              </div>
              <Button variant="outline" asChild>
                <a href={application.resume} target="_blank" rel="noopener noreferrer">
                  View Resume
                </a>
              </Button>
            </div>
          )}

          {application.notes && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Internal Notes</span>
              <p className="text-muted-foreground bg-muted/50 rounded-md border p-3">
                {application.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interviews */}
      {interviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Interview History ({interviews.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {interviews.map((interview) => (
                <div key={interview.id} className="rounded-md border p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{interview.type}</Badge>
                        <Badge>{interview.status}</Badge>
                      </div>
                      <p className="text-sm">
                        <strong>Interviewer:</strong> {interview.interviewer.firstName}{' '}
                        {interview.interviewer.lastName}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        <Calendar className="mr-1 inline h-3 w-3" />
                        {formatDateTime(interview.scheduledDate)} ({interview.duration} min)
                      </p>
                      {interview.feedback && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">Feedback:</p>
                          <p className="text-muted-foreground text-sm">{interview.feedback}</p>
                        </div>
                      )}
                      {interview.rating && (
                        <p className="text-sm">
                          <strong>Rating:</strong> {interview.rating}/5
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Update Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Application Status</DialogTitle>
            <DialogDescription>
              Change the status of this application to <strong>{newStatus}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="statusNotes">Notes (Optional)</Label>
              <Textarea
                id="statusNotes"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Add any notes or comments..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseStatusDialog} disabled={updating}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
