'use client';

import { useState, useEffect } from 'react';
import { usersApi } from '@/lib/api/users';
import type { UserListItem, UserRole, UserStatus } from '@/types';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Edit,
  Trash2,
  Shield,
  User as UserIcon,
} from 'lucide-react';
import { toast } from 'sonner';

export default function UsersPage() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [userToEditRole, setUserToEditRole] = useState<UserListItem | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [updatingRole, setUpdatingRole] = useState(false);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [userToEditStatus, setUserToEditStatus] = useState<UserListItem | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | ''>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const itemsPerPage = 10;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getAllUsers();
      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredUsers = users
    .filter((user) => {
      const searchMatch =
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department.toLowerCase().includes(searchTerm.toLowerCase());

      const roleMatch = roleFilter === 'all' || user.role === roleFilter;
      const statusMatch = statusFilter === 'all' || user.status === statusFilter;

      return searchMatch && roleMatch && statusMatch;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // Delete user handlers
  const handleDelete = (user: UserListItem) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    try {
      const response = await usersApi.deleteUser(userToDelete.id);
      if (response.success) {
        toast.success('User deleted successfully');
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  // Edit role handlers
  const handleEditRole = (user: UserListItem) => {
    setUserToEditRole(user);
    setSelectedRole(user.role);
    setRoleDialogOpen(true);
  };

  const confirmUpdateRole = async () => {
    if (!userToEditRole || !selectedRole) return;

    setUpdatingRole(true);
    try {
      // Note: Backend expects roleIds array, but we need to get the role ID
      // For now, we'll need to add a roles endpoint or modify this
      toast.info('Role update feature requires role IDs from backend');
      setRoleDialogOpen(false);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update user role');
    } finally {
      setUpdatingRole(false);
    }
  };

  // Edit status handlers
  const handleEditStatus = (user: UserListItem) => {
    setUserToEditStatus(user);
    setSelectedStatus(user.status);
    setStatusDialogOpen(true);
  };

  const confirmUpdateStatus = async () => {
    if (!userToEditStatus || !selectedStatus) return;

    setUpdatingStatus(true);
    try {
      const response = await usersApi.updateUserStatus(userToEditStatus.id, {
        status: selectedStatus,
      });
      if (response.success) {
        toast.success('User status updated successfully');
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update user status');
    } finally {
      setUpdatingStatus(false);
      setStatusDialogOpen(false);
      setUserToEditStatus(null);
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive';
      case 'HR_MANAGER':
        return 'default';
      case 'MANAGER':
        return 'secondary';
      case 'EMPLOYEE':
        return 'outline';
      case 'GUEST':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: UserStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'INACTIVE':
        return 'secondary';
      case 'SUSPENDED':
        return 'destructive';
      case 'PENDING':
        return 'outline';
      default:
        return 'outline';
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
      <div>
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
        <p className="text-muted-foreground">Manage system users, roles, and permissions</p>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle>All Users</CardTitle>
            <div className="text-muted-foreground text-sm">
              {filteredUsers.length} of {users.length} users
              {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && ' (filtered)'}
            </div>
          </div>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
              <Input
                placeholder="Search users by name, email, or department..."
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
                value={roleFilter}
                onValueChange={(value) => {
                  setRoleFilter(value as 'all' | UserRole);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="GUEST">Guest</SelectItem>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="HR_MANAGER">HR Manager</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as 'all' | UserStatus);
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
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={(value) => {
                  const [field, order] = value.split('-');
                  setSortBy(field as 'name' | 'email' | 'createdAt');
                  setSortOrder(order as 'asc' | 'desc');
                }}
              >
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">Newest First</SelectItem>
                  <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                  <SelectItem value="name-asc">Name A-Z</SelectItem>
                  <SelectItem value="name-desc">Name Z-A</SelectItem>
                  <SelectItem value="email-asc">Email A-Z</SelectItem>
                  <SelectItem value="email-desc">Email Z-A</SelectItem>
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
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-muted-foreground py-8 text-center">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentUsers.map((user, index) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{startIndex + index + 1}</TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <UserIcon className="text-muted-foreground h-4 w-4" />
                            {user.firstName} {user.lastName}
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(user.status)}>{user.status}</Badge>
                        </TableCell>
                        <TableCell>{user.department}</TableCell>
                        <TableCell>{user.position}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
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
                                onClick={() => handleEditRole(user)}
                              >
                                <Shield className="mr-2 h-4 w-4" />
                                Change Role
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => handleEditStatus(user)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Change Status
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive cursor-pointer"
                                onClick={() => handleDelete(user)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
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
            {currentUsers.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">No users found</div>
            ) : (
              currentUsers.map((user, index) => (
                <Card key={user.id}>
                  <CardContent>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-sm font-medium">
                            #{startIndex + index + 1}
                          </span>
                          <h3 className="font-semibold">
                            {user.firstName} {user.lastName}
                          </h3>
                        </div>
                        <p className="text-muted-foreground text-sm">{user.email}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                          <Badge variant={getStatusBadgeVariant(user.status)}>{user.status}</Badge>
                        </div>
                        <div className="text-muted-foreground space-y-1 text-sm">
                          <p>
                            <strong>Department:</strong> {user.department}
                          </p>
                          <p>
                            <strong>Position:</strong> {user.position}
                          </p>
                          <p>
                            <strong>Last Login:</strong>{' '}
                            {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
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
                            onClick={() => handleEditRole(user)}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => handleEditStatus(user)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Change Status
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive cursor-pointer"
                            onClick={() => handleDelete(user)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
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
                Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of{' '}
                {filteredUsers.length} entries
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {userToDelete?.firstName} {userToDelete?.lastName}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deleting ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {userToEditRole?.firstName} {userToEditRole?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Select Role</Label>
              <Select
                value={selectedRole}
                onValueChange={(value) => setSelectedRole(value as UserRole)}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GUEST">Guest</SelectItem>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="HR_MANAGER">HR Manager</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleDialogOpen(false)}
              disabled={updatingRole}
            >
              Cancel
            </Button>
            <Button onClick={confirmUpdateRole} disabled={updatingRole || !selectedRole}>
              {updatingRole && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {updatingRole ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Status</DialogTitle>
            <DialogDescription>
              Update the status for {userToEditStatus?.firstName} {userToEditStatus?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Select Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value as UserStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusDialogOpen(false)}
              disabled={updatingStatus}
            >
              Cancel
            </Button>
            <Button onClick={confirmUpdateStatus} disabled={updatingStatus || !selectedStatus}>
              {updatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {updatingStatus ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
