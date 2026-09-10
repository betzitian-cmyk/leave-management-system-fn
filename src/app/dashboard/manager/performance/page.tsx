'use client';

import { useState, useEffect, useMemo } from 'react';
import { useNavigation } from '@/hooks/use-navigation';
import { managerApi } from '@/lib/api/manager';
import { leaveRequestsApi } from '@/lib/api/leaveRequests';
import type { Employee, LeaveRequest } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart3,
  Loader2,
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  Eye,
  Filter,
  Award,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

interface TeamMemberPerformance {
  employee: Employee;
  totalLeaves: number;
  totalDays: number;
  approvedLeaves: number;
  pendingLeaves: number;
  rejectedLeaves: number;
  approvedDays: number;
  pendingDays: number;
}

export default function ManagerTeamPerformancePage() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<Employee[]>([]);
  const [teamLeaves, setTeamLeaves] = useState<LeaveRequest[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState<number | undefined>(undefined);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersResponse, leavesResponse] = await Promise.all([
        managerApi.getTeamMembers(),
        leaveRequestsApi.getAllLeaveRequests(),
      ]);

      let membersData: Employee[] = [];
      if (membersResponse.success && membersResponse.data) {
        membersData = membersResponse.data;
      } else if (Array.isArray(membersResponse)) {
        membersData = membersResponse;
      }

      let allLeavesData: LeaveRequest[] = [];
      if (leavesResponse.success && leavesResponse.data) {
        allLeavesData = leavesResponse.data;
      } else if (Array.isArray(leavesResponse)) {
        allLeavesData = leavesResponse;
      }

      // Filter leaves to only include team members
      const teamMemberIds = new Set(membersData.map((member) => member.id));
      const teamLeavesData = allLeavesData.filter((leave) => teamMemberIds.has(leave.employee.id));

      setTeamMembers(membersData);
      setTeamLeaves(teamLeavesData);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast.error('Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate performance metrics for each team member
  const performanceData = useMemo(() => {
    const performanceMap = new Map<string, TeamMemberPerformance>();

    // Initialize all team members
    teamMembers.forEach((member) => {
      performanceMap.set(member.id, {
        employee: member,
        totalLeaves: 0,
        totalDays: 0,
        approvedLeaves: 0,
        pendingLeaves: 0,
        rejectedLeaves: 0,
        approvedDays: 0,
        pendingDays: 0,
      });
    });

    // Process leaves for the selected year/month
    teamLeaves.forEach((leave) => {
      const leaveDate = new Date(leave.startDate);
      const leaveYear = leaveDate.getFullYear();
      const leaveMonth = leaveDate.getMonth() + 1;

      // Filter by year and month if selected
      if (year && leaveYear !== year) return;
      if (month && leaveMonth !== month) return;

      const memberId = leave.employee.id;
      const performance = performanceMap.get(memberId);

      if (performance) {
        performance.totalLeaves += 1;
        performance.totalDays += leave.numberOfDays;

        if (leave.status === 'APPROVED') {
          performance.approvedLeaves += 1;
          performance.approvedDays += leave.numberOfDays;
        } else if (leave.status === 'PENDING') {
          performance.pendingLeaves += 1;
          performance.pendingDays += leave.numberOfDays;
        } else if (leave.status === 'REJECTED') {
          performance.rejectedLeaves += 1;
        }
      }
    });

    return Array.from(performanceMap.values()).sort((a, b) => {
      // Sort by total days descending
      return b.totalDays - a.totalDays;
    });
  }, [teamMembers, teamLeaves, year, month]);

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    const totalMembers = teamMembers.length;
    const totalLeaves = performanceData.reduce((sum, p) => sum + p.totalLeaves, 0);
    const totalDays = performanceData.reduce((sum, p) => sum + p.totalDays, 0);
    const approvedLeaves = performanceData.reduce((sum, p) => sum + p.approvedLeaves, 0);
    const pendingLeaves = performanceData.reduce((sum, p) => sum + p.pendingLeaves, 0);
    const averageDaysPerMember =
      totalMembers > 0 ? Math.round((totalDays / totalMembers) * 10) / 10 : 0;
    const approvalRate = totalLeaves > 0 ? Math.round((approvedLeaves / totalLeaves) * 100) : 0;

    return {
      totalMembers,
      totalLeaves,
      totalDays,
      approvedLeaves,
      pendingLeaves,
      averageDaysPerMember,
      approvalRate,
    };
  }, [teamMembers.length, performanceData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Performance</h1>
          <p className="text-muted-foreground mt-1">View your teams leave performance metrics</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Performance Filters
          </CardTitle>
          <CardDescription>Select time period to analyze team performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Select value={year.toString()} onValueChange={(value) => setYear(Number(value))}>
                <SelectTrigger id="year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="month">Month (Optional)</Label>
              <Select
                value={month?.toString() || 'all'}
                onValueChange={(value) => setMonth(value === 'all' ? undefined : Number(value))}
              >
                <SelectTrigger id="month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={fetchData} disabled={loading} className="cursor-pointer">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Refresh Data'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalMembers}</div>
            <p className="text-muted-foreground text-xs">Total team size</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Leaves</CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalLeaves}</div>
            <p className="text-muted-foreground text-xs">{overallStats.totalDays} total days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.approvalRate}%</div>
            <p className="text-muted-foreground text-xs">{overallStats.approvedLeaves} approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Days</CardTitle>
            <Award className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.averageDaysPerMember}</div>
            <p className="text-muted-foreground text-xs">Per team member</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Member Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Member Performance</CardTitle>
          <CardDescription>
            Detailed leave performance for each team member
            {month && ` - ${months.find((m) => m.value === month)?.label} ${year}`}
            {!month && ` - ${year}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
          ) : performanceData.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center">
              <BarChart3 className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="text-lg font-semibold">No performance data</h3>
              <p className="text-muted-foreground text-sm">
                No leave requests found for the selected period
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
                        <TableHead>Team Member</TableHead>
                        <TableHead>Total Leaves</TableHead>
                        <TableHead>Total Days</TableHead>
                        <TableHead>Approved</TableHead>
                        <TableHead>Pending</TableHead>
                        <TableHead>Rejected</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {performanceData.map((perf) => (
                        <TableRow key={perf.employee.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={perf.employee.user.profilePicture || undefined} />
                                <AvatarFallback>
                                  {perf.employee.user.firstName[0]}
                                  {perf.employee.user.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {perf.employee.user.firstName} {perf.employee.user.lastName}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                  {perf.employee.position}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{perf.totalLeaves}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{perf.totalDays} days</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className="gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {perf.approvedLeaves} ({perf.approvedDays}d)
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1">
                              <Clock className="h-3 w-3" />
                              {perf.pendingLeaves} ({perf.pendingDays}d)
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive" className="gap-1">
                              <TrendingDown className="h-3 w-3" />
                              {perf.rejectedLeaves}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {perf.totalLeaves > 0 ? (
                              <Badge variant="default">
                                {Math.round((perf.approvedLeaves / perf.totalLeaves) * 100)}% Rate
                              </Badge>
                            ) : (
                              <Badge variant="secondary">No Data</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigation.push(`/dashboard/manager/team/${perf.employee.id}`)
                              }
                              className="cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="space-y-4 md:hidden">
                {performanceData.map((perf) => (
                  <Card key={perf.employee.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={perf.employee.user.profilePicture || undefined} />
                              <AvatarFallback>
                                {perf.employee.user.firstName[0]}
                                {perf.employee.user.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {perf.employee.user.firstName} {perf.employee.user.lastName}
                              </p>
                              <p className="text-muted-foreground text-sm">
                                {perf.employee.position}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigation.push(`/dashboard/manager/team/${perf.employee.id}`)
                            }
                            className="cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid gap-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Leaves:</span>
                            <span className="font-medium">{perf.totalLeaves}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Days:</span>
                            <span className="font-medium">{perf.totalDays} days</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Approved:</span>
                            <Badge variant="default" className="gap-1">
                              {perf.approvedLeaves} ({perf.approvedDays}d)
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Pending:</span>
                            <Badge variant="outline" className="gap-1">
                              {perf.pendingLeaves} ({perf.pendingDays}d)
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Rejected:</span>
                            <Badge variant="destructive">{perf.rejectedLeaves}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Approval Rate:</span>
                            {perf.totalLeaves > 0 ? (
                              <Badge variant="default">
                                {Math.round((perf.approvedLeaves / perf.totalLeaves) * 100)}%
                              </Badge>
                            ) : (
                              <Badge variant="secondary">No Data</Badge>
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
