'use client';

import { useState, useEffect } from 'react';
import { leaveBalanceApi } from '@/lib/api/leaveBalance';
import type { LeaveBalance } from '@/types';
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
import { Calendar, Loader2, TrendingUp, FileText, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function EmployeeLeaveBalancePage() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const response = await leaveBalanceApi.getMyLeaveBalances();
      // Handle both direct array response and wrapped ApiResponse
      if (Array.isArray(response)) {
        setBalances(response);
      } else if (response.success && response.data) {
        setBalances(response.data);
      }
    } catch (err) {
      console.error('Error fetching leave balances:', err);
      toast.error('Failed to fetch leave balances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  const formatNumber = (num: number): string => {
    return Number(num).toFixed(2);
  };

  const getBalanceColor = (available: number, allocated: number): string => {
    const percentage = (available / allocated) * 100;
    if (percentage >= 75) return 'text-green-600 dark:text-green-400';
    if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
    if (percentage >= 25) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getBalanceVariant = (
    available: number,
    allocated: number
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const percentage = (available / allocated) * 100;
    if (percentage >= 75) return 'default';
    if (percentage >= 50) return 'outline';
    if (percentage >= 25) return 'secondary';
    return 'destructive';
  };

  const totalStats = balances.reduce(
    (acc, balance) => {
      const allocated =
        Number(balance.allocated) + Number(balance.carryOver) + Number(balance.adjustment || 0);
      const used = Number(balance.used);
      const pending = Number(balance.pending);
      const available = Number(balance.available);

      return {
        totalAllocated: acc.totalAllocated + allocated,
        totalUsed: acc.totalUsed + used,
        totalPending: acc.totalPending + pending,
        totalAvailable: acc.totalAvailable + available,
      };
    },
    { totalAllocated: 0, totalUsed: 0, totalPending: 0, totalAvailable: 0 }
  );

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leave Balance</h1>
          <p className="text-muted-foreground mt-1">View your leave balance for {currentYear}</p>
        </div>
        <Badge variant="outline" className="text-base">
          Year: {currentYear}
        </Badge>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Allocated</CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalStats.totalAllocated)}</div>
            <p className="text-muted-foreground text-xs">Days allocated this year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Used</CardTitle>
            <CheckCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalStats.totalUsed)}</div>
            <p className="text-muted-foreground text-xs">Days used</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalStats.totalPending)}</div>
            <p className="text-muted-foreground text-xs">Days pending approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getBalanceColor(totalStats.totalAvailable, totalStats.totalAllocated || 1)}`}
            >
              {formatNumber(totalStats.totalAvailable)}
            </div>
            <p className="text-muted-foreground text-xs">Days remaining</p>
          </CardContent>
        </Card>
      </div>

      {/* Leave Balances Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Balances by Type</CardTitle>
          <CardDescription>
            Detailed breakdown of your leave balance for each leave type
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
          ) : balances.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center">
              <Calendar className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="text-lg font-semibold">No leave balances found</h3>
              <p className="text-muted-foreground text-sm">
                Your leave balances will appear here once they are allocated
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
                        <TableHead>Leave Type</TableHead>
                        <TableHead className="text-right">Allocated</TableHead>
                        <TableHead className="text-right">Carry Over</TableHead>
                        <TableHead className="text-right">Adjustment</TableHead>
                        <TableHead className="text-right">Used</TableHead>
                        <TableHead className="text-right">Pending</TableHead>
                        <TableHead className="text-right">Available</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {balances.map((balance) => {
                        const allocated = Number(balance.allocated);
                        const carryOver = Number(balance.carryOver);
                        const adjustment = Number(balance.adjustment || 0);
                        const totalAllocated = allocated + carryOver + adjustment;
                        const used = Number(balance.used);
                        const pending = Number(balance.pending);
                        const available = Number(balance.available);

                        return (
                          <TableRow key={balance.id}>
                            <TableCell>
                              <div className="space-y-1">
                                <Badge variant="outline">{balance.leaveType.name}</Badge>
                                {balance.leaveType.description && (
                                  <p className="text-muted-foreground text-xs">
                                    {balance.leaveType.description}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-medium">{formatNumber(allocated)}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              {carryOver > 0 ? (
                                <span className="font-medium text-green-600 dark:text-green-400">
                                  +{formatNumber(carryOver)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">0.00</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {adjustment !== 0 ? (
                                <span
                                  className={`font-medium ${
                                    adjustment > 0
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-red-600 dark:text-red-400'
                                  }`}
                                >
                                  {adjustment > 0 ? '+' : ''}
                                  {formatNumber(adjustment)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">0.00</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-medium">{formatNumber(used)}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-medium">{formatNumber(pending)}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant={getBalanceVariant(available, totalAllocated || 1)}
                                className="font-semibold"
                              >
                                {formatNumber(available)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="space-y-4 md:hidden">
                {balances.map((balance) => {
                  const allocated = Number(balance.allocated);
                  const carryOver = Number(balance.carryOver);
                  const adjustment = Number(balance.adjustment || 0);
                  const totalAllocated = allocated + carryOver + adjustment;
                  const used = Number(balance.used);
                  const pending = Number(balance.pending);
                  const available = Number(balance.available);

                  return (
                    <Card key={balance.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            <Badge variant="outline">{balance.leaveType.name}</Badge>
                          </CardTitle>
                          <Badge
                            variant={getBalanceVariant(available, totalAllocated || 1)}
                            className="text-base font-semibold"
                          >
                            {formatNumber(available)} available
                          </Badge>
                        </div>
                        {balance.leaveType.description && (
                          <CardDescription>{balance.leaveType.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Allocated:</span>
                              <p className="font-medium">{formatNumber(allocated)}</p>
                            </div>
                            {carryOver > 0 && (
                              <div>
                                <span className="text-muted-foreground">Carry Over:</span>
                                <p className="font-medium text-green-600 dark:text-green-400">
                                  +{formatNumber(carryOver)}
                                </p>
                              </div>
                            )}
                            {adjustment !== 0 && (
                              <div>
                                <span className="text-muted-foreground">Adjustment:</span>
                                <p
                                  className={`font-medium ${
                                    adjustment > 0
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-red-600 dark:text-red-400'
                                  }`}
                                >
                                  {adjustment > 0 ? '+' : ''}
                                  {formatNumber(adjustment)}
                                </p>
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground">Used:</span>
                              <p className="font-medium">{formatNumber(used)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Pending:</span>
                              <p className="font-medium">{formatNumber(pending)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Available:</span>
                              <p
                                className={`font-semibold ${getBalanceColor(available, totalAllocated || 1)}`}
                              >
                                {formatNumber(available)}
                              </p>
                            </div>
                          </div>
                          {balance.adjustmentReason && (
                            <div className="border-t pt-3">
                              <p className="text-muted-foreground text-xs">
                                <strong>Adjustment Note:</strong> {balance.adjustmentReason}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                How Leave Balance Works
              </p>
              <ul className="list-inside list-disc space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <li>
                  <strong>Allocated:</strong> Days allocated for this leave type in {currentYear}
                </li>
                <li>
                  <strong>Carry Over:</strong> Days carried over from the previous year
                </li>
                <li>
                  <strong>Adjustment:</strong> Manual adjustments made by administrators
                </li>
                <li>
                  <strong>Used:</strong> Days already taken and approved
                </li>
                <li>
                  <strong>Pending:</strong> Days requested but awaiting approval
                </li>
                <li>
                  <strong>Available:</strong> Remaining days you can request (Allocated + Carry Over
                  + Adjustment - Used - Pending)
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
