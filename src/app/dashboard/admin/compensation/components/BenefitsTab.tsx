'use client';

import { useState, useEffect } from 'react';
import { useNavigation } from '@/hooks/use-navigation';
import { benefitApi } from '@/lib/api/compensation';
import type { Benefit, BenefitType, BenefitCategory } from '@/types';
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
  Gift,
} from 'lucide-react';
import { toast } from 'sonner';

export default function BenefitsTab() {
  const navigation = useNavigation();
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | BenefitType>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | BenefitCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [benefitToDelete, setBenefitToDelete] = useState<Benefit | null>(null);
  const [deleting, setDeleting] = useState(false);

  const itemsPerPage = 10;

  const fetchBenefits = async () => {
    try {
      setLoading(true);
      const response = await benefitApi.getAllBenefits();

      if ('success' in response && 'data' in response && response.success && response.data) {
        const responseData = response.data as Benefit[] | { data: Benefit[] };
        if (Array.isArray(responseData)) {
          setBenefits(responseData);
        } else if ('data' in responseData && Array.isArray(responseData.data)) {
          setBenefits(responseData.data);
        }
      }
    } catch (err) {
      console.error('Error fetching benefits:', err);
      toast.error('Failed to fetch benefits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBenefits();
  }, []);

  // Frontend-side filtering
  const filteredBenefits = benefits.filter((benefit) => {
    const matchesSearch =
      searchTerm === '' ||
      benefit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      benefit.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (benefit.provider && benefit.provider.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'all' || benefit.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || benefit.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && benefit.isActive) ||
      (statusFilter === 'inactive' && !benefit.isActive);

    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  // Sorting
  const sortedBenefits = [...filteredBenefits].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Pagination
  const totalPages = Math.ceil(sortedBenefits.length / itemsPerPage);
  const paginatedBenefits = sortedBenefits.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = (benefit: Benefit) => {
    setBenefitToDelete(benefit);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!benefitToDelete) return;

    try {
      setDeleting(true);
      const response = await benefitApi.deleteBenefit(benefitToDelete.id);

      if (
        (typeof response === 'object' &&
          response !== null &&
          'success' in response &&
          response.success) ||
        response === undefined
      ) {
        toast.success('Benefit deleted successfully');
        await fetchBenefits();
      } else if (
        typeof response === 'object' &&
        response !== null &&
        'message' in response &&
        typeof response.message === 'string'
      ) {
        toast.error(response.message || 'Failed to delete benefit');
      } else {
        toast.success('Benefit deleted successfully');
        await fetchBenefits();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete benefit';
      toast.error(errorMessage);
      console.error('Error deleting benefit:', err);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setBenefitToDelete(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getBenefitTypeBadge = (type: BenefitType) => {
    const typeMap: Record<
      BenefitType,
      { label: string; variant: 'default' | 'secondary' | 'outline' }
    > = {
      HEALTH_INSURANCE: { label: 'Health', variant: 'default' },
      DENTAL_INSURANCE: { label: 'Dental', variant: 'default' },
      VISION_INSURANCE: { label: 'Vision', variant: 'default' },
      LIFE_INSURANCE: { label: 'Life', variant: 'secondary' },
      DISABILITY_INSURANCE: { label: 'Disability', variant: 'secondary' },
      RETIREMENT_PLAN: { label: 'Retirement', variant: 'outline' },
      PAID_TIME_OFF: { label: 'PTO', variant: 'outline' },
      SICK_LEAVE: { label: 'Sick Leave', variant: 'outline' },
      MATERNITY_LEAVE: { label: 'Maternity', variant: 'outline' },
      PATERNITY_LEAVE: { label: 'Paternity', variant: 'outline' },
      EDUCATION_REIMBURSEMENT: { label: 'Education', variant: 'secondary' },
      TRANSPORTATION: { label: 'Transport', variant: 'secondary' },
      MEAL_ALLOWANCE: { label: 'Meals', variant: 'secondary' },
      GYM_MEMBERSHIP: { label: 'Gym', variant: 'secondary' },
      OTHER: { label: 'Other', variant: 'secondary' },
    };

    const { label, variant } = typeMap[type];
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
          <h2 className="text-xl font-semibold">Benefits Management</h2>
          <p className="text-muted-foreground text-sm">Manage employee benefits and packages</p>
        </div>
        <Button
          onClick={() => navigation.push('/dashboard/admin/compensation/benefits/create')}
          className="cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Benefit
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
                placeholder="Search by name, description, or provider..."
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
                setTypeFilter(value as 'all' | BenefitType);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="HEALTH_INSURANCE">Health Insurance</SelectItem>
                <SelectItem value="DENTAL_INSURANCE">Dental Insurance</SelectItem>
                <SelectItem value="VISION_INSURANCE">Vision Insurance</SelectItem>
                <SelectItem value="RETIREMENT_PLAN">Retirement Plan</SelectItem>
                <SelectItem value="PAID_TIME_OFF">Paid Time Off</SelectItem>
                <SelectItem value="GYM_MEMBERSHIP">Gym Membership</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select
              value={categoryFilter}
              onValueChange={(value) => {
                setCategoryFilter(value as 'all' | BenefitCategory);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="INSURANCE">Insurance</SelectItem>
                <SelectItem value="RETIREMENT">Retirement</SelectItem>
                <SelectItem value="TIME_OFF">Time Off</SelectItem>
                <SelectItem value="WELLNESS">Wellness</SelectItem>
                <SelectItem value="PROFESSIONAL_DEVELOPMENT">Professional Dev</SelectItem>
                <SelectItem value="LIFESTYLE">Lifestyle</SelectItem>
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
          {paginatedBenefits.length === 0 ? (
            <div className="flex h-96 flex-col items-center justify-center">
              <Gift className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="text-lg font-semibold">No benefits found</h3>
              <p className="text-muted-foreground text-sm">
                {searchTerm ||
                typeFilter !== 'all' ||
                categoryFilter !== 'all' ||
                statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first benefit to get started'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Benefit Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Enrollment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedBenefits.map((benefit) => (
                      <TableRow key={benefit.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{benefit.name}</div>
                            <div className="text-muted-foreground line-clamp-1 text-sm">
                              {benefit.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getBenefitTypeBadge(benefit.type)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{benefit.category.replace('_', ' ')}</Badge>
                        </TableCell>
                        <TableCell>{benefit.cost ? formatCurrency(benefit.cost) : 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={benefit.requiresEnrollment ? 'default' : 'secondary'}>
                            {benefit.requiresEnrollment ? 'Required' : 'Automatic'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={benefit.isActive ? 'default' : 'secondary'}>
                            {benefit.isActive ? 'Active' : 'Inactive'}
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
                                    `/dashboard/admin/compensation/benefits/${benefit.id}`
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
                                    `/dashboard/admin/compensation/benefits/${benefit.id}/edit`
                                  )
                                }
                                className="cursor-pointer"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(benefit)}
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
                {paginatedBenefits.map((benefit) => (
                  <Card key={benefit.id}>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">{benefit.name}</div>
                            <div className="text-muted-foreground line-clamp-2 text-sm">
                              {benefit.description}
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
                                    `/dashboard/admin/compensation/benefits/${benefit.id}`
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
                                    `/dashboard/admin/compensation/benefits/${benefit.id}/edit`
                                  )
                                }
                                className="cursor-pointer"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(benefit)}
                                className="text-destructive cursor-pointer"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {getBenefitTypeBadge(benefit.type)}
                          <Badge variant="outline">{benefit.category.replace('_', ' ')}</Badge>
                          <Badge variant={benefit.isActive ? 'default' : 'secondary'}>
                            {benefit.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>

                        {benefit.cost && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Cost: </span>
                            <span className="font-medium">{formatCurrency(benefit.cost)}</span>
                          </div>
                        )}
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
                    {Math.min(currentPage * itemsPerPage, sortedBenefits.length)} of{' '}
                    {sortedBenefits.length} benefits
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
            <DialogTitle>Delete Benefit</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold">{benefitToDelete?.name}</span>? This action cannot be
              undone.
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
