'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Users,
  ClipboardList,
  Calendar,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { onboardingApi } from '@/lib/api/onboarding';
import type { OnboardingProcess, OnboardingProcessStatus, OnboardingPhase } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function HROnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [onboardings, setOnboardings] = useState<OnboardingProcess[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('startDate_desc');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    avgProgress: 0,
  });

  useEffect(() => {
    fetchOnboardings();
  }, []);

  const fetchOnboardings = async () => {
    try {
      setLoading(true);
      const response = await onboardingApi.getAllOnboardings();

      let data: OnboardingProcess[] = [];
      if ('success' in response && response.success && 'data' in response) {
        const responseData = response.data;
        if ('data' in responseData && Array.isArray(responseData.data)) {
          data = responseData.data;
        } else if (Array.isArray(responseData)) {
          data = responseData;
        } else {
          data = [];
        }
      } else if ('data' in response && Array.isArray(response.data)) {
        data = response.data;
      } else if (Array.isArray(response)) {
        data = response;
      } else {
        data = [];
      }

      setOnboardings(data);

      // Calculate stats
      const total = data.length;
      const active = data.filter((o) => o.status === 'IN_PROGRESS').length;
      const completed = data.filter((o) => o.status === 'COMPLETED').length;

      setStats({
        total,
        active,
        completed,
        avgProgress: total > 0 ? Math.round((completed / total) * 100) : 0,
      });
    } catch (err) {
      console.error('Error fetching onboardings:', err);
      toast.error('Failed to fetch onboardings');
      setOnboardings([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort onboardings
  const filteredOnboardings = useMemo(() => {
    const filtered = onboardings.filter((onboarding) => {
      const matchesSearch =
        searchTerm === '' ||
        onboarding.employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        onboarding.employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        onboarding.employee.department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        onboarding.employee.position.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || onboarding.status === statusFilter;
      const matchesPhase = phaseFilter === 'all' || onboarding.currentPhase === phaseFilter;

      return matchesSearch && matchesStatus && matchesPhase;
    });

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'startDate_desc':
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        case 'startDate_asc':
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        case 'name_asc':
          return `${a.employee.firstName} ${a.employee.lastName}`.localeCompare(
            `${b.employee.firstName} ${b.employee.lastName}`
          );
        case 'name_desc':
          return `${b.employee.firstName} ${b.employee.lastName}`.localeCompare(
            `${a.employee.firstName} ${a.employee.lastName}`
          );
        default:
          return 0;
      }
    });

    return sorted;
  }, [onboardings, searchTerm, statusFilter, phaseFilter, sortBy]);

  const getStatusBadge = (status: OnboardingProcessStatus) => {
    const variants: Record<
      OnboardingProcessStatus,
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }
    > = {
      NOT_STARTED: { variant: 'secondary', label: 'Not Started' },
      IN_PROGRESS: { variant: 'default', label: 'In Progress' },
      COMPLETED: { variant: 'outline', label: 'Completed' },
      ON_HOLD: { variant: 'secondary', label: 'On Hold' },
      CANCELLED: { variant: 'destructive', label: 'Cancelled' },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPhaseBadge = (phase: OnboardingPhase) => {
    const labels: Record<OnboardingPhase, string> = {
      PRE_BOARDING: 'Pre-Boarding',
      FIRST_DAY: 'First Day',
      FIRST_WEEK: 'First Week',
      FIRST_MONTH: 'First Month',
      FIRST_QUARTER: 'First Quarter',
    };
    return <Badge variant="outline">{labels[phase]}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Onboarding</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage employee onboarding processes</p>
        </div>
        <Button onClick={() => router.push('/dashboard/hr/onboarding/create')}>
          <Plus className="mr-2 h-4 w-4" />
          New Onboarding
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Total Onboardings</p>
              <p className="mt-1 text-2xl font-bold">{stats.total}</p>
            </div>
            <Users className="text-muted-foreground h-8 w-8" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Active</p>
              <p className="mt-1 text-2xl font-bold">{stats.active}</p>
            </div>
            <ClipboardList className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Completed</p>
              <p className="mt-1 text-2xl font-bold">{stats.completed}</p>
            </div>
            <Calendar className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Completion Rate</p>
              <p className="mt-1 text-2xl font-bold">{stats.avgProgress}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="NOT_STARTED">Not Started</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="ON_HOLD">On Hold</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={phaseFilter} onValueChange={setPhaseFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by phase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Phases</SelectItem>
              <SelectItem value="PRE_BOARDING">Pre-Boarding</SelectItem>
              <SelectItem value="FIRST_DAY">First Day</SelectItem>
              <SelectItem value="FIRST_WEEK">First Week</SelectItem>
              <SelectItem value="FIRST_MONTH">First Month</SelectItem>
              <SelectItem value="FIRST_QUARTER">First Quarter</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="startDate_desc">Newest First</SelectItem>
              <SelectItem value="startDate_asc">Oldest First</SelectItem>
              <SelectItem value="name_asc">Name (A-Z)</SelectItem>
              <SelectItem value="name_desc">Name (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Onboardings Table/List */}
      <Card>
        {filteredOnboardings.length === 0 ? (
          <div className="py-12 text-center">
            <ClipboardList className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">No onboardings found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' || phaseFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating a new onboarding process'}
            </p>
            {searchTerm === '' && statusFilter === 'all' && phaseFilter === 'all' && (
              <Button onClick={() => router.push('/dashboard/hr/onboarding/create')}>
                <Plus className="mr-2 h-4 w-4" />
                Create Onboarding
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="p-4 text-left font-medium">Employee</th>
                    <th className="p-4 text-left font-medium">Position</th>
                    <th className="p-4 text-left font-medium">Department</th>
                    <th className="p-4 text-left font-medium">Status</th>
                    <th className="p-4 text-left font-medium">Phase</th>
                    <th className="p-4 text-left font-medium">Start Date</th>
                    <th className="p-4 text-left font-medium">Assigned To</th>
                    <th className="p-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOnboardings.map((onboarding) => (
                    <tr key={onboarding.id} className="hover:bg-muted/50 border-b">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {onboarding.employee.firstName[0]}
                              {onboarding.employee.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {onboarding.employee.firstName} {onboarding.employee.lastName}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {onboarding.employee.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{onboarding.employee.position}</td>
                      <td className="p-4">{onboarding.employee.department.name}</td>
                      <td className="p-4">{getStatusBadge(onboarding.status)}</td>
                      <td className="p-4">{getPhaseBadge(onboarding.currentPhase)}</td>
                      <td className="p-4">
                        {format(new Date(onboarding.startDate), 'MMM dd, yyyy')}
                      </td>
                      <td className="p-4">
                        {onboarding.assignedTo ? (
                          <span className="text-sm">
                            {onboarding.assignedTo.firstName} {onboarding.assignedTo.lastName}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Unassigned</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/hr/onboarding/${onboarding.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/dashboard/hr/onboarding/${onboarding.id}/edit`)
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="divide-y md:hidden">
              {filteredOnboardings.map((onboarding) => (
                <div key={onboarding.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {onboarding.employee.firstName[0]}
                          {onboarding.employee.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {onboarding.employee.firstName} {onboarding.employee.lastName}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {onboarding.employee.position}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">{getStatusBadge(onboarding.status)}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Department:</span>
                      <p className="font-medium">{onboarding.employee.department.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phase:</span>
                      <div className="mt-1">{getPhaseBadge(onboarding.currentPhase)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Start Date:</span>
                      <p className="font-medium">
                        {format(new Date(onboarding.startDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Assigned To:</span>
                      <p className="font-medium">
                        {onboarding.assignedTo
                          ? `${onboarding.assignedTo.firstName} ${onboarding.assignedTo.lastName}`
                          : 'Unassigned'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/dashboard/hr/onboarding/${onboarding.id}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/dashboard/hr/onboarding/${onboarding.id}/edit`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
