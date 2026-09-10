'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useNavigation } from '@/hooks/use-navigation';
import { attendanceApi } from '@/lib/api/attendance';
import type { Attendance } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  ArrowLeft,
  Edit,
  Calendar,
  User,
  Building2,
  Clock,
  Fingerprint,
  UserCheck,
  FileText,
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
    <CardContent className="pt-6">
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

export default function AttendanceViewPage() {
  const params = useParams();
  const navigation = useNavigation();
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);

  const attendanceId = params.id as string;

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const response = await attendanceApi.getAttendanceById(attendanceId);

        if (response.success && response.data) {
          setAttendance(response.data);
        } else if ('id' in response) {
          setAttendance(response as unknown as Attendance);
        } else {
          toast.error('Failed to load attendance details');
          navigation.push('/dashboard/admin/attendance');
        }
      } catch (err) {
        console.error('Error fetching attendance:', err);
        toast.error('Failed to load attendance details');
        navigation.push('/dashboard/admin/attendance');
      } finally {
        setLoading(false);
      }
    };

    if (attendanceId) {
      fetchAttendance();
    }
  }, [attendanceId, navigation]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'Not recorded';
    return timeString;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
        text: string;
      }
    > = {
      PRESENT: { variant: 'default', text: 'Present' },
      ABSENT: { variant: 'destructive', text: 'Absent' },
      HALF_DAY: { variant: 'secondary', text: 'Half Day' },
      LEAVE: { variant: 'outline', text: 'Leave' },
    };

    const config = variants[status] || { variant: 'secondary' as const, text: status };

    return (
      <Badge variant={config.variant} className="gap-1">
        {config.text}
      </Badge>
    );
  };

  const getVerificationMethodIcon = (method?: string) => {
    switch (method) {
      case 'FINGERPRINT':
        return <Fingerprint className="h-4 w-4" />;
      case 'MANUAL':
        return <UserCheck className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!attendance) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            <h1 className="text-2xl font-bold tracking-tight">Attendance Details</h1>
            <p className="text-muted-foreground">
              View attendance record for {attendance.employee.user.firstName}{' '}
              {attendance.employee.user.lastName}
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigation.push(`/dashboard/admin/attendance/${attendanceId}/edit`)}
          className="cursor-pointer"
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit Attendance
        </Button>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Status:</span>
        {getStatusBadge(attendance.status)}
      </div>

      {/* Information Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <InfoItem
          icon={User}
          label="Employee"
          value={`${attendance.employee.user.firstName} ${attendance.employee.user.lastName}`}
        />
        <InfoItem icon={Building2} label="Department" value={attendance.employee.department.name} />
        <InfoItem icon={Calendar} label="Date" value={formatDate(attendance.date)} />
        <InfoItem icon={Clock} label="Check In Time" value={formatTime(attendance.checkInTime)} />
        <InfoItem icon={Clock} label="Check Out Time" value={formatTime(attendance.checkOutTime)} />
        <InfoItem
          icon={attendance.verificationMethod === 'FINGERPRINT' ? Fingerprint : UserCheck}
          label="Verification Method"
          value={
            <div className="flex items-center gap-2">
              {getVerificationMethodIcon(attendance.verificationMethod)}
              <span>{attendance.verificationMethod || 'N/A'}</span>
            </div>
          }
        />
        {attendance.confidenceScore && (
          <InfoItem
            icon={Fingerprint}
            label="Confidence Score"
            value={`${attendance.confidenceScore.toFixed(1)}%`}
          />
        )}
        <InfoItem
          icon={Calendar}
          label="Recorded At"
          value={new Date(attendance.createdAt).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        />
        <InfoItem
          icon={Calendar}
          label="Last Updated"
          value={new Date(attendance.updatedAt).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        />
      </div>

      {/* Additional Information */}
      {attendance.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{attendance.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Employee Information */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Name</p>
              <p className="mt-1 font-semibold">
                {attendance.employee.user.firstName} {attendance.employee.user.lastName}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Email</p>
              <p className="mt-1 font-semibold">{attendance.employee.user.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Position</p>
              <p className="mt-1 font-semibold">{attendance.employee.position}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Department</p>
              <p className="mt-1 font-semibold">{attendance.employee.department.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
