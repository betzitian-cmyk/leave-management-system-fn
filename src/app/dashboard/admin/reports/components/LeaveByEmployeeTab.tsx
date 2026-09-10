'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Loader2, User, Search } from 'lucide-react';
import { reportsApi } from '@/lib/api/reports';
import { employeesApi } from '@/lib/api/employees';
import type { LeaveByEmployeeReport, Employee } from '@/types';
import { toast } from 'sonner';

export default function LeaveByEmployeeTab() {
  const [loading, setLoading] = useState(false);
  const [fetchingEmployees, setFetchingEmployees] = useState(true);
  const [data, setData] = useState<LeaveByEmployeeReport | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedEmployeeId) {
      fetchReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, selectedEmployeeId]);

  const fetchEmployees = async () => {
    try {
      setFetchingEmployees(true);
      const response = await employeesApi.getAllEmployees();

      let employeeData: Employee[] = [];
      if ('success' in response && 'data' in response && response.success && response.data) {
        const responseData = response.data as Employee[] | { data: Employee[] };
        if (Array.isArray(responseData)) {
          employeeData = responseData;
        } else if ('data' in responseData && Array.isArray(responseData.data)) {
          employeeData = responseData.data;
        }
      }

      setEmployees(employeeData);
      if (employeeData.length > 0 && !selectedEmployeeId) {
        setSelectedEmployeeId(employeeData[0].id);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    } finally {
      setFetchingEmployees(false);
    }
  };

  const fetchReport = async () => {
    if (!selectedEmployeeId) return;

    try {
      setLoading(true);
      const response = await reportsApi.getLeaveByEmployee(selectedEmployeeId, year);

      let reportData: LeaveByEmployeeReport | null = null;
      if ('employee' in response && 'leaveData' in response) {
        reportData = response as LeaveByEmployeeReport;
      } else if ('success' in response && 'data' in response) {
        reportData = (response as { success: boolean; data: LeaveByEmployeeReport }).data;
      }

      setData(reportData);
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const url =
        format === 'csv'
          ? await reportsApi.exportToCsv({
              reportType: 'EMPLOYEE',
              year,
              employeeId: selectedEmployeeId,
            })
          : await reportsApi.exportToExcel({
              reportType: 'EMPLOYEE',
              year,
              employeeId: selectedEmployeeId,
            });

      window.open(url, '_blank');
      toast.success(`Report exported successfully`);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const totalDays = data?.leaveData.reduce((sum, item) => sum + Number(item.totalDays), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Select employee and year for the report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="employee">Employee</Label>
              <Select
                value={selectedEmployeeId}
                onValueChange={setSelectedEmployeeId}
                disabled={fetchingEmployees}
              >
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.user.firstName} {employee.user.lastName} - {employee.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            <div className="flex items-end">
              <Button
                onClick={fetchReport}
                disabled={loading || !selectedEmployeeId}
                className="cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Data */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Leave Statistics for{' '}
                {data?.employee
                  ? `${data.employee.firstName} ${data.employee.lastName}`
                  : 'Employee'}
              </CardTitle>
              <CardDescription>Year {year}</CardDescription>
            </div>
            {data && (
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
          ) : !data || data.leaveData.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center">
              <User className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="text-lg font-semibold">No data available</h3>
              <p className="text-muted-foreground text-sm">
                {!selectedEmployeeId
                  ? 'Please select an employee'
                  : 'This employee has no leave records for the selected year'}
              </p>
            </div>
          ) : (
            <>
              {/* Summary Card */}
              <div className="mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="text-2xl font-bold">{data.leaveData.length}</div>
                        <p className="text-muted-foreground text-sm">Different Leave Types</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{totalDays.toFixed(1)}</div>
                        <p className="text-muted-foreground text-sm">Total Leave Days</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Leave Type</TableHead>
                      <TableHead className="text-right">Total Days</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.leaveData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.leaveType}</TableCell>
                        <TableCell className="text-right">
                          {Number(item.totalDays).toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right">
                          {((Number(item.totalDays) / totalDays) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
