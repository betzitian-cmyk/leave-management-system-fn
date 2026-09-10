'use client';

import { useState, useEffect } from 'react';
import { useNavigation } from '@/hooks/use-navigation';
import { leaveRequestsApi } from '@/lib/api/leaveRequests';
import { leaveTypesApi } from '@/lib/api/leaveTypes';
import type { LeaveRequest, LeaveType, LeaveRequestStatus } from '@/types';
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
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  Loader2,
  Edit,
} from 'lucide-react';
import { toast } from 'sonner';

export default function LeaveRequestsPage() {
  const navigation = useNavigation();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeaveRequestStatus | 'all'>('all');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'startDate'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsResponse, typesResponse] = await Promise.all([
        leaveRequestsApi.getAllLeaveRequests(),
        leaveTypesApi.getAllLeaveTypes(),
      ]);

      // Handle leave requests response
      if (requestsResponse.success && requestsResponse.data) {
        setLeaveRequests(requestsResponse.data);
      } else if (Array.isArray(requestsResponse)) {
        setLeaveRequests(requestsResponse as unknown as LeaveRequest[]);
      }

      // Handle leave types response
      if (typesResponse.success && typesResponse.data) {
        setLeaveTypes(typesResponse.data);
      } else if (Array.isArray(typesResponse)) {
        setLeaveTypes(typesResponse as unknown as LeaveType[]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to fetch leave requests');
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

  const getStatusBadge = (status: LeaveRequestStatus) => {
    const variants: Record<
      LeaveRequestStatus,
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; text: string }
    > = {
      PENDING: { variant: 'outline', text: 'Pending' },
      APPROVED: { variant: 'default', text: 'Approved' },
      REJECTED: { variant: 'destructive', text: 'Rejected' },
      CANCELLED: { variant: 'secondary', text: 'Cancelled' },
    };

    const config = variants[status];
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const filteredLeaveRequests = leaveRequests
    .filter((request) => {
      const searchMatch =
        request.employee.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.employee.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.employee.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.employee.department?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ??
          false) ||
        request.leaveType.name.toLowerCase().includes(searchTerm.toLowerCase());

      const statusMatch = statusFilter === 'all' || request.status === statusFilter;
      const typeMatch = leaveTypeFilter === 'all' || request.leaveType.id === leaveTypeFilter;

      return searchMatch && statusMatch && typeMatch;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'startDate':
          comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const totalPages = Math.ceil(filteredLeaveRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLeaveRequests = filteredLeaveRequests.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
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
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Leave Requests</h2>
        <p className="text-muted-foreground">Manage all employee leave requests</p>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle>All Leave Requests</CardTitle>
            <div className="text-muted-foreground text-sm">
              {filteredLeaveRequests.length} of {leaveRequests.length} requests
              {(searchTerm || statusFilter !== 'all' || leaveTypeFilter !== 'all') && ' (filtered)'}
            </div>
          </div>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
              <Input
                placeholder="Search by employee, department, or leave type..."
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
                  setStatusFilter(value as LeaveRequestStatus | 'all');
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={leaveTypeFilter}
                onValueChange={(value) => {
                  setLeaveTypeFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Leave Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={(value) => {
                  const [field, order] = value.split('-');
                  setSortBy(field as 'createdAt' | 'startDate');
                  setSortOrder(order as 'asc' | 'desc');
                }}
              >
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">Newest First</SelectItem>
                  <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                  <SelectItem value="startDate-desc">Start Date (New)</SelectItem>
                  <SelectItem value="startDate-asc">Start Date (Old)</SelectItem>
                </SelectContent>
              </Select>
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
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentLeaveRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-muted-foreground py-8 text-center">
                        No leave requests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentLeaveRequests.map((request, index) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{startIndex + index + 1}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {request.employee.user.firstName} {request.employee.user.lastName}
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {request.employee.department?.name || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {request.leaveType.color && (
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: request.leaveType.color }}
                              />
                            )}
                            {request.leaveType.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(request.startDate)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(request.endDate)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <Calendar className="h-3 w-3" />
                            {request.numberOfDays}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
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
                                  navigation.push(`/dashboard/admin/leave-requests/${request.id}`)
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {request.status === 'PENDING' && (
                                <>
                                  <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() =>
                                      navigation.push(
                                        `/dashboard/admin/leave-requests/${request.id}/edit`
                                      )
                                    }
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Request
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="cursor-pointer text-green-600"
                                    onClick={() =>
                                      navigation.push(
                                        `/dashboard/admin/leave-requests/${request.id}`
                                      )
                                    }
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="cursor-pointer text-red-600"
                                    onClick={() =>
                                      navigation.push(
                                        `/dashboard/admin/leave-requests/${request.id}`
                                      )
                                    }
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
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
            {currentLeaveRequests.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">No leave requests found</div>
            ) : (
              currentLeaveRequests.map((request, index) => (
                <Card key={request.id}>
                  <CardContent>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-sm font-medium">
                            #{startIndex + index + 1}
                          </span>
                          <h3 className="font-semibold">
                            {request.employee.user.firstName} {request.employee.user.lastName}
                          </h3>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {request.employee.department?.name || 'N/A'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <div className="flex items-center gap-1">
                            {request.leaveType.color && (
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: request.leaveType.color }}
                              />
                            )}
                            <span className="text-sm">{request.leaveType.name}</span>
                          </div>
                          <Badge variant="outline" className="gap-1">
                            <Calendar className="h-3 w-3" />
                            {request.numberOfDays} days
                          </Badge>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          <p>
                            <strong>From:</strong> {formatDate(request.startDate)}
                          </p>
                          <p>
                            <strong>To:</strong> {formatDate(request.endDate)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="cursor-pointer"
                        onClick={() =>
                          navigation.push(`/dashboard/admin/leave-requests/${request.id}`)
                        }
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
                Showing {startIndex + 1} to {Math.min(endIndex, filteredLeaveRequests.length)} of{' '}
                {filteredLeaveRequests.length} entries
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
