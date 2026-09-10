import { apiClient } from './client';
import { storage } from '../storage';
import type {
  LeaveByDepartmentReport,
  LeaveByEmployeeReport,
  LeaveByTypeReport,
  LeaveCalendarEvent,
  ReportFilters,
} from '@/types';

export const reportsApi = {
  /**
   * Get leave by department report
   */
  async getLeaveByDepartment(filters?: { year?: number; month?: number }) {
    const params = new URLSearchParams();
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.month) params.append('month', filters.month.toString());

    const queryString = params.toString();
    const url = `/reports/leave-by-department${queryString ? `?${queryString}` : ''}`;

    return apiClient.get<LeaveByDepartmentReport[]>(url);
  },

  /**
   * Get leave by employee report
   */
  async getLeaveByEmployee(employeeId: string, year?: number) {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());

    const queryString = params.toString();
    const url = `/reports/leave-by-employee/${employeeId}${queryString ? `?${queryString}` : ''}`;

    return apiClient.get<LeaveByEmployeeReport>(url);
  },

  /**
   * Get leave by type report
   */
  async getLeaveByType(year?: number) {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());

    const queryString = params.toString();
    const url = `/reports/leave-by-type${queryString ? `?${queryString}` : ''}`;

    return apiClient.get<LeaveByTypeReport[]>(url);
  },

  /**
   * Get leave calendar data
   */
  async getLeaveCalendar(filters?: { departmentId?: string; month?: number; year?: number }) {
    const params = new URLSearchParams();
    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    if (filters?.month) params.append('month', filters.month.toString());
    if (filters?.year) params.append('year', filters.year.toString());

    const queryString = params.toString();
    const url = `/reports/leave-calendar${queryString ? `?${queryString}` : ''}`;

    return apiClient.get<LeaveCalendarEvent[]>(url);
  },

  /**
   * Export report to CSV
   */
  async exportToCsv(filters: ReportFilters) {
    const params = new URLSearchParams();
    if (filters.reportType) params.append('reportType', filters.reportType);
    if (filters.departmentId) params.append('departmentId', filters.departmentId);
    if (filters.year) params.append('year', filters.year.toString());
    if (filters.month) params.append('month', filters.month.toString());

    const queryString = params.toString();
    const url = `/reports/export/csv${queryString ? `?${queryString}` : ''}`;

    // Get token from storage
    const token = storage.getToken();

    // Return the URL with token for download
    return `${process.env.NEXT_PUBLIC_API_URL}${url}${queryString ? '&' : '?'}token=${token}`;
  },

  /**
   * Export report to Excel
   */
  async exportToExcel(filters: ReportFilters) {
    const params = new URLSearchParams();
    if (filters.reportType) params.append('reportType', filters.reportType);
    if (filters.departmentId) params.append('departmentId', filters.departmentId);
    if (filters.year) params.append('year', filters.year.toString());
    if (filters.month) params.append('month', filters.month.toString());

    const queryString = params.toString();
    const url = `/reports/export/excel${queryString ? `?${queryString}` : ''}`;

    // Get token from storage
    const token = storage.getToken();

    // Return the URL with token for download
    return `${process.env.NEXT_PUBLIC_API_URL}${url}${queryString ? '&' : '?'}token=${token}`;
  },
};
