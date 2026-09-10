import { apiClient } from './client';
import type { Notification, NotificationPreferences } from '@/types';

export const notificationsApi = {
  /**
   * Get user notifications with pagination
   */
  async getNotifications(page: number = 1, limit: number = 20, unreadOnly: boolean = false) {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (unreadOnly) params.append('unreadOnly', 'true');

    const queryString = params.toString();
    const url = `/notifications/my-notifications${queryString ? `?${queryString}` : ''}`;

    return apiClient.get<{
      success: boolean;
      data: Notification[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
      message: string;
    }>(url);
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    return apiClient.put<{ success: boolean; message: string }>(
      `/notifications/${notificationId}/read`,
      {}
    );
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    return apiClient.put<{ success: boolean; message: string }>('/notifications/mark-all-read', {});
  },

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string) {
    return apiClient.delete<{ success: boolean; message: string }>(
      `/notifications/${notificationId}`
    );
  },

  /**
   * Get notification preferences
   */
  async getPreferences() {
    return apiClient.get<{
      success: boolean;
      data: NotificationPreferences;
      message: string;
    }>('/notifications/preferences');
  },

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>) {
    return apiClient.put<{
      success: boolean;
      data: NotificationPreferences;
      message: string;
    }>('/notifications/preferences', preferences);
  },
};
