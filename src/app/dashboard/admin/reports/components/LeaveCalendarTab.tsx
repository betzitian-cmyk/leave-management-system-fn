'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { reportsApi } from '@/lib/api/reports';
import { departmentsApi } from '@/lib/api/departments';
import type { LeaveCalendarEvent, Department } from '@/types';
import { toast } from 'sonner';

export default function LeaveCalendarTab() {
  const [loading, setLoading] = useState(false);
  const [fetchingDepartments, setFetchingDepartments] = useState(true);
  const [data, setData] = useState<LeaveCalendarEvent[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [departmentId, setDepartmentId] = useState<string | undefined>(undefined);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, departmentId]);

  const fetchDepartments = async () => {
    try {
      setFetchingDepartments(true);
      const response = await departmentsApi.getAllDepartments();

      let departmentData: Department[] = [];
      if ('success' in response && 'data' in response && response.success && response.data) {
        const responseData = response.data as Department[] | { data: Department[] };
        if (Array.isArray(responseData)) {
          departmentData = responseData;
        } else if ('data' in responseData && Array.isArray(responseData.data)) {
          departmentData = responseData.data;
        }
      } else if (Array.isArray(response)) {
        departmentData = response;
      }

      setDepartments(departmentData);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
    } finally {
      setFetchingDepartments(false);
    }
  };

  const fetchCalendar = async () => {
    try {
      setLoading(true);
      const response = await reportsApi.getLeaveCalendar({ departmentId, month, year });

      let calendarData: LeaveCalendarEvent[] = [];
      if (Array.isArray(response)) {
        calendarData = response;
      } else if (
        'success' in response &&
        'data' in response &&
        Array.isArray((response as { success: boolean; data: unknown }).data)
      ) {
        calendarData = (response as { success: boolean; data: LeaveCalendarEvent[] }).data;
      }

      setData(calendarData);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      toast.error('Failed to fetch calendar data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const url =
        format === 'csv'
          ? await reportsApi.exportToCsv({ reportType: 'CALENDAR', year, month, departmentId })
          : await reportsApi.exportToExcel({ reportType: 'CALENDAR', year, month, departmentId });

      window.open(url, '_blank');
      toast.success(`Calendar exported successfully`);
    } catch (error) {
      console.error('Error exporting calendar:', error);
      toast.error('Failed to export calendar');
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

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Calendar Filters</CardTitle>
          <CardDescription>Select time period and department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
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
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={departmentId || 'all'}
                onValueChange={(value) => setDepartmentId(value === 'all' ? undefined : value)}
                disabled={fetchingDepartments}
              >
                <SelectTrigger id="department">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
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
                  'Update Calendar'
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
                Leave Calendar
              </CardTitle>
              <CardDescription>
                {months.find((m) => m.value === month.toString())?.label} {year}
                {departmentId
                  ? ` - ${departments.find((d) => d.id === departmentId)?.name}`
                  : ' - All Departments'}
              </CardDescription>
            </div>
            {data.length > 0 && (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('csv')}
                  className="cursor-pointer"
                >
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('excel')}
                  className="cursor-pointer"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Excel
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
          ) : data.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center">
              <CalendarIcon className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="text-lg font-semibold">No leaves scheduled</h3>
              <p className="text-muted-foreground text-sm">
                There are no approved leaves for the selected period
              </p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{data.length}</div>
                    <p className="text-muted-foreground text-sm">
                      {data.length === 1 ? 'Employee' : 'Employees'} on leave this month
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Leave Events List */}
              <div className="space-y-4">
                {data.map((event, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={event.profilePicture} />
                            <AvatarFallback>
                              {event.firstName.charAt(0)}
                              {event.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <p className="leading-none font-medium">
                              {event.firstName} {event.lastName}
                            </p>
                            <p className="text-muted-foreground text-sm">{event.department}</p>
                            <div className="flex items-center gap-2 text-sm">
                              <CalendarIcon className="h-3 w-3" />
                              <span>
                                {formatDate(event.startDate)} - {formatDate(event.endDate)}
                              </span>
                              <span className="text-muted-foreground">
                                ({calculateDuration(event.startDate, event.endDate)}{' '}
                                {calculateDuration(event.startDate, event.endDate) === 1
                                  ? 'day'
                                  : 'days'}
                                )
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge
                          style={{
                            backgroundColor: event.color || '#6B7280',
                            color: '#FFFFFF',
                          }}
                        >
                          {event.leaveType}
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
