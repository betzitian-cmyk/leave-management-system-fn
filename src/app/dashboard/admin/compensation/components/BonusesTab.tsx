'use client';

import { useState, useEffect } from 'react';
import { useNavigation } from '@/hooks/use-navigation';
import { bonusApi } from '@/lib/api/compensation';
import type { Bonus, BonusType, BonusStatus } from '@/types';
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
  Award,
} from 'lucide-react';
import { toast } from 'sonner';

export default function BonusesTab() {
  const navigation = useNavigation();
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | BonusType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | BonusStatus>('all');

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bonusToDelete, setBonusToDelete] = useState<Bonus | null>(null);
  const [deleting, setDeleting] = useState(false);

  const itemsPerPage = 10;

  const fetchBonuses = async () => {
    try {
      setLoading(true);
      const response = await bonusApi.getAllBonuses();

      if ('success' in response && 'data' in response && response.success && response.data) {
        const responseData = response.data as Bonus[] | { data: Bonus[] };
        if (Array.isArray(responseData)) {
          setBonuses(responseData);
        } else if ('data' in responseData && Array.isArray(responseData.data)) {
          setBonuses(responseData.data);
        }
      }
    } catch (err) {
      console.error('Error fetching bonuses:', err);
      toast.error('Failed to fetch bonuses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBonuses();
  }, []);

  // Frontend-side filtering
  const filteredBonuses = bonuses.filter((bonus) => {
    const matchesSearch =
      searchTerm === '' ||
      bonus.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bonus.employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bonus.employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bonus.employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bonus.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || bonus.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || bonus.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Sorting
  const sortedBonuses = [...filteredBonuses].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Pagination
  const totalPages = Math.ceil(sortedBonuses.length / itemsPerPage);
  const paginatedBonuses = sortedBonuses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = (bonus: Bonus) => {
    setBonusToDelete(bonus);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!bonusToDelete) return;

    try {
      setDeleting(true);
      const response = await bonusApi.deleteBonus(bonusToDelete.id);

      if (
        (typeof response === 'object' &&
          response !== null &&
          'success' in response &&
          response.success) ||
        response === undefined
      ) {
        toast.success('Bonus deleted successfully');
        await fetchBonuses();
      } else if (
        typeof response === 'object' &&
        response !== null &&
        'message' in response &&
        typeof response.message === 'string'
      ) {
        toast.error(response.message || 'Failed to delete bonus');
      } else {
        toast.success('Bonus deleted successfully');
        await fetchBonuses();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete bonus';
      toast.error(errorMessage);
      console.error('Error deleting bonus:', err);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setBonusToDelete(null);
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

  const getBonusTypeBadge = (type: BonusType) => {
    const typeMap: Record<
      BonusType,
      { label: string; variant: 'default' | 'secondary' | 'outline' }
    > = {
      PERFORMANCE: { label: 'Performance', variant: 'default' },
      ANNUAL: { label: 'Annual', variant: 'default' },
      QUARTERLY: { label: 'Quarterly', variant: 'secondary' },
      PROJECT: { label: 'Project', variant: 'outline' },
      REFERRAL: { label: 'Referral', variant: 'outline' },
      RETENTION: { label: 'Retention', variant: 'secondary' },
      SIGN_ON: { label: 'Sign On', variant: 'outline' },
      MILESTONE: { label: 'Milestone', variant: 'secondary' },
      OTHER: { label: 'Other', variant: 'secondary' },
    };

    const { label, variant } = typeMap[type];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getStatusBadge = (status: BonusStatus) => {
    const statusMap: Record<
      BonusStatus,
      { label: string; variant: 'default' | 'secondary' | 'outline'; className?: string }
    > = {
      PENDING: { label: 'Pending', variant: 'secondary', className: '' },
      APPROVED: {
        label: 'Approved',
        variant: 'outline',
        className: 'border-blue-500 text-blue-700 dark:text-blue-400',
      },
      PAID: {
        label: 'Paid',
        variant: 'outline',
        className: 'border-green-500 text-green-700 dark:text-green-400',
      },
      CANCELLED: { label: 'Cancelled', variant: 'secondary', className: '' },
      REJECTED: {
        label: 'Rejected',
        variant: 'outline',
        className: 'border-red-500 text-red-700 dark:text-red-400',
      },
    };

    const { label, variant, className } = statusMap[status];
    return (
      <Badge variant={variant} className={className}>
        {label}
      </Badge>
    );
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
          <h2 className="text-xl font-semibold">Bonus Management</h2>
          <p className="text-muted-foreground text-sm">Manage employee bonuses and incentives</p>
        </div>
        <Button
          onClick={() => navigation.push('/dashboard/admin/compensation/bonuses/create')}
          className="cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Bonus
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
                placeholder="Search by employee, title, or description..."
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
                setTypeFilter(value as 'all' | BonusType);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PERFORMANCE">Performance</SelectItem>
                <SelectItem value="ANNUAL">Annual</SelectItem>
                <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                <SelectItem value="PROJECT">Project</SelectItem>
                <SelectItem value="REFERRAL">Referral</SelectItem>
                <SelectItem value="RETENTION">Retention</SelectItem>
                <SelectItem value="SIGN_ON">Sign On</SelectItem>
                <SelectItem value="MILESTONE">Milestone</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as 'all' | BonusStatus);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent>
          {paginatedBonuses.length === 0 ? (
            <div className="flex h-96 flex-col items-center justify-center">
              <Award className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="text-lg font-semibold">No bonuses found</h3>
              <p className="text-muted-foreground text-sm">
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first bonus to get started'}
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
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Effective Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedBonuses.map((bonus) => (
                      <TableRow key={bonus.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {bonus.employee.firstName} {bonus.employee.lastName}
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {bonus.employee.position}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{bonus.title}</div>
                            <div className="text-muted-foreground line-clamp-1 text-sm">
                              {bonus.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getBonusTypeBadge(bonus.type)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(bonus.amount)}
                        </TableCell>
                        <TableCell>{formatDate(bonus.effectiveDate)}</TableCell>
                        <TableCell>{getStatusBadge(bonus.status)}</TableCell>
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
                                    `/dashboard/admin/compensation/bonuses/${bonus.id}`
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
                                    `/dashboard/admin/compensation/bonuses/${bonus.id}/edit`
                                  )
                                }
                                className="cursor-pointer"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(bonus)}
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
                {paginatedBonuses.map((bonus) => (
                  <Card key={bonus.id}>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">{bonus.title}</div>
                            <div className="text-muted-foreground text-sm">
                              {bonus.employee.firstName} {bonus.employee.lastName}
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
                                    `/dashboard/admin/compensation/bonuses/${bonus.id}`
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
                                    `/dashboard/admin/compensation/bonuses/${bonus.id}/edit`
                                  )
                                }
                                className="cursor-pointer"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(bonus)}
                                className="text-destructive cursor-pointer"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {getBonusTypeBadge(bonus.type)}
                          {getStatusBadge(bonus.status)}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Amount:</span>
                            <div className="font-medium">{formatCurrency(bonus.amount)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Date:</span>
                            <div className="font-medium">{formatDate(bonus.effectiveDate)}</div>
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
                    {Math.min(currentPage * itemsPerPage, sortedBonuses.length)} of{' '}
                    {sortedBonuses.length} bonuses
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
            <DialogTitle>Delete Bonus</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the bonus{' '}
              <span className="font-semibold">{bonusToDelete?.title}</span> for{' '}
              <span className="font-semibold">
                {bonusToDelete?.employee.firstName} {bonusToDelete?.employee.lastName}
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
