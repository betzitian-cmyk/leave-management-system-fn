'use client';

import { useState, useEffect, useMemo } from 'react';
import { useNavigation } from '@/hooks/use-navigation';
import { managerApi } from '@/lib/api/manager';
import type { LeaveRequest } from '@/types';
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
import { Calendar as CalendarIcon, Loader2, Eye, Filter } from 'lucide-react';
import { toast } from 'sonner';

export default function ManagerTeamCalendarPage() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LeaveRequest[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

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

  useEffect(() => {
    fetchCalendar();
  }, []);

  const fetchCalendar = async () => {
    try {
      setLoading(true);
      const response = await managerApi.getTeamCalendar();

      let calendarData: LeaveRequest[] = [];
      if (response.success && response.data) {
        calendarData = response.data;
      } else if (Array.isArray(response)) {
        calendarData = response;
      }

      setData(calendarData);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      toast.error('Failed to fetch calendar data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // Filter leaves by selected month/year
  const filteredData = useMemo(() => {
    return data.filter((leave) => {
      const leaveStartDate = new Date(leave.startDate);
      const leaveYear = leaveStartDate.getFullYear();
      const leaveMonth = leaveStartDate.getMonth() + 1;

      return leaveYear === year && leaveMonth === month;
    });
  }, [data, year, month]);

  // Group by employee for summary
  const uniqueEmployees = useMemo(() => {
    const employeeIds = new Set(filteredData.map((leave) => leave.employee.id));
    return employeeIds.size;
  }, [filteredData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Calendar</h1>
          <p className="text-muted-foreground mt-1">View your teams approved leaves</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Calendar Filters
          </CardTitle>
          <CardDescription>Select time period to view team leaves</CardDescription>
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
              <Label htmlFor="month">Month</Label>
              <Select value={month.toString()} onValueChange={(value) => setMonth(Number(value))}>
                <SelectTrigger id="month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={fetchCalendar} disabled={loading} className="cursor-pointer">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Refresh Calendar'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Data */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Team Leave Calendar
              </CardTitle>
              <CardDescription>
                {months.find((m) => m.value === month)?.label} {year}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center">
              <CalendarIcon className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="text-lg font-semibold">No leaves scheduled</h3>
              <p className="text-muted-foreground text-sm">
                There are no approved leaves for your team in the selected period
              </p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-2xl font-bold">{filteredData.length}</div>
                        <p className="text-muted-foreground text-sm">
                          {filteredData.length === 1 ? 'Leave' : 'Leaves'} scheduled
                        </p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{uniqueEmployees}</div>
                        <p className="text-muted-foreground text-sm">
                          {uniqueEmployees === 1 ? 'Team member' : 'Team members'} on leave
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Leave Events List */}
              <div className="space-y-4">
                {filteredData.map((leave) => (
                  <Card key={leave.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={leave.employee.user.profilePicture || undefined} />
                            <AvatarFallback>
                              {leave.employee.user.firstName[0]}
                              {leave.employee.user.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="leading-none font-medium">
                                {leave.employee.user.firstName} {leave.employee.user.lastName}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  navigation.push(`/dashboard/manager/team-leaves/${leave.id}`)
                                }
                                className="h-6 cursor-pointer px-2"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-muted-foreground text-sm">
                              {leave.employee.department?.name || 'No Department'}
                            </p>
                            <div className="flex items-center gap-2 text-sm">
                              <CalendarIcon className="h-3 w-3" />
                              <span>
                                {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                              </span>
                              <span className="text-muted-foreground">
                                ({calculateDuration(leave.startDate, leave.endDate)}{' '}
                                {calculateDuration(leave.startDate, leave.endDate) === 1
                                  ? 'day'
                                  : 'days'}
                                )
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          style={{
                            backgroundColor: leave.leaveType.color
                              ? `${leave.leaveType.color}20`
                              : undefined,
                            borderColor: leave.leaveType.color || undefined,
                            color: leave.leaveType.color || undefined,
                          }}
                        >
                          {leave.leaveType.name}
                        </Badge>
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
