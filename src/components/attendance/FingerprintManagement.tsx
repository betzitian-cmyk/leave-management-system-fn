'use client';

import { useState, useEffect } from 'react';
import { attendanceApi } from '@/lib/api/attendance';
import type { FingerprintStatus, FingerprintDeviceInfo } from '@/types';
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
import {
  Fingerprint,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  Loader2,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

interface FingerprintManagementProps {
  employeeId: string;
  employeeName: string;
  onEnrollmentChange?: () => void;
}

export function FingerprintManagement({
  employeeId,
  employeeName,
  onEnrollmentChange,
}: FingerprintManagementProps) {
  const [fingerprintStatus, setFingerprintStatus] = useState<FingerprintStatus | null>(null);
  const [devices, setDevices] = useState<FingerprintDeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statusResponse, devicesResponse] = await Promise.all([
        attendanceApi.getFingerprintStatus(employeeId),
        attendanceApi.getFingerprintDevices(),
      ]);

      // Handle fingerprint status response
      if (statusResponse.success && statusResponse.data) {
        // Handle both array and single object responses
        const statusArray = Array.isArray(statusResponse.data)
          ? statusResponse.data
          : [statusResponse.data];
        // Find the status for this specific employee
        const employeeStatus = statusArray.find((s) => s.employeeId === employeeId);

        if (employeeStatus) {
          console.log('Fingerprint status for employee:', employeeStatus);
          setFingerprintStatus(employeeStatus);
        } else {
          // If not found, create a default "not enrolled" status
          console.log('No fingerprint status found, defaulting to not enrolled');
          setFingerprintStatus({
            employeeId,
            employeeName: '',
            enrolled: false,
          });
        }
      } else {
        // Set default "not enrolled" status if no data or error
        setFingerprintStatus({
          employeeId,
          employeeName: '',
          enrolled: false,
        });
      }

      // Handle devices response
      if (devicesResponse.success && devicesResponse.data) {
        // Ensure we always have an array
        const devicesArray = Array.isArray(devicesResponse.data)
          ? devicesResponse.data
          : [devicesResponse.data];
        setDevices(devicesArray);
      } else {
        // Set empty array if no data
        setDevices([]);
      }
    } catch (err) {
      console.error('Error fetching fingerprint data:', err);
      toast.error('Failed to load fingerprint information');
      // Reset state on error
      setFingerprintStatus(null);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const handleEnroll = async () => {
    // Check if already enrolled
    if (fingerprintStatus?.enrolled) {
      toast.warning('Fingerprint is already enrolled. Use "Update Fingerprint" to re-enroll.');
      setEnrollDialogOpen(false);
      return;
    }

    setEnrolling(true);
    try {
      const response = await attendanceApi.enrollFingerprint(employeeId);
      if (response.success) {
        toast.success(response.data?.message || 'Fingerprint enrolled successfully');
        setEnrollDialogOpen(false);
        await fetchData();
        onEnrollmentChange?.();
      } else {
        toast.error(response.message || 'Failed to enroll fingerprint');
      }
    } catch (err) {
      let errorMessage = 'Failed to enroll fingerprint';
      if (err instanceof Error) {
        errorMessage = err.message;
        // Check if it's an "already enrolled" error
        if (
          err.message.toLowerCase().includes('already') ||
          err.message.toLowerCase().includes('enrolled')
        ) {
          toast.warning('Fingerprint is already enrolled. Use "Update Fingerprint" to re-enroll.');
          setEnrollDialogOpen(false);
          await fetchData(); // Refresh status
          return;
        }
      }
      toast.error(errorMessage);
    } finally {
      setEnrolling(false);
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const response = await attendanceApi.updateFingerprint(employeeId);
      if (response.success) {
        toast.success(response.data?.message || 'Fingerprint updated successfully');
        setUpdateDialogOpen(false);
        await fetchData();
        onEnrollmentChange?.();
      } else {
        toast.error(response.message || 'Failed to update fingerprint');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update fingerprint';
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const response = await attendanceApi.removeFingerprint(employeeId);
      if (response.success) {
        toast.success(response.data?.message || 'Fingerprint removed successfully');
        setRemoveDialogOpen(false);
        await fetchData();
        onEnrollmentChange?.();
      } else {
        toast.error(response.message || 'Failed to remove fingerprint');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove fingerprint';
      toast.error(errorMessage);
    } finally {
      setRemoving(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Properly check enrollment status - explicitly check for true
  const isEnrolled = fingerprintStatus?.enrolled === true;

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('Fingerprint enrollment check:', {
      employeeId,
      fingerprintStatus,
      isEnrolled,
    });
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                Fingerprint Enrollment Status
              </CardTitle>
              <CardDescription>Manage fingerprint enrollment for {employeeName}</CardDescription>
            </div>
            <Badge variant={isEnrolled ? 'default' : 'secondary'} className="gap-1">
              {isEnrolled ? (
                <>
                  <CheckCircle className="h-3 w-3" />
                  Enrolled
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  Not Enrolled
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEnrolled ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Enrollment Date</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-semibold">
                    <Calendar className="h-4 w-4" />
                    {formatDate(fingerprintStatus?.enrollmentDate)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Status</p>
                  <p className="mt-1">
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Active
                    </Badge>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setUpdateDialogOpen(true)}
                  variant="outline"
                  className="cursor-pointer"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Update Fingerprint
                </Button>
                <Button
                  onClick={() => setRemoveDialogOpen(true)}
                  variant="destructive"
                  className="cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Fingerprint
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted flex flex-col items-center rounded-lg p-6 text-center">
                <Fingerprint className="text-muted-foreground mb-4 h-12 w-12" />
                <p className="text-muted-foreground mb-2 font-medium">No fingerprint enrolled</p>
                <p className="text-muted-foreground text-sm">
                  Enroll a fingerprint to enable fingerprint-based attendance tracking.
                </p>
              </div>
              <Button
                onClick={() => {
                  if (isEnrolled) {
                    toast.warning(
                      'Fingerprint is already enrolled. Use "Update Fingerprint" to re-enroll.'
                    );
                  } else {
                    setEnrollDialogOpen(true);
                  }
                }}
                className="w-full cursor-pointer"
                disabled={isEnrolled}
              >
                <Fingerprint className="mr-2 h-4 w-4" />
                {isEnrolled ? 'Already Enrolled' : 'Enroll Fingerprint'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Device Information */}
      {devices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5" />
              Available Devices
            </CardTitle>
            <CardDescription>Fingerprint devices connected to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {devices.map((device, index) => (
                <div
                  key={device.id || `device-${index}`}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{device.name}</p>
                    <p className="text-muted-foreground text-sm">{device.type}</p>
                  </div>
                  <Badge variant={device.connected ? 'default' : 'secondary'}>
                    {device.connected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enroll Dialog */}
      <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enroll Fingerprint</DialogTitle>
            <DialogDescription>
              Place your finger on the fingerprint scanner to enroll. You may need to scan your
              finger multiple times for better accuracy.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-muted flex flex-col items-center rounded-lg p-6">
              <Fingerprint className="text-muted-foreground mb-4 h-16 w-16 animate-pulse" />
              <p className="text-center text-sm">
                Waiting for fingerprint scan...
                <br />
                <span className="text-muted-foreground">
                  Please place your finger on the scanner
                </span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEnrollDialogOpen(false)}
              disabled={enrolling}
            >
              Cancel
            </Button>
            <Button onClick={handleEnroll} disabled={enrolling}>
              {enrolling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enrolling...
                </>
              ) : (
                'Start Enrollment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Fingerprint</DialogTitle>
            <DialogDescription>
              Re-scan your finger to update the stored fingerprint template. This will replace the
              existing enrollment.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-muted flex flex-col items-center rounded-lg p-6">
              <Fingerprint className="text-muted-foreground mb-4 h-16 w-16 animate-pulse" />
              <p className="text-center text-sm">
                Waiting for fingerprint scan...
                <br />
                <span className="text-muted-foreground">
                  Please place your finger on the scanner
                </span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpdateDialogOpen(false)}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Fingerprint'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Fingerprint</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the fingerprint enrollment for {employeeName}? This
              action cannot be undone and will disable fingerprint-based attendance for this
              employee.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm text-yellow-900 dark:text-yellow-100">
              This will permanently delete the fingerprint template. The employee will need to
              re-enroll to use fingerprint attendance again.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveDialogOpen(false)}
              disabled={removing}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={removing}>
              {removing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Fingerprint
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
