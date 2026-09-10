'use client';

import { useState, useEffect, useMemo } from 'react';
import { useNavigation } from '@/hooks/use-navigation';
import { attendanceApi } from '@/lib/api/attendance';
import { employeesApi } from '@/lib/api/employees';
import type { Attendance, AttendanceStatus, Employee } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Plus,
  Clock,
  Fingerprint,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AttendancePage() {
  const navigation = useNavigation();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | 'all'>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<{ start?: string; end?: string }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [attendanceResponse, employeesResponse] = await Promise.all([
        attendanceApi.getAttendances(),
        employeesApi.getAllEmployees(),
      ]);

      if (attendanceResponse.success && attendanceResponse.data) {
        setAttendances(attendanceResponse.data);
      }

      if (employeesResponse.success && employeesResponse.data) {
        setEmployees(employeesResponse.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  const getStatusBadgeVariant = (status: AttendanceStatus) => {
    switch (status) {
      case 'PRESENT':
        return 'default';
      case 'ABSENT':
        return 'destructive';
      case 'HALF_DAY':
        return 'secondary';
      case 'LEAVE':
        return 'outline';
      default:
        return 'secondary';
    }
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

  const filteredAttendances = useMemo(() => {
    return attendances.filter((attendance) => {
      const searchMatch =
        attendance.employee.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attendance.employee.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attendance.employee.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attendance.employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attendance.employee.department?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        false;

      const statusMatch = statusFilter === 'all' || attendance.status === statusFilter;
      const employeeMatch = employeeFilter === 'all' || attendance.employeeId === employeeFilter;

      const dateMatch =
        (!dateFilter.start || new Date(attendance.date) >= new Date(dateFilter.start)) &&
        (!dateFilter.end || new Date(attendance.date) <= new Date(dateFilter.end));

      return searchMatch && statusMatch && employeeMatch && dateMatch;
    });
  }, [attendances, searchTerm, statusFilter, employeeFilter, dateFilter]);

  const totalPages = Math.ceil(filteredAttendances.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAttendances = filteredAttendances.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Attendance Management</h2>
          <p className="text-muted-foreground">View and manage employee attendance records</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => navigation.push('/dashboard/admin/attendance/kiosk')}
            variant="outline"
            className="cursor-pointer"
          >
            <Fingerprint className="mr-2 h-4 w-4" />
            Fingerprint Kiosk
          </Button>
          <Button
            onClick={() => navigation.push('/dashboard/admin/attendance/create')}
            className="cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4" />
            Record Attendance
          </Button>
        </div>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle>All Attendance Records</CardTitle>
            <div className="text-muted-foreground text-sm">
              {filteredAttendances.length} of {attendances.length} records
              {(searchTerm || statusFilter !== 'all' || employeeFilter !== 'all') && ' (filtered)'}
            </div>
          </div>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
              <Input
                placeholder="Search by employee name, email, position, or department..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as AttendanceStatus | 'all');
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PRESENT">Present</SelectItem>
                  <SelectItem value="ABSENT">Absent</SelectItem>
                  <SelectItem value="HALF_DAY">Half Day</SelectItem>
                  <SelectItem value="LEAVE">Leave</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={employeeFilter}
                onValueChange={(value) => {
                  setEmployeeFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.user.firstName} {emp.user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                placeholder="Start Date"
                value={dateFilter.start || ''}
                onChange={(e) => {
                  setDateFilter({ ...dateFilter, start: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full sm:w-[150px]"
              />

              <Input
                type="date"
                placeholder="End Date"
                value={dateFilter.end || ''}
                onChange={(e) => {
                  setDateFilter({ ...dateFilter, end: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full sm:w-[150px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">#</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentAttendances.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-muted-foreground py-8 text-center">
                        No attendance records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentAttendances.map((attendance, index) => (
                      <TableRow key={attendance.id}>
                        <TableCell className="font-medium">{startIndex + index + 1}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {attendance.employee.user.firstName}{' '}
                              {attendance.employee.user.lastName}
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {attendance.employee.position} •{' '}
                              {attendance.employee.department?.name || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(attendance.date)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(attendance.status)}>
                            {attendance.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatTime(attendance.checkInTime)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatTime(attendance.checkOutTime)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getVerificationMethodIcon(attendance.verificationMethod)}
                            <span className="text-sm">
                              {attendance.verificationMethod || 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {attendance.confidenceScore
                            ? `${attendance.confidenceScore.toFixed(1)}%`
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 cursor-pointer p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() =>
                                  navigation.push(`/dashboard/admin/attendance/${attendance.id}`)
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() =>
                                  navigation.push(
                                    `/dashboard/admin/attendance/${attendance.id}/edit`
                                  )
                                }
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Attendance
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="space-y-4 lg:hidden">
            {currentAttendances.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                No attendance records found
              </div>
            ) : (
              currentAttendances.map((attendance, index) => (
                <Card key={attendance.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-sm font-medium">
                            #{startIndex + index + 1}
                          </span>
                          <h3 className="font-semibold">
                            {attendance.employee.user.firstName} {attendance.employee.user.lastName}
                          </h3>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {attendance.employee.position} •{' '}
                          {attendance.employee.department?.name || 'N/A'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={getStatusBadgeVariant(attendance.status)}>
                            {attendance.status}
                          </Badge>
                          {attendance.verificationMethod && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              {getVerificationMethodIcon(attendance.verificationMethod)}
                              {attendance.verificationMethod}
                            </Badge>
                          )}
                        </div>
                        <div className="text-muted-foreground space-y-1 text-sm">
                          <p>
                            <strong>Date:</strong> {formatDate(attendance.date)}
                          </p>
                          <p>
                            <strong>Check In:</strong> {formatTime(attendance.checkInTime)}
                          </p>
                          <p>
                            <strong>Check Out:</strong> {formatTime(attendance.checkOutTime)}
                          </p>
                          {attendance.confidenceScore && (
                            <p>
                              <strong>Confidence:</strong> {attendance.confidenceScore.toFixed(1)}%
                            </p>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 cursor-pointer p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() =>
                              navigation.push(`/dashboard/admin/attendance/${attendance.id}`)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() =>
                              navigation.push(`/dashboard/admin/attendance/${attendance.id}/edit`)
                            }
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Attendance
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 0 && (
            <div className="mt-4 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="text-muted-foreground text-center text-sm sm:text-left">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredAttendances.length)} of{' '}
                {filteredAttendances.length} entries
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="h-8 w-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
