'use client';

import { useState, useEffect, useMemo } from 'react';
import { useNavigation } from '@/hooks/use-navigation';
import { managerApi } from '@/lib/api/manager';
import type { Employee } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Eye,
  Building2,
  Loader2,
  Users,
  Filter,
  UserCheck,
  UserX,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ManagerTeamMembersPage() {
  const navigation = useNavigation();
  const [teamMembers, setTeamMembers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'hireDate' | 'department'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await managerApi.getTeamMembers();

      if (response.success && response.data) {
        setTeamMembers(response.data);
      } else if (Array.isArray(response)) {
        setTeamMembers(response);
      }
    } catch (err) {
      console.error('Error fetching team members:', err);
      toast.error('Failed to fetch team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set(teamMembers.map((emp) => emp.department?.name).filter(Boolean));
    return Array.from(depts);
  }, [teamMembers]);

  // Filter and sort team members
  const filteredTeamMembers = useMemo(() => {
    const filtered = teamMembers.filter((employee) => {
      const fullName = `${employee.user.firstName} ${employee.user.lastName}`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchTerm.toLowerCase()) ||
        employee.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.position.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepartment =
        departmentFilter === 'all' || employee.department?.name === departmentFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && employee.status === 'ACTIVE') ||
        (statusFilter === 'inactive' && employee.status !== 'ACTIVE');

      return matchesSearch && matchesDepartment && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'name') {
        const nameA = `${a.user.firstName} ${a.user.lastName}`;
        const nameB = `${b.user.firstName} ${b.user.lastName}`;
        comparison = nameA.localeCompare(nameB);
      } else if (sortBy === 'hireDate') {
        comparison = new Date(a.hireDate).getTime() - new Date(b.hireDate).getTime();
      } else if (sortBy === 'department') {
        comparison = (a.department?.name || '').localeCompare(b.department?.name || '');
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [teamMembers, searchTerm, departmentFilter, statusFilter, sortBy, sortOrder]);

  const stats = useMemo(() => {
    return {
      total: teamMembers.length,
      active: teamMembers.filter((emp) => emp.status === 'ACTIVE').length,
      inactive: teamMembers.filter((emp) => emp.status !== 'ACTIVE').length,
      departments: departments.length,
    };
  }, [teamMembers, departments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Members</h1>
          <p className="text-muted-foreground mt-1">View and manage your team members</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <UserX className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.departments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search by name, email, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(value) => {
                const [newSortBy, newSortOrder] = value.split('-') as [
                  'name' | 'hireDate' | 'department',
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
                <SelectItem value="hireDate-desc">Newest First</SelectItem>
                <SelectItem value="hireDate-asc">Oldest First</SelectItem>
                <SelectItem value="department-asc">Department (A-Z)</SelectItem>
                <SelectItem value="department-desc">Department (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Showing {filteredTeamMembers.length} team members</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
          ) : filteredTeamMembers.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center">
              <Users className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="text-lg font-semibold">No team members found</h3>
              <p className="text-muted-foreground text-sm">
                {teamMembers.length === 0
                  ? 'You have no team members assigned to you'
                  : 'Try adjusting your filters'}
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
                        <TableHead>Member</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Hire Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTeamMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={member.user.profilePicture || undefined} />
                                <AvatarFallback>
                                  {member.user.firstName[0]}
                                  {member.user.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {member.user.firstName} {member.user.lastName}
                                </p>
                                <p className="text-muted-foreground text-sm">{member.user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{member.position}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="text-muted-foreground h-4 w-4" />
                              <span className="text-sm">
                                {member.department?.name || 'No Department'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(member.hireDate)}
                          </TableCell>
                          <TableCell>
                            {member.status === 'ACTIVE' ? (
                              <Badge variant="default" className="gap-1">
                                <UserCheck className="h-3 w-3" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <UserX className="h-3 w-3" />
                                Inactive
                              </Badge>
                            )}
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
                                    navigation.push(`/dashboard/manager/team/${member.id}`)
                                  }
                                  className="cursor-pointer"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
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
                {filteredTeamMembers.map((member) => (
                  <Card key={member.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member.user.profilePicture || undefined} />
                              <AvatarFallback>
                                {member.user.firstName[0]}
                                {member.user.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {member.user.firstName} {member.user.lastName}
                              </p>
                              <p className="text-muted-foreground text-sm">{member.user.email}</p>
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
                                  navigation.push(`/dashboard/manager/team/${member.id}`)
                                }
                                className="cursor-pointer"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="grid gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Position:</span>
                            <Badge variant="outline">{member.position}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Department:</span>
                            <span className="font-medium">
                              {member.department?.name || 'No Department'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Hire Date:</span>
                            <span className="font-medium">{formatDate(member.hireDate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            {member.status === 'ACTIVE' ? (
                              <Badge variant="default" className="gap-1">
                                <UserCheck className="h-3 w-3" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <UserX className="h-3 w-3" />
                                Inactive
                              </Badge>
                            )}
                          </div>
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
    </div>
  );
}
