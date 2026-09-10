import { apiClient } from './client';
import type { AuditLog } from '@/types';

export const auditApi = {
  /**
   * Get recent security events
   */
  async getSecurityEvents(limit?: number) {
    const url = `/audit/security-events${limit ? `?limit=${limit}` : ''}`;
    return apiClient.get<{ success: boolean; data: AuditLog[]; count: number }>(url);
  },

  /**
   * Clean up old audit logs
   */
  async cleanupOldLogs(retentionDays: number = 90) {
    return apiClient.post<{ success: boolean; message: string; deletedCount: number }>(
      '/audit/cleanup',
      { retentionDays }
    );
  },
};
