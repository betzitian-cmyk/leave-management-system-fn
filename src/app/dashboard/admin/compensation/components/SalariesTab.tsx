'use client';

import { useState, useEffect } from 'react';
import { useNavigation } from '@/hooks/use-navigation';
import { salaryApi } from '@/lib/api/compensation';
import type { Salary, SalaryType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  Edit,
  Trash2,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SalariesTab() {
  const navigation = useNavigation();
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | SalaryType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [salaryToDelete, setSalaryToDelete] = useState<Salary | null>(null);
  const [deleting, setDeleting] = useState(false);

  const itemsPerPage = 10;

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      const response = await salaryApi.getAllSalaries();

      if ('success' in response && 'data' in response && response.success && response.data) {
        const responseData = response.data as Salary[] | { data: Salary[] };
        if (Array.isArray(responseData)) {
          setSalaries(responseData);
        } else if ('data' in responseData && Array.isArray(responseData.data)) {
          setSalaries(responseData.data);
        }
      }
    } catch (err) {
      console.error('Error fetching salaries:', err);
      toast.error('Failed to fetch salaries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaries();
  }, []);

  // Frontend-side filtering
  const filteredSalaries = salaries.filter((salary) => {
    const matchesSearch =
      searchTerm === '' ||
      salary.employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salary.employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salary.employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salary.employee.position.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || salary.type === typeFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && salary.isActive) ||
      (statusFilter === 'inactive' && !salary.isActive);

    return matchesSearch && matchesType && matchesStatus;
  });

  // Sorting
  const sortedSalaries = [...filteredSalaries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Pagination
  const totalPages = Math.ceil(sortedSalaries.length / itemsPerPage);
  const paginatedSalaries = sortedSalaries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = (salary: Salary) => {
    setSalaryToDelete(salary);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!salaryToDelete) return;

    try {
      setDeleting(true);
      const response = await salaryApi.deleteSalary(salaryToDelete.id);

      if (
        (typeof response === 'object' &&
          response !== null &&
          'success' in response &&
          response.success) ||
        response === undefined
      ) {
        toast.success('Salary deleted successfully');
        await fetchSalaries();
      } else if (
        typeof response === 'object' &&
        response !== null &&
        'message' in response &&
        typeof response.message === 'string'
      ) {
        toast.error(response.message || 'Failed to delete salary');
      } else {
        toast.success('Salary deleted successfully');
        await fetchSalaries();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete salary';
      toast.error(errorMessage);
      console.error('Error deleting salary:', err);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setSalaryToDelete(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getSalaryTypeBadge = (type: SalaryType) => {
    const config = {
      BASE_SALARY: { label: 'Base Salary', variant: 'default' as const },
      HOURLY_RATE: { label: 'Hourly', variant: 'secondary' as const },
      COMMISSION: { label: 'Commission', variant: 'outline' as const },
      BONUS: { label: 'Bonus', variant: 'outline' as const },
      ALLOWANCE: { label: 'Allowance', variant: 'secondary' as const },
    };

    const { label, variant } = config[type];
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Salary Management</h2>
          <p className="text-muted-foreground text-sm">Manage employee salaries and compensation</p>
        </div>
        <Button
          onClick={() => navigation.push('/dashboard/admin/compensation/salaries/create')}
          className="cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Salary
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search by employee name, email, or position..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value as 'all' | SalaryType);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="BASE_SALARY">Base Salary</SelectItem>
                <SelectItem value="HOURLY_RATE">Hourly Rate</SelectItem>
                <SelectItem value="COMMISSION">Commission</SelectItem>
                <SelectItem value="BONUS">Bonus</SelectItem>
                <SelectItem value="ALLOWANCE">Allowance</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as 'all' | 'active' | 'inactive');
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent>
          {paginatedSalaries.length === 0 ? (
            <div className="flex h-96 flex-col items-center justify-center">
              <DollarSign className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="text-lg font-semibold">No salaries found</h3>
              <p className="text-muted-foreground text-sm">
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first salary record to get started'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Effective Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSalaries.map((salary) => (
                      <TableRow key={salary.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {salary.employee.firstName} {salary.employee.lastName}
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {salary.employee.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{salary.employee.position}</TableCell>
                        <TableCell>{getSalaryTypeBadge(salary.type)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(salary.amount)}
                        </TableCell>
                        <TableCell>{salary.payFrequency.replace('_', ' ')}</TableCell>
                        <TableCell>{formatDate(salary.effectiveDate)}</TableCell>
                        <TableCell>
                          <Badge variant={salary.isActive ? 'default' : 'secondary'}>
                            {salary.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="cursor-pointer">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  navigation.push(
                                    `/dashboard/admin/compensation/salaries/${salary.id}`
                                  )
                                }
                                className="cursor-pointer"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  navigation.push(
                                    `/dashboard/admin/compensation/salaries/${salary.id}/edit`
                                  )
                                }
                                className="cursor-pointer"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(salary)}
                                className="text-destructive cursor-pointer"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-4 md:hidden">
                {paginatedSalaries.map((salary) => (
                  <Card key={salary.id}>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">
                              {salary.employee.firstName} {salary.employee.lastName}
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {salary.employee.position}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="cursor-pointer">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  navigation.push(
                                    `/dashboard/admin/compensation/salaries/${salary.id}`
                                  )
                                }
                                className="cursor-pointer"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  navigation.push(
                                    `/dashboard/admin/compensation/salaries/${salary.id}/edit`
                                  )
                                }
                                className="cursor-pointer"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(salary)}
                                className="text-destructive cursor-pointer"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Type:</span>
                            <div className="mt-1">{getSalaryTypeBadge(salary.type)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Status:</span>
                            <div className="mt-1">
                              <Badge variant={salary.isActive ? 'default' : 'secondary'}>
                                {salary.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Amount:</span>
                            <div className="font-medium">{formatCurrency(salary.amount)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Frequency:</span>
                            <div className="font-medium">
                              {salary.payFrequency.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-muted-foreground text-sm">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, sortedSalaries.length)} of{' '}
                    {sortedSalaries.length} salaries
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="cursor-pointer"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Salary Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the salary record for{' '}
              <span className="font-semibold">
                {salaryToDelete?.employee.firstName} {salaryToDelete?.employee.lastName}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
              className="cursor-pointer"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
