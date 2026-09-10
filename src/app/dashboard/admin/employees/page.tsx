'use client';

import { useState, useEffect, useMemo } from 'react';
import { useNavigation } from '@/hooks/use-navigation';
import { employeesApi } from '@/lib/api/employees';
import { usersApi } from '@/lib/api/users';
import type { Employee, UserListItem } from '@/types';
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
  Plus,
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  UserCog,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function EmployeesPage() {
  const navigation = useNavigation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'hireDate' | 'department'>('hireDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const itemsPerPage = 10;

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeesApi.getAllEmployees();
      if (response.success && response.data) {
        setEmployees(response.data);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await usersApi.getAllUsers();
      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchUsers();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get guest users (users without employee profiles)
  const guestUsers = users.filter((user) => user.role === 'GUEST' && !user.hasEmployeeRecord);

  // Get unique departments from employees
  const departments = useMemo(() => {
    const deptMap = new Map();
    employees.forEach((emp) => {
      if (!deptMap.has(emp.department.id)) {
        deptMap.set(emp.department.id, emp.department);
      }
    });
    return Array.from(deptMap.values());
  }, [employees]);

  const filteredEmployees = employees
    .filter((employee) => {
      const searchMatch =
        employee.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.position.toLowerCase().includes(searchTerm.toLowerCase());

      const departmentMatch =
        departmentFilter === 'all' || employee.department.id === departmentFilter;
      const statusMatch = statusFilter === 'all' || employee.status === statusFilter;

      return searchMatch && departmentMatch && statusMatch;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = `${a.user.firstName} ${a.user.lastName}`.localeCompare(
            `${b.user.firstName} ${b.user.lastName}`
          );
          break;
        case 'hireDate':
          comparison = new Date(a.hireDate).getTime() - new Date(b.hireDate).getTime();
          break;
        case 'department':
          comparison = a.department.name.localeCompare(b.department.name);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEmployees = filteredEmployees.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'INACTIVE':
        return 'secondary';
      case 'ON_LEAVE':
        return 'outline';
      default:
        return 'secondary';
    }
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
          <h2 className="text-3xl font-bold tracking-tight">Employee Management</h2>
          <p className="text-muted-foreground">Manage employee profiles and assignments</p>
        </div>
        <Button
          onClick={() => navigation.push('/dashboard/admin/employees/create')}
          className="cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Employee Profile
        </Button>
      </div>

      {/* Guest Users Alert */}
      {guestUsers.length > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardContent>
            <div className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {guestUsers.length} guest user{guestUsers.length > 1 ? 's' : ''} waiting for
                employee profile creation
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle>All Employees</CardTitle>
            <div className="text-muted-foreground text-sm">
              {filteredEmployees.length} of {employees.length} employees
              {(searchTerm || departmentFilter !== 'all' || statusFilter !== 'all') &&
                ' (filtered)'}
            </div>
          </div>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
              <Input
                placeholder="Search by name, email, department, or position..."
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
                value={departmentFilter}
                onValueChange={(value) => {
                  setDepartmentFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Filter by dept" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={(value) => {
                  const [field, order] = value.split('-');
                  setSortBy(field as 'name' | 'hireDate' | 'department');
                  setSortOrder(order as 'asc' | 'desc');
                }}
              >
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hireDate-desc">Newest Hire</SelectItem>
                  <SelectItem value="hireDate-asc">Oldest Hire</SelectItem>
                  <SelectItem value="name-asc">Name A-Z</SelectItem>
                  <SelectItem value="name-desc">Name Z-A</SelectItem>
                  <SelectItem value="department-asc">Department A-Z</SelectItem>
                  <SelectItem value="department-desc">Department Z-A</SelectItem>
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
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Hire Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-muted-foreground py-8 text-center">
                        No employees found
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentEmployees.map((employee, index) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{startIndex + index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {employee.user.firstName} {employee.user.lastName}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {employee.user.email}
                        </TableCell>
                        <TableCell>{employee.position}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="text-muted-foreground h-4 w-4" />
                            {employee.department.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {employee.manager?.user
                            ? `${employee.manager.user.firstName} ${employee.manager.user.lastName}`
                            : 'No manager'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(employee.hireDate)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(employee.status)}>
                            {employee.status}
                          </Badge>
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
                                  navigation.push(`/dashboard/admin/employees/${employee.id}`)
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() =>
                                  navigation.push(`/dashboard/admin/employees/${employee.id}/edit`)
                                }
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Employee
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
            {currentEmployees.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">No employees found</div>
            ) : (
              currentEmployees.map((employee, index) => (
                <Card key={employee.id}>
                  <CardContent>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-sm font-medium">
                            #{startIndex + index + 1}
                          </span>
                          <h3 className="font-semibold">
                            {employee.user.firstName} {employee.user.lastName}
                          </h3>
                        </div>
                        <p className="text-muted-foreground text-sm">{employee.user.email}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{employee.position}</Badge>
                          <Badge variant={getStatusBadgeVariant(employee.status)}>
                            {employee.status}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground space-y-1 text-sm">
                          <p>
                            <strong>Department:</strong> {employee.department.name}
                          </p>
                          <p>
                            <strong>Manager:</strong>{' '}
                            {employee.manager?.user
                              ? `${employee.manager.user.firstName} ${employee.manager.user.lastName}`
                              : 'No manager'}
                          </p>
                          <p>
                            <strong>Hire Date:</strong> {formatDate(employee.hireDate)}
                          </p>
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
                              navigation.push(`/dashboard/admin/employees/${employee.id}`)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() =>
                              navigation.push(`/dashboard/admin/employees/${employee.id}/edit`)
                            }
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Employee
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
                Showing {startIndex + 1} to {Math.min(endIndex, filteredEmployees.length)} of{' '}
                {filteredEmployees.length} entries
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
