'use client';

import { useState, useEffect } from 'react';
import { useNavigation } from '@/hooks/use-navigation';
import { leaveTypesApi } from '@/lib/api/leaveTypes';
import type { LeaveType } from '@/types';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LeaveTypesPage() {
  const navigation = useNavigation();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveTypeToDelete, setLeaveTypeToDelete] = useState<LeaveType | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchLeaveTypes = async () => {
    try {
      setLoading(true);
      const response = await leaveTypesApi.getAllLeaveTypes();

      // Handle both response formats
      if (response.success && response.data) {
        setLeaveTypes(response.data);
      } else if (Array.isArray(response)) {
        setLeaveTypes(response as unknown as LeaveType[]);
      }
    } catch (err) {
      console.error('Error fetching leave types:', err);
      toast.error('Failed to fetch leave types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const filteredLeaveTypes = leaveTypes.filter(
    (type) =>
      type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openDeleteDialog = (leaveType: LeaveType) => {
    setLeaveTypeToDelete(leaveType);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!leaveTypeToDelete) return;
    setDeleting(true);
    try {
      await leaveTypesApi.deleteLeaveType(leaveTypeToDelete.id);
      toast.success('Leave type deactivated successfully');
      await fetchLeaveTypes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete leave type');
      console.error('Error deleting leave type:', err);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setLeaveTypeToDelete(null);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Leave Types</h2>
          <p className="text-muted-foreground">Manage available leave types for employees</p>
        </div>
        <Button
          onClick={() => navigation.push('/dashboard/admin/leave-types/create')}
          className="cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Leave Type
        </Button>
      </div>

      {/* Leave Types Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle>All Leave Types</CardTitle>
            <div className="text-muted-foreground text-sm">
              {filteredLeaveTypes.length} of {leaveTypes.length} leave types
              {searchTerm && ' (filtered)'}
            </div>
          </div>
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
            <Input
              placeholder="Search leave types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
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
                    <TableHead>Description</TableHead>
                    <TableHead>Default Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeaveTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                        No leave types found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeaveTypes.map((leaveType, index) => (
                      <TableRow key={leaveType.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {leaveType.color && (
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: leaveType.color }}
                              />
                            )}
                            {leaveType.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-md truncate text-sm">
                          {leaveType.description || 'No description'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <Calendar className="h-3 w-3" />
                            {leaveType.defaultDays} days
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={leaveType.active ? 'default' : 'secondary'}>
                            {leaveType.active ? 'Active' : 'Inactive'}
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
                                  navigation.push(
                                    `/dashboard/admin/leave-types/${leaveType.id}/edit`
                                  )
                                }
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Leave Type
                              </DropdownMenuItem>
                              {leaveType.active && (
                                <DropdownMenuItem
                                  className="text-destructive cursor-pointer"
                                  onClick={() => openDeleteDialog(leaveType)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Deactivate
                                </DropdownMenuItem>
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
            {filteredLeaveTypes.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">No leave types found</div>
            ) : (
              filteredLeaveTypes.map((leaveType, index) => (
                <Card key={leaveType.id}>
                  <CardContent>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-sm font-medium">
                            #{index + 1}
                          </span>
                          {leaveType.color && (
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: leaveType.color }}
                            />
                          )}
                          <h3 className="font-semibold">{leaveType.name}</h3>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {leaveType.description || 'No description'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="gap-1">
                            <Calendar className="h-3 w-3" />
                            {leaveType.defaultDays} days
                          </Badge>
                          <Badge variant={leaveType.active ? 'default' : 'secondary'}>
                            {leaveType.active ? 'Active' : 'Inactive'}
                          </Badge>
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
                              navigation.push(`/dashboard/admin/leave-types/${leaveType.id}/edit`)
                            }
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Leave Type
                          </DropdownMenuItem>
                          {leaveType.active && (
                            <DropdownMenuItem
                              className="text-destructive cursor-pointer"
                              onClick={() => openDeleteDialog(leaveType)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Deactivate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Leave Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate &quot;{leaveTypeToDelete?.name}&quot;? This will
              prevent employees from requesting this leave type.
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
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deleting ? 'Deactivating...' : 'Deactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
