'use client';

import { useState, useEffect } from 'react';
import { useNavigation } from '@/hooks/use-navigation';
import { attendanceApi } from '@/lib/api/attendance';
import { employeesApi } from '@/lib/api/employees';
import type { FingerprintStatus, Employee } from '@/types';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

export default function FingerprintManagementPage() {
  const navigation = useNavigation();
  const [fingerprintStatuses, setFingerprintStatuses] = useState<FingerprintStatus[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [enrollmentFilter, setEnrollmentFilter] = useState<'all' | 'enrolled' | 'not-enrolled'>(
    'all'
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statusResponse, employeesResponse] = await Promise.all([
        attendanceApi.getFingerprintStatus(),
        employeesApi.getAllEmployees(),
      ]);

      // Handle fingerprint status response
      if (statusResponse.success) {
        if (statusResponse.data) {
          // Ensure we always have an array
          const statusArray = Array.isArray(statusResponse.data)
            ? statusResponse.data
            : [statusResponse.data];
          setFingerprintStatuses(statusArray);
        } else {
          // Set empty array if no data
          setFingerprintStatuses([]);
        }
      } else {
        // Set empty array on error
        setFingerprintStatuses([]);
      }

      // Handle employees response
      if (employeesResponse.success) {
        if (employeesResponse.data) {
          // Ensure we always have an array
          const employeesArray = Array.isArray(employeesResponse.data)
            ? employeesResponse.data
            : [employeesResponse.data];
          setEmployees(employeesArray);
        } else {
          // Set empty array if no data
          setEmployees([]);
        }
      } else {
        // Set empty array on error
        setEmployees([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to fetch fingerprint enrollment data');
      // Ensure arrays are set even on error
      setFingerprintStatuses([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Create a map of employee data for quick lookup
  const employeeMap = new Map(
    Array.isArray(employees) ? employees.map((emp) => [emp.id, emp]) : []
  );

  // Combine fingerprint statuses with employee data
  const enrichedStatuses = Array.isArray(fingerprintStatuses)
    ? fingerprintStatuses.map((status) => {
        const employee = employeeMap.get(status.employeeId);
        return {
          ...status,
          employee,
        };
      })
    : [];

  // Filter and search
  const filteredStatuses = enrichedStatuses.filter((item) => {
    const searchMatch =
      !searchTerm ||
      item.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employee?.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employee?.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employee?.department.name.toLowerCase().includes(searchTerm.toLowerCase());

    const enrollmentMatch =
      enrollmentFilter === 'all' ||
      (enrollmentFilter === 'enrolled' && item.enrolled) ||
      (enrollmentFilter === 'not-enrolled' && !item.enrolled);

    return searchMatch && enrollmentMatch;
  });

  const totalPages = Math.ceil(filteredStatuses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStatuses = filteredStatuses.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // Statistics
  const enrolledCount = filteredStatuses.filter((s) => s.enrolled).length;
  const notEnrolledCount = filteredStatuses.filter((s) => !s.enrolled).length;
  const totalCount = filteredStatuses.length;

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
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Fingerprint Management</h2>
        <p className="text-muted-foreground">
          View and manage fingerprint enrollments for all employees
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <User className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-muted-foreground text-xs">Employees in system</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled</CardTitle>
            <CheckCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrolledCount}</div>
            <p className="text-muted-foreground text-xs">
              {totalCount > 0 ? Math.round((enrolledCount / totalCount) * 100) : 0}% enrollment rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not Enrolled</CardTitle>
            <XCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notEnrolledCount}</div>
            <p className="text-muted-foreground text-xs">Pending enrollment</p>
          </CardContent>
        </Card>
      </div>

      {/* Fingerprint Status Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle>Fingerprint Enrollment Status</CardTitle>
            <div className="text-muted-foreground text-sm">
              {filteredStatuses.length} of {totalCount} employees
              {(searchTerm || enrollmentFilter !== 'all') && ' (filtered)'}
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
            <Select
              value={enrollmentFilter}
              onValueChange={(value) => {
                setEnrollmentFilter(value as 'all' | 'enrolled' | 'not-enrolled');
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by enrollment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                <SelectItem value="enrolled">Enrolled Only</SelectItem>
                <SelectItem value="not-enrolled">Not Enrolled</SelectItem>
              </SelectContent>
            </Select>
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
                    <TableHead>Department</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Enrollment Status</TableHead>
                    <TableHead>Enrollment Date</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentStatuses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                        No employees found
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentStatuses.map((item, index) => (
                      <TableRow key={item.employeeId}>
                        <TableCell className="font-medium">{startIndex + index + 1}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.employeeName}</div>
                            {item.employee && (
                              <div className="text-muted-foreground text-sm">
                                {item.employee.user.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.employee ? (
                            <div className="flex items-center gap-2">
                              <Building2 className="text-muted-foreground h-4 w-4" />
                              {item.employee.department.name}
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>{item.employee ? item.employee.position : 'N/A'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={item.enrolled ? 'default' : 'secondary'}
                            className="gap-1"
                          >
                            {item.enrolled ? (
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
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {item.enrolled ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {formatDate(item.enrollmentDate)}
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigation.push(`/dashboard/admin/employees/${item.employeeId}`)
                            }
                            className="cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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
            {currentStatuses.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">No employees found</div>
            ) : (
              currentStatuses.map((item, index) => (
                <Card key={item.employeeId}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-sm font-medium">
                            #{startIndex + index + 1}
                          </span>
                          <h3 className="font-semibold">{item.employeeName}</h3>
                        </div>
                        {item.employee && (
                          <p className="text-muted-foreground text-sm">
                            {item.employee.user.email}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant={item.enrolled ? 'default' : 'secondary'}
                            className="gap-1"
                          >
                            {item.enrolled ? (
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
                        <div className="text-muted-foreground space-y-1 text-sm">
                          {item.employee && (
                            <>
                              <p>
                                <strong>Department:</strong> {item.employee.department.name}
                              </p>
                              <p>
                                <strong>Position:</strong> {item.employee.position}
                              </p>
                            </>
                          )}
                          {item.enrolled && (
                            <p>
                              <strong>Enrolled:</strong> {formatDate(item.enrollmentDate)}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigation.push(`/dashboard/admin/employees/${item.employeeId}`)
                        }
                        className="cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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
                Showing {startIndex + 1} to {Math.min(endIndex, filteredStatuses.length)} of{' '}
                {filteredStatuses.length} entries
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
