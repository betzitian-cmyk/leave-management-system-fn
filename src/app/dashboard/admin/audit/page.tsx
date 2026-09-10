'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Shield,
  Search,
  RefreshCw,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  Loader2,
  User,
} from 'lucide-react';
import { auditApi } from '@/lib/api/audit';
import type { AuditLog, AuditAction } from '@/types';
import { toast } from 'sonner';

const actionLabels: Record<AuditAction, string> = {
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  LOGIN_FAILED: 'Login Failed',
  ROLE_CHANGE: 'Role Change',
  USER_STATUS_CHANGE: 'User Status Change',
  LEAVE_APPROVED: 'Leave Approved',
  LEAVE_REJECTED: 'Leave Rejected',
  PASSWORD_CHANGE: 'Password Change',
  PASSWORD_RESET: 'Password Reset',
  CRITICAL_UPDATE: 'Critical Update',
};

const actionIcons: Record<AuditAction, React.ReactNode> = {
  LOGIN: <CheckCircle className="h-4 w-4" />,
  LOGOUT: <CheckCircle className="h-4 w-4" />,
  LOGIN_FAILED: <XCircle className="h-4 w-4" />,
  ROLE_CHANGE: <AlertCircle className="h-4 w-4" />,
  USER_STATUS_CHANGE: <AlertCircle className="h-4 w-4" />,
  LEAVE_APPROVED: <CheckCircle className="h-4 w-4" />,
  LEAVE_REJECTED: <XCircle className="h-4 w-4" />,
  PASSWORD_CHANGE: <Shield className="h-4 w-4" />,
  PASSWORD_RESET: <Shield className="h-4 w-4" />,
  CRITICAL_UPDATE: <AlertCircle className="h-4 w-4" />,
};

const getActionVariant = (action: AuditAction): 'default' | 'destructive' | 'outline' => {
  if (
    action === 'LOGIN' ||
    action === 'LOGOUT' ||
    action === 'LEAVE_APPROVED' ||
    action === 'PASSWORD_CHANGE'
  ) {
    return 'outline';
  }
  if (action === 'LOGIN_FAILED' || action === 'LEAVE_REJECTED') {
    return 'destructive';
  }
  return 'default';
};

