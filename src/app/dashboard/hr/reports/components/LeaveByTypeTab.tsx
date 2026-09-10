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
import { Download, Loader2, PieChart } from 'lucide-react';
import { reportsApi } from '@/lib/api/reports';
import type { LeaveByTypeReport } from '@/types';
import { toast } from 'sonner';

export default function LeaveByTypeTab() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LeaveByTypeReport[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await reportsApi.getLeaveByType(year);

      let reportData: LeaveByTypeReport[] = [];
      if (Array.isArray(response)) {
        reportData = response;
      } else if (
        'success' in response &&
        'data' in response &&
        Array.isArray((response as { success: boolean; data: unknown }).data)
      ) {
        reportData = (response as { success: boolean; data: LeaveByTypeReport[] }).data;
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
          ? await reportsApi.exportToCsv({ reportType: 'TYPE', year })
          : await reportsApi.exportToExcel({ reportType: 'TYPE', year });

      window.open(url, '_blank');
      toast.success(`Report exported successfully`);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const totalDays = data.reduce((sum, item) => sum + Number(item.totalDays), 0);
  const totalRequests = data.reduce((sum, item) => sum + Number(item.leaveCount), 0);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Select year for the report</CardDescription>
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

            <div className="flex items-end">
              <Button onClick={fetchReport} disabled={loading} className="cursor-pointer">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Generate Report'
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
                <PieChart className="h-5 w-5" />
                Leave Statistics by Type
              </CardTitle>
              <CardDescription>Year {year}</CardDescription>
            </div>
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
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
          ) : data.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center">
              <PieChart className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="text-lg font-semibold">No data available</h3>
              <p className="text-muted-foreground text-sm">
                There are no leave records for the selected year
              </p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="mb-6 grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{data.length}</div>
                    <p className="text-muted-foreground text-sm">Leave Types</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{totalRequests}</div>
                    <p className="text-muted-foreground text-sm">Total Leave Requests</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{totalDays.toFixed(1)}</div>
                    <p className="text-muted-foreground text-sm">Total Leave Days</p>
                  </CardContent>
                </Card>
              </div>

              {/* Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Leave Type</TableHead>
                      <TableHead className="text-right">Leave Requests</TableHead>
                      <TableHead className="text-right">Total Days</TableHead>
                      <TableHead className="text-right">Avg Days/Request</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.leaveType}</TableCell>
                        <TableCell className="text-right">{item.leaveCount}</TableCell>
                        <TableCell className="text-right">
                          {Number(item.totalDays).toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right">
                          {(Number(item.totalDays) / Number(item.leaveCount)).toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right">
                          {totalDays > 0
                            ? ((Number(item.totalDays) / totalDays) * 100).toFixed(1)
                            : '0.0'}
                          %
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
