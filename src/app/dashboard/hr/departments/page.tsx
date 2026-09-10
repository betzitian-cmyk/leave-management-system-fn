'use client';

import { useState, useEffect, useMemo } from 'react';
import { useNavigation } from '@/hooks/use-navigation';
import { departmentsApi } from '@/lib/api/departments';
import type { Department } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Edit,
  Eye,
  Trash2,
  Building2,
  Users,
  Loader2,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';

export default function HRDepartmentsPage() {
  const navigation = useNavigation();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'employees'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Delete Dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentsApi.getAllDepartments();
      if (response.success && response.data) {
        setDepartments(response.data);
      } else if (Array.isArray(response)) {
        setDepartments(response);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
      toast.error('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Filter and sort departments
  const filteredDepartments = useMemo(() => {
    const filtered = departments.filter((dept) => {
      const matchesSearch =
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.manager?.user?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.manager?.user?.lastName.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'employees') {
        comparison = (a.employees?.length || 0) - (b.employees?.length || 0);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [departments, searchTerm, sortBy, sortOrder]);

  const handleOpenDeleteDialog = (department: Department) => {
    setDeletingDepartment(department);
    setShowDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setDeletingDepartment(null);
  };

  const handleDelete = async () => {
    if (!deletingDepartment) return;

    setDeleting(true);
    try {
      await departmentsApi.deleteDepartment(deletingDepartment.id);
      toast.success('Department deleted successfully');
      handleCloseDeleteDialog();
      fetchDepartments();
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete department');
    } finally {
      setDeleting(false);
    }
  };

  const totalEmployees = departments.reduce((sum, dept) => sum + (dept.employees?.length || 0), 0);
  const departmentsWithManager = departments.filter((dept) => dept.managerId).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Departments</h1>
          <p className="text-muted-foreground mt-1">
            Manage departments and organizational structure
          </p>
        </div>
        <Button onClick={() => navigation.push('/dashboard/hr/departments/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Department
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
            <Building2 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">With Managers</CardTitle>
            <UserCheck className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departmentsWithManager}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Team Size</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {departments.length > 0 ? Math.round(totalEmployees / departments.length) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="relative lg:col-span-2">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search by name, description, or manager..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(value) => {
                const [newSortBy, newSortOrder] = value.split('-') as [
                  'name' | 'employees',
                  'asc' | 'desc',
                ];
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="employees-desc">Most Employees</SelectItem>
                <SelectItem value="employees-asc">Least Employees</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Departments List */}
      <Card>
        <CardHeader>
          <CardTitle>All Departments</CardTitle>
          <CardDescription>Showing {filteredDepartments.length} departments</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center">
              <Building2 className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="text-lg font-semibold">No departments found</h3>
              <p className="text-muted-foreground text-sm">
                {departments.length === 0
                  ? 'Start by creating your first department'
                  : 'Try adjusting your search'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Department</TableHead>
                        <TableHead>Manager</TableHead>
                        <TableHead>Employees</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDepartments.map((department) => (
                        <TableRow key={department.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full">
                                <Building2 className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-medium">{department.name}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {department.manager ? (
                              <div>
                                <p className="font-medium">
                                  {department.manager.user.firstName}{' '}
                                  {department.manager.user.lastName}
                                </p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">No manager</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {department.employees?.length || 0} employees
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="text-muted-foreground max-w-xs truncate text-sm">
                              {department.description || 'No description'}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigation.push(`/dashboard/hr/departments/${department.id}`)
                                  }
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigation.push(
                                      `/dashboard/hr/departments/${department.id}/edit`
                                    )
                                  }
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleOpenDeleteDialog(department)}
                                  className="text-destructive"
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
              </div>

              {/* Mobile Card View */}
              <div className="space-y-4 md:hidden">
                {filteredDepartments.map((department) => (
                  <Card key={department.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full">
                              <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">{department.name}</p>
                              <Badge variant="outline" className="mt-1">
                                {department.employees?.length || 0} employees
                              </Badge>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  navigation.push(`/dashboard/hr/departments/${department.id}`)
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  navigation.push(`/dashboard/hr/departments/${department.id}/edit`)
                                }
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenDeleteDialog(department)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="grid gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Manager:</span>
                            {department.manager ? (
                              <span className="font-medium">
                                {department.manager.user.firstName}{' '}
                                {department.manager.user.lastName}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">No manager</span>
                            )}
                          </div>
                          {department.description && (
                            <div>
                              <span className="text-muted-foreground">Description:</span>
                              <p className="text-foreground mt-1">{department.description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deletingDepartment?.name}</strong>?
              {deletingDepartment && (deletingDepartment.employees?.length || 0) > 0 && (
                <span className="text-destructive mt-2 block">
                  This department has {deletingDepartment.employees?.length} employee(s). You must
                  reassign them before deleting.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDeleteDialog} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={
                deleting ||
                !!(deletingDepartment && (deletingDepartment.employees?.length || 0) > 0)
              }
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