export default function AuditPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [retentionDays, setRetentionDays] = useState(90);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterEntityType, setFilterEntityType] = useState<string>('all');

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, searchTerm, filterAction, filterEntityType]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await auditApi.getSecurityEvents(500);

      if (response.success && response.data) {
        setLogs(response.data);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.userId?.toLowerCase().includes(lowerSearch) ||
          log.description?.toLowerCase().includes(lowerSearch) ||
          log.entityId?.toLowerCase().includes(lowerSearch) ||
          log.ipAddress?.toLowerCase().includes(lowerSearch)
      );
    }

    // Action filter
    if (filterAction !== 'all') {
      filtered = filtered.filter((log) => log.action === filterAction);
    }

    // Entity type filter
    if (filterEntityType !== 'all') {
      filtered = filtered.filter((log) => log.entityType === filterEntityType);
    }

    setFilteredLogs(filtered);
  };

  const handleCleanup = async () => {
    try {
      setCleaningUp(true);
      const response = await auditApi.cleanupOldLogs(retentionDays);

      if (response.success) {
        toast.success(response.message);
        setShowCleanupDialog(false);
        fetchAuditLogs();
      }
    } catch (error) {
      console.error('Error cleaning up logs:', error);
      toast.error('Failed to cleanup old logs');
    } finally {
      setCleaningUp(false);
    }
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Calculate statistics
  const stats = {
    total: logs.length,
    loginAttempts: logs.filter((l) => l.action === 'LOGIN').length,
    failedLogins: logs.filter((l) => l.action === 'LOGIN_FAILED').length,
    criticalChanges: logs.filter(
      (l) => l.action === 'ROLE_CHANGE' || l.action === 'USER_STATUS_CHANGE'
    ).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">Monitor security events and system activities</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={fetchAuditLogs} variant="outline" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCleanupDialog(true)} variant="outline">
            <Trash2 className="mr-2 h-4 w-4" />
            Cleanup Old Logs
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-muted-foreground text-xs">All audit events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful Logins</CardTitle>
            <CheckCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.loginAttempts}</div>
            <p className="text-muted-foreground text-xs">Authentication success</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <XCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedLogins}</div>
            <p className="text-muted-foreground text-xs">Authentication failures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Changes</CardTitle>
            <AlertCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.criticalChanges}</div>
            <p className="text-muted-foreground text-xs">Role & status changes</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter audit logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="User ID, description, IP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger id="action">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {Object.entries(actionLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entityType">Entity Type</Label>
              <Select value={filterEntityType} onValueChange={setFilterEntityType}>
                <SelectTrigger id="entityType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="LeaveRequest">Leave Request</SelectItem>
                  <SelectItem value="System">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setFilterAction('all');
                  setFilterEntityType('all');
                }}
                variant="outline"
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Security Events</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {logs.length} events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center">
              <Shield className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="text-lg font-semibold">No audit logs found</h3>
              <p className="text-muted-foreground text-sm">
                {logs.length === 0
                  ? 'No events have been logged yet'
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
                        <TableHead className="w-[140px]">Timestamp</TableHead>
                        <TableHead className="w-[160px]">Action</TableHead>
                        <TableHead className="w-[100px]">Entity</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[80px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs">
                            {new Date(log.timestamp).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getActionVariant(log.action)}
                              className="flex w-fit items-center gap-1"
                            >
                              {actionIcons[log.action]}
                              <span className="text-xs">{actionLabels[log.action]}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {log.entityType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="max-w-md truncate text-sm">{log.description}</p>
                              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                <User className="h-3 w-3" />
                                <span className="font-mono">{log.userId.slice(0, 8)}...</span>
                                {log.ipAddress && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono">{log.ipAddress}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(log)}
                              className="h-8 w-8 cursor-pointer p-0"
                            >
                              <Eye className="h-4 w-4" />
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
                {filteredLogs.map((log) => (
                  <Card key={log.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <Badge
                            variant={getActionVariant(log.action)}
                            className="flex w-fit items-center gap-1"
                          >
                            {actionIcons[log.action]}
                            {actionLabels[log.action]}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(log)}
                            className="-mt-2 cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Timestamp:</span>
                            <span className="font-medium">{formatDate(log.timestamp)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Entity:</span>
                            <Badge variant="outline">{log.entityType}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">User ID:</span>
                            <span className="font-mono text-xs">{log.userId}</span>
                          </div>
                          {log.ipAddress && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">IP Address:</span>
                              <span className="font-mono text-xs">{log.ipAddress}</span>
                            </div>
                          )}
                          {log.description && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Description:</span>
                              <p className="mt-1 text-sm">{log.description}</p>
                            </div>
                          )}
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

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>Detailed information about this security event</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Timestamp</Label>
                  <p className="font-medium">{formatDate(selectedLog.timestamp)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Action</Label>
                  <Badge variant={getActionVariant(selectedLog.action)} className="w-fit">
                    {actionLabels[selectedLog.action]}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Entity Type</Label>
                  <Badge variant="outline" className="w-fit">
                    {selectedLog.entityType}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Entity ID</Label>
                  <p className="font-mono text-sm">{selectedLog.entityId || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">User ID</Label>
                  <p className="font-mono text-sm">{selectedLog.userId}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">IP Address</Label>
                  <p className="font-mono text-sm">{selectedLog.ipAddress || '-'}</p>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Description</Label>
                <p className="text-sm">{selectedLog.description || '-'}</p>
              </div>

              {selectedLog.userAgent && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">User Agent</Label>
                  <p className="text-sm">{selectedLog.userAgent}</p>
                </div>
              )}

              {selectedLog.oldValues && Object.keys(selectedLog.oldValues).length > 0 && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Old Values</Label>
                  <pre className="bg-muted rounded-md p-2 text-xs">
                    {JSON.stringify(selectedLog.oldValues, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newValues && Object.keys(selectedLog.newValues).length > 0 && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">New Values</Label>
                  <pre className="bg-muted rounded-md p-2 text-xs">
                    {JSON.stringify(selectedLog.newValues, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cleanup Dialog */}
      <Dialog open={showCleanupDialog} onOpenChange={setShowCleanupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cleanup Old Audit Logs</DialogTitle>
            <DialogDescription>
              Delete audit logs older than the specified retention period
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="retentionDays">Retention Period (days)</Label>
              <Input
                id="retentionDays"
                type="number"
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                min="1"
                max="365"
              />
              <p className="text-muted-foreground text-xs">
                Logs older than {retentionDays} days will be permanently deleted
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCleanupDialog(false)}
                disabled={cleaningUp}
              >
                Cancel
              </Button>
              <Button onClick={handleCleanup} disabled={cleaningUp} variant="destructive">
                {cleaningUp ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cleaning...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Cleanup Logs
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
