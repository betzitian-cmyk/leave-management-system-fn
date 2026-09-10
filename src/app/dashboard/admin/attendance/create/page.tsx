'use client';

import { useState, useEffect } from 'react';
import { useNavigation } from '@/hooks/use-navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { attendanceApi } from '@/lib/api/attendance';
import { employeesApi } from '@/lib/api/employees';
import type { FingerprintStatus } from '@/types';
import { createAttendanceSchema, type CreateAttendanceFormData } from '@/schemas/attendance';
import type { Employee, AttendanceStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar,
  Loader2,
  ArrowLeft,
  Fingerprint,
  UserCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CreateAttendancePage() {
  const navigation = useNavigation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recordingMode, setRecordingMode] = useState<'manual' | 'fingerprint'>('manual');
  const [scanning, setScanning] = useState(false);
  const [fingerprintStatuses, setFingerprintStatuses] = useState<FingerprintStatus[]>([]);
  const [existingAttendanceId, setExistingAttendanceId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateAttendanceFormData>({
    resolver: zodResolver(createAttendanceSchema),
    defaultValues: {
      employeeId: '',
      date: new Date().toISOString().split('T')[0],
      status: 'PRESENT',
      checkInTime: '',
      checkOutTime: '',
      notes: '',
    },
  });

  const formData = watch();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [employeesResponse, fingerprintResponse] = await Promise.all([
          employeesApi.getAllEmployees(),
          attendanceApi.getFingerprintStatus(),
        ]);

        if (employeesResponse.success && employeesResponse.data) {
          setEmployees(employeesResponse.data);
        }

        if (fingerprintResponse.success && fingerprintResponse.data) {
          const statusArray = Array.isArray(fingerprintResponse.data)
            ? fingerprintResponse.data
            : [fingerprintResponse.data];
          setFingerprintStatuses(statusArray);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Check if selected employee has fingerprint enrolled
  const selectedEmployeeFingerprintStatus = fingerprintStatuses.find(
    (status) => status.employeeId === formData.employeeId
  );
  const isFingerprintEnrolled = selectedEmployeeFingerprintStatus?.enrolled === true;

  // Check for existing attendance when employee and date are selected
  useEffect(() => {
    const checkExistingAttendance = async () => {
      if (!formData.employeeId || !formData.date || recordingMode !== 'fingerprint') {
        setExistingAttendanceId(null);
        return;
      }

      try {
        const response = await attendanceApi.getAttendances({
          employeeId: formData.employeeId,
          startDate: formData.date,
          endDate: formData.date,
        });

        if (response.success && response.data && response.data.length > 0) {
          const existing = response.data.find(
            (att) => att.employeeId === formData.employeeId && att.date === formData.date
          );
          if (existing) {
            setExistingAttendanceId(existing.id);
          } else {
            setExistingAttendanceId(null);
          }
        } else {
          setExistingAttendanceId(null);
        }
      } catch (err) {
        // Silently fail - we'll handle the error when they try to submit
        setExistingAttendanceId(null);
      }
    };

    checkExistingAttendance();
  }, [formData.employeeId, formData.date, recordingMode]);

  const onSubmit = async (data: CreateAttendanceFormData) => {
    setSubmitting(true);
    try {
      const submitData = {
        ...data,
        checkInTime: data.checkInTime || undefined,
        checkOutTime: data.checkOutTime || undefined,
        notes: data.notes || undefined,
      };

      let response;
      if (recordingMode === 'fingerprint') {
        // Use fingerprint-based attendance recording
        response = await attendanceApi.markAttendanceWithFingerprint(submitData);
      } else {
        // Use manual attendance recording
        response = await attendanceApi.createAttendance(submitData);
      }

      if (response.success) {
        toast.success('Attendance recorded successfully');
        navigation.push('/dashboard/admin/attendance');
      } else {
        toast.error(response.message || 'Failed to record attendance');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record attendance';
      toast.error(errorMessage);
      console.error('Error creating attendance:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFingerprintScan = async () => {
    if (!formData.employeeId) {
      toast.error('Please select an employee first');
      return;
    }

    // Check if employee has fingerprint enrolled
    if (!isFingerprintEnrolled) {
      toast.error(
        'This employee does not have a fingerprint enrolled. Please enroll their fingerprint first.',
        {
          duration: 5000,
        }
      );
      return;
    }

    setScanning(true);
    try {
      const submitData = {
        employeeId: formData.employeeId,
        date: formData.date,
        status: formData.status,
        checkInTime: formData.checkInTime || undefined,
        checkOutTime: formData.checkOutTime || undefined,
        notes: formData.notes || undefined,
      };

      const response = await attendanceApi.markAttendanceWithFingerprint(submitData);
      if (response.success) {
        toast.success('Attendance recorded successfully with fingerprint verification');
        navigation.push('/dashboard/admin/attendance');
      } else {
        toast.error(response.message || 'Failed to record attendance');
      }
    } catch (err) {
      let errorMessage = 'Failed to record attendance';
      if (err instanceof Error) {
        errorMessage = err.message;
        // Check if it's an enrollment error
        if (
          errorMessage.toLowerCase().includes('no fingerprint enrolled') ||
          errorMessage.toLowerCase().includes('fingerprint enrolled')
        ) {
          toast.error(
            'This employee does not have a fingerprint enrolled. Please enroll their fingerprint first.',
            {
              duration: 6000,
              action: {
                label: 'Enroll Now',
                onClick: () => navigation.push(`/dashboard/admin/employees/${formData.employeeId}`),
              },
            }
          );
          return;
        }
        // Check if attendance already exists
        if (
          errorMessage.toLowerCase().includes('already recorded') ||
          errorMessage.toLowerCase().includes('already exists')
        ) {
          toast.error('Attendance already recorded for this date', {
            duration: 6000,
            action: existingAttendanceId
              ? {
                  label: 'View/Edit',
                  onClick: () =>
                    navigation.push(`/dashboard/admin/attendance/${existingAttendanceId}`),
                }
              : undefined,
          });
          return;
        }
      }
      toast.error(errorMessage);
      console.error('Error recording fingerprint attendance:', err);
    } finally {
      setScanning(false);
    }
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
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigation.push('/dashboard/admin/attendance')}
          className="cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Record Attendance</h1>
          <p className="text-muted-foreground">
            Record employee attendance manually or using fingerprint
          </p>
        </div>
      </div>

      {/* Recording Mode Tabs */}
      <Tabs
        value={recordingMode}
        onValueChange={(value) => setRecordingMode(value as 'manual' | 'fingerprint')}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual" className="cursor-pointer">
            <UserCheck className="mr-2 h-4 w-4" />
            Manual Entry
          </TabsTrigger>
          <TabsTrigger value="fingerprint" className="cursor-pointer">
            <Fingerprint className="mr-2 h-4 w-4" />
            Fingerprint
          </TabsTrigger>
        </TabsList>

        {/* Manual Entry Tab */}
        <TabsContent value="manual" className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Employee Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Employee Information</CardTitle>
                  <CardDescription>Select the employee for attendance recording</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">
                      Employee <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.employeeId}
                      onValueChange={(value) => setValue('employeeId', value)}
                    >
                      <SelectTrigger id="employeeId">
                        <SelectValue placeholder="Select an employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.user.firstName} {emp.user.lastName} - {emp.position} (
                            {emp.department?.name || 'N/A'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.employeeId && (
                      <p className="text-destructive text-sm">{errors.employeeId.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Date and Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Details</CardTitle>
                  <CardDescription>Set the date and status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">
                      Date <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Calendar className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                      <Input id="date" type="date" {...register('date')} className="pl-10" />
                    </div>
                    {errors.date && (
                      <p className="text-destructive text-sm">{errors.date.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">
                      Status <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setValue('status', value as AttendanceStatus)}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRESENT">Present</SelectItem>
                        <SelectItem value="ABSENT">Absent</SelectItem>
                        <SelectItem value="HALF_DAY">Half Day</SelectItem>
                        <SelectItem value="LEAVE">Leave</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.status && (
                      <p className="text-destructive text-sm">{errors.status.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Time Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Time Information</CardTitle>
                  <CardDescription>Record check-in and check-out times</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkInTime">Check In Time (HH:MM)</Label>
                    <Input
                      id="checkInTime"
                      type="time"
                      {...register('checkInTime')}
                      placeholder="09:00"
                    />
                    {errors.checkInTime && (
                      <p className="text-destructive text-sm">{errors.checkInTime.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="checkOutTime">Check Out Time (HH:MM)</Label>
                    <Input
                      id="checkOutTime"
                      type="time"
                      {...register('checkOutTime')}
                      placeholder="17:00"
                    />
                    {errors.checkOutTime && (
                      <p className="text-destructive text-sm">{errors.checkOutTime.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                  <CardDescription>Add any additional notes or comments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      {...register('notes')}
                      placeholder="Enter any additional notes..."
                      rows={4}
                    />
                    {errors.notes && (
                      <p className="text-destructive text-sm">{errors.notes.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigation.push('/dashboard/admin/attendance')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  'Record Attendance'
                )}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* Fingerprint Tab */}
        <TabsContent value="fingerprint" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                Fingerprint Attendance Recording
              </CardTitle>
              <CardDescription>
                Select an employee and scan their fingerprint to record attendance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Employee Selection */}
              <div className="space-y-2">
                <Label htmlFor="fingerprint-employeeId">
                  Employee <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.employeeId}
                  onValueChange={(value) => setValue('employeeId', value)}
                >
                  <SelectTrigger id="fingerprint-employeeId">
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => {
                      const empStatus = fingerprintStatuses.find((s) => s.employeeId === emp.id);
                      const isEnrolled = empStatus?.enrolled === true;
                      return (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.user.firstName} {emp.user.lastName} - {emp.position} (
                          {emp.department?.name || 'N/A'}){isEnrolled ? ' ✓' : ' (Not Enrolled)'}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {errors.employeeId && (
                  <p className="text-destructive text-sm">{errors.employeeId.message}</p>
                )}

                {/* Enrollment Status Alert */}
                {formData.employeeId && !isFingerprintEnrolled && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Fingerprint Not Enrolled</AlertTitle>
                    <AlertDescription className="mt-2">
                      <p className="mb-2">
                        This employee does not have a fingerprint enrolled. You must enroll their
                        fingerprint before recording fingerprint-based attendance.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigation.push(`/dashboard/admin/employees/${formData.employeeId}`)
                        }
                        className="cursor-pointer"
                      >
                        <ExternalLink className="mr-2 h-3 w-3" />
                        Go to Employee Profile to Enroll
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Enrollment Status Success */}
                {formData.employeeId && isFingerprintEnrolled && !existingAttendanceId && (
                  <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                    <Fingerprint className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle className="text-green-900 dark:text-green-100">
                      Fingerprint Enrolled
                    </AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-300">
                      This employee has a fingerprint enrolled and is ready for fingerprint-based
                      attendance recording.
                      {selectedEmployeeFingerprintStatus?.enrollmentDate && (
                        <span className="mt-1 block text-sm">
                          Enrolled on:{' '}
                          {new Date(
                            selectedEmployeeFingerprintStatus.enrollmentDate
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Existing Attendance Warning */}
                {formData.employeeId && formData.date && existingAttendanceId && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Attendance Already Recorded</AlertTitle>
                    <AlertDescription className="mt-2">
                      <p className="mb-2">
                        Attendance for this employee on{' '}
                        {new Date(formData.date).toLocaleDateString()} has already been recorded.
                        You can view or edit the existing record.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigation.push(`/dashboard/admin/attendance/${existingAttendanceId}`)
                          }
                          className="cursor-pointer"
                        >
                          <ExternalLink className="mr-2 h-3 w-3" />
                          View/Edit Attendance
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigation.push('/dashboard/admin/attendance')}
                          className="cursor-pointer"
                        >
                          View All Attendance
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Date and Status */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fingerprint-date">
                    Date <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                    <Input
                      id="fingerprint-date"
                      type="date"
                      {...register('date')}
                      className="pl-10"
                    />
                  </div>
                  {errors.date && <p className="text-destructive text-sm">{errors.date.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fingerprint-status">
                    Status <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setValue('status', value as AttendanceStatus)}
                  >
                    <SelectTrigger id="fingerprint-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRESENT">Present</SelectItem>
                      <SelectItem value="ABSENT">Absent</SelectItem>
                      <SelectItem value="HALF_DAY">Half Day</SelectItem>
                      <SelectItem value="LEAVE">Leave</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-destructive text-sm">{errors.status.message}</p>
                  )}
                </div>
              </div>

              {/* Time Information */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fingerprint-checkInTime">Check In Time (HH:MM)</Label>
                  <Input
                    id="fingerprint-checkInTime"
                    type="time"
                    {...register('checkInTime')}
                    placeholder="09:00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fingerprint-checkOutTime">Check Out Time (HH:MM)</Label>
                  <Input
                    id="fingerprint-checkOutTime"
                    type="time"
                    {...register('checkOutTime')}
                    placeholder="17:00"
                  />
                </div>
              </div>

              {/* Fingerprint Scanner Interface */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div
                      className={`relative flex h-48 w-48 flex-col items-center justify-center rounded-full border-4 transition-all ${
                        scanning
                          ? 'border-primary bg-primary/10 animate-pulse'
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
                      ) : (
                        <>
                          <Fingerprint className="text-muted-foreground h-16 w-16" />
                          <p className="mt-4 text-center text-sm font-medium">
                            Ready to scan
                            <br />
                            <span className="text-muted-foreground">
                              Click the button below to start
                            </span>
                          </p>
                        </>
                      )}
                    </div>

                    <Button
                      onClick={handleFingerprintScan}
                      disabled={
                        scanning ||
                        !formData.employeeId ||
                        !formData.date ||
                        !isFingerprintEnrolled ||
                        !!existingAttendanceId
                      }
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
                          Scan Fingerprint & Record
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="fingerprint-notes">Notes (Optional)</Label>
                <Textarea
                  id="fingerprint-notes"
                  {...register('notes')}
                  placeholder="Enter any additional notes..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigation.push('/dashboard/admin/attendance')}
                  disabled={scanning}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
