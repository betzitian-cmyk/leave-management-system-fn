'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  Loader2,
  Mail,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { notificationsApi } from '@/lib/api/notifications';
import { useNotifications } from '@/lib/socket-context';
import type { Notification, NotificationType, NotificationPreferences } from '@/types';
import { toast } from 'sonner';

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  LEAVE_SUBMITTED: <FileText className="h-5 w-5" />,
  LEAVE_APPROVED: <CheckCircle className="h-5 w-5" />,
  LEAVE_REJECTED: <XCircle className="h-5 w-5" />,
  LEAVE_REMINDER: <Clock className="h-5 w-5" />,
  APPROVAL_PENDING: <AlertCircle className="h-5 w-5" />,
  LEAVE_CANCELLED: <XCircle className="h-5 w-5" />,
};

const notificationColors: Record<NotificationType, string> = {
  LEAVE_SUBMITTED: 'text-blue-600 bg-blue-50',
  LEAVE_APPROVED: 'text-green-600 bg-green-50',
  LEAVE_REJECTED: 'text-red-600 bg-red-50',
  LEAVE_REMINDER: 'text-yellow-600 bg-yellow-50',
  APPROVAL_PENDING: 'text-orange-600 bg-orange-50',
  LEAVE_CANCELLED: 'text-gray-600 bg-gray-50',
};

export default function HRNotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showPreferencesDialog, setShowPreferencesDialog] = useState(false);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    leaveApprovals: true,
    leaveRejections: true,
    leaveReminders: true,
    systemUpdates: true,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await notificationsApi.getNotifications(currentPage, limit, showUnreadOnly);

      if (response.success && response.data) {
        setNotifications(response.data);
        setTotal(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [currentPage, showUnreadOnly]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Listen for real-time notifications
  useNotifications(() => {
    // Refresh notifications when a new one arrives
    fetchNotifications();
  });

  const fetchPreferences = async () => {
    try {
      setLoadingPreferences(true);
      const response = await notificationsApi.getPreferences();

      if (response.success && response.data) {
        setPreferences(response.data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast.error('Failed to fetch notification preferences');
    } finally {
      setLoadingPreferences(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await notificationsApi.markAsRead(notificationId);

      if (response.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        toast.success('Notification marked as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await notificationsApi.markAllAsRead();

      if (response.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const response = await notificationsApi.deleteNotification(notificationId);

      if (response.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        toast.success('Notification deleted');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleOpenPreferences = async () => {
    setShowPreferencesDialog(true);
    await fetchPreferences();
  };

  const handleSavePreferences = async () => {
    try {
      setSavingPreferences(true);
      const response = await notificationsApi.updatePreferences(preferences);

      if (response.success) {
        toast.success('Preferences updated successfully');
        setShowPreferencesDialog(false);
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    } finally {
      setSavingPreferences(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">Stay updated with your activities</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className="cursor-pointer"
          >
            {showUnreadOnly ? (
              <>
                <Bell className="mr-2 h-4 w-4" />
                Show All
              </>
            ) : (
              <>
                <BellOff className="mr-2 h-4 w-4" />
                Unread Only
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="cursor-pointer"
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All Read
          </Button>
          <Button variant="outline" onClick={handleOpenPreferences} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Preferences
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            <Bell className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-muted-foreground text-xs">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Mail className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadCount}</div>
            <p className="text-muted-foreground text-xs">Pending attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Read</CardTitle>
            <CheckCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length - unreadCount}</div>
            <p className="text-muted-foreground text-xs">Viewed notifications</p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>{showUnreadOnly ? 'Unread Notifications' : 'All Notifications'}</CardTitle>
          <CardDescription>
            {showUnreadOnly
              ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : `Showing ${notifications.length} of ${total} notifications`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center">
              <Bell className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="text-lg font-semibold">No notifications</h3>
              <p className="text-muted-foreground text-sm">
                {showUnreadOnly
                  ? "You're all caught up!"
                  : "You haven't received any notifications yet"}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border-border flex items-start justify-between gap-4 rounded-lg border p-4 transition-colors ${
                      !notification.read ? 'bg-muted/50' : 'bg-background'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          notificationColors[notification.type]
                        }`}
                      >
                        {notificationIcons[notification.type]}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{notification.title}</p>
                          {!notification.read && (
                            <Badge variant="default" className="h-5 text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm">{notification.message}</p>
                        <p className="text-muted-foreground text-xs">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="h-8 w-8 cursor-pointer p-0"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="text-destructive hover:text-destructive h-8 w-8 cursor-pointer p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-muted-foreground text-sm">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || loading}
                      className="cursor-pointer"
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || loading}
                      className="cursor-pointer"
                    >
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Preferences Dialog */}
      <Dialog open={showPreferencesDialog} onOpenChange={setShowPreferencesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notification Preferences</DialogTitle>
            <DialogDescription>Manage how you receive notifications</DialogDescription>
          </DialogHeader>
          {loadingPreferences ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-muted-foreground text-xs">Receive notifications via email</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="leaveApprovals">Leave Approvals</Label>
                  <p className="text-muted-foreground text-xs">
                    Notify when your leave is approved
                  </p>
                </div>
                <Switch
                  id="leaveApprovals"
                  checked={preferences.leaveApprovals}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, leaveApprovals: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="leaveRejections">Leave Rejections</Label>
                  <p className="text-muted-foreground text-xs">
                    Notify when your leave is rejected
                  </p>
                </div>
                <Switch
                  id="leaveRejections"
                  checked={preferences.leaveRejections}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, leaveRejections: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="leaveReminders">Leave Reminders</Label>
                  <p className="text-muted-foreground text-xs">
                    Receive reminders about upcoming leaves
                  </p>
                </div>
                <Switch
                  id="leaveReminders"
                  checked={preferences.leaveReminders}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, leaveReminders: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="systemUpdates">System Updates</Label>
                  <p className="text-muted-foreground text-xs">
                    Notify about system updates and news
                  </p>
                </div>
                <Switch
                  id="systemUpdates"
                  checked={preferences.systemUpdates}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, systemUpdates: checked }))
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPreferencesDialog(false)}
              disabled={savingPreferences}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePreferences}
              disabled={savingPreferences}
              className="cursor-pointer"
            >
              {savingPreferences ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Preferences'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
