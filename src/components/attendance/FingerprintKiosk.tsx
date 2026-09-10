'use client';

import { useState } from 'react';
import { attendanceApi } from '@/lib/api/attendance';
import type { FingerprintKioskResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Fingerprint, Loader2, CheckCircle, XCircle, User, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';

export function FingerprintKiosk() {
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<FingerprintKioskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    setScanning(true);
    setError(null);
    setLastResult(null);

    try {
      const response = await attendanceApi.markAttendanceByFingerprint();
      if (response.success && response.data) {
        // Ensure confidence is set, use attendance confidenceScore as fallback
        const result = {
          ...response.data,
          confidence:
            response.data.confidence ?? response.data.attendance?.confidenceScore ?? undefined,
        };
        setLastResult(result);
        toast.success(response.data.message || 'Attendance marked successfully');
      } else {
        setError(response.message || 'Failed to mark attendance');
        toast.error(response.message || 'Failed to mark attendance');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark attendance';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setScanning(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Fingerprint Attendance Kiosk
          </CardTitle>
          <CardDescription>
            Place your finger on the scanner to mark your attendance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Scanner Interface */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div
              className={`relative flex h-64 w-64 flex-col items-center justify-center rounded-full border-4 transition-all ${
                scanning
                  ? 'border-primary bg-primary/10 animate-pulse'
                  : lastResult
                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                    : error
                      ? 'border-red-500 bg-red-50 dark:bg-red-950'
                      : 'border-muted bg-muted'
              }`}
            >
              {scanning ? (
                <>
                  <Loader2 className="text-primary h-16 w-16 animate-spin" />
                  <p className="mt-4 text-center text-sm font-medium">
                    Scanning fingerprint...
                    <br />
                    <span className="text-muted-foreground">
                      Please keep your finger on the scanner
                    </span>
                  </p>
                </>
              ) : lastResult ? (
                <>
                  <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
                  <p className="mt-4 text-center text-sm font-medium">Attendance Marked!</p>
                </>
              ) : error ? (
                <>
                  <XCircle className="h-16 w-16 text-red-600 dark:text-red-400" />
                  <p className="mt-4 text-center text-sm font-medium text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </>
              ) : (
                <>
                  <Fingerprint className="text-muted-foreground h-16 w-16" />
                  <p className="mt-4 text-center text-sm font-medium">
                    Ready to scan
                    <br />
                    <span className="text-muted-foreground">Click the button below to start</span>
                  </p>
                </>
              )}
            </div>

            <Button
              onClick={handleScan}
              disabled={scanning}
              size="lg"
              className="w-full max-w-xs cursor-pointer"
            >
              {scanning ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Fingerprint className="mr-2 h-5 w-5" />
                  Scan Fingerprint
                </>
              )}
            </Button>
          </div>

          {/* Last Result */}
          {lastResult && (
            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                  <CheckCircle className="h-5 w-5" />
                  Attendance Recorded Successfully
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <User className="text-muted-foreground h-5 w-5" />
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">Employee</p>
                      <p className="font-semibold">
                        {lastResult.employee.firstName} {lastResult.employee.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="text-muted-foreground h-5 w-5" />
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">Date</p>
                      <p className="font-semibold">{formatDate(lastResult.attendance.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="text-muted-foreground h-5 w-5" />
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">Check In Time</p>
                      <p className="font-semibold">
                        {formatTime(lastResult.attendance.checkInTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Fingerprint className="text-muted-foreground h-5 w-5" />
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">Confidence</p>
                      <p className="font-semibold">
                        {lastResult.confidence ? lastResult.confidence.toFixed(1) : 'N/A'}%
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">{lastResult.attendance.status}</Badge>
                  <Badge variant="outline" className="gap-1">
                    <Fingerprint className="h-3 w-3" />
                    {lastResult.attendance.verificationMethod}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && !lastResult && (
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-100">Error</p>
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            <li>Click the &quot;Scan Fingerprint&quot; button above</li>
            <li>Place your enrolled finger on the fingerprint scanner</li>
            <li>Keep your finger steady until the scan completes</li>
            <li>Your attendance will be automatically recorded upon successful match</li>
            <li>If you haven&apos;t enrolled your fingerprint, contact your administrator</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
