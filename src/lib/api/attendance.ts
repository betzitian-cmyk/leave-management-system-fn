import { apiClient } from './client';
import type {
  ApiResponse,
  Attendance,
  CreateAttendanceRequest,
  UpdateAttendanceRequest,
  AttendanceSummary,
  FingerprintEnrollmentResponse,
  FingerprintStatus,
  FingerprintDeviceInfo,
  FingerprintKioskResponse,
} from '@/types';

export const attendanceApi = {
  // Get all attendance records with filters
  getAttendances: async (params?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Attendance[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.employeeId) queryParams.append('employeeId', params.employeeId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    return apiClient.get<ApiResponse<Attendance[]>>(
      `/attendance${queryString ? `?${queryString}` : ''}`
    );
  },

  // Get attendance by ID (fetches from list and filters)
  getAttendanceById: async (id: string): Promise<ApiResponse<Attendance>> => {
    // Since backend doesn't have a getById endpoint, we'll fetch all and filter
    // In a real scenario, you'd want to add a GET /api/attendance/:id endpoint
    const response = await apiClient.get<ApiResponse<Attendance[]>>('/attendance');
    if (response.success && response.data) {
      const attendance = response.data.find((a) => a.id === id);
      if (attendance) {
        return {
          success: true,
          data: attendance,
        };
      }
      throw new Error('Attendance not found');
    }
    throw new Error('Failed to fetch attendance');
  },

  // Create attendance record
  createAttendance: async (data: CreateAttendanceRequest): Promise<ApiResponse<Attendance>> => {
    return apiClient.post<ApiResponse<Attendance>>('/attendance', data);
  },

  // Update attendance record
  updateAttendance: async (
    id: string,
    data: UpdateAttendanceRequest
  ): Promise<ApiResponse<Attendance>> => {
    return apiClient.put<ApiResponse<Attendance>>(`/attendance/${id}`, data);
  },

  // Get attendance summary for an employee
  getAttendanceSummary: async (employeeId: string): Promise<ApiResponse<AttendanceSummary>> => {
    return apiClient.get<ApiResponse<AttendanceSummary>>(`/attendance/summary/${employeeId}`);
  },

  // Mark attendance using fingerprint (kiosk mode - auto-identify employee)
  markAttendanceByFingerprint: async (): Promise<ApiResponse<FingerprintKioskResponse>> => {
    return apiClient.post<ApiResponse<FingerprintKioskResponse>>(
      '/attendance/fingerprint-kiosk',
      {}
    );
  },

  // Mark attendance with fingerprint (manual - requires employee ID)
  markAttendanceWithFingerprint: async (
    data: CreateAttendanceRequest
  ): Promise<ApiResponse<Attendance>> => {
    return apiClient.post<ApiResponse<Attendance>>('/attendance/fingerprint', data);
  },

  // Enroll employee fingerprint
  enrollFingerprint: async (
    employeeId: string
  ): Promise<ApiResponse<FingerprintEnrollmentResponse>> => {
    return apiClient.post<ApiResponse<FingerprintEnrollmentResponse>>(
      `/attendance/fingerprint/enroll/${employeeId}`,
      {}
    );
  },

  // Update employee fingerprint
  updateFingerprint: async (
    employeeId: string
  ): Promise<ApiResponse<FingerprintEnrollmentResponse>> => {
    return apiClient.put<ApiResponse<FingerprintEnrollmentResponse>>(
      `/attendance/fingerprint/update/${employeeId}`,
      {}
    );
  },

  // Remove employee fingerprint
  removeFingerprint: async (employeeId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<ApiResponse<{ message: string }>>(
      `/attendance/fingerprint/remove/${employeeId}`
    );
  },

  // Get fingerprint enrollment status
  getFingerprintStatus: async (employeeId?: string): Promise<ApiResponse<FingerprintStatus[]>> => {
    const queryParams = employeeId ? `?employeeId=${employeeId}` : '';
    return apiClient.get<ApiResponse<FingerprintStatus[]>>(
      `/attendance/fingerprint/status${queryParams}`
    );
  },

  // Get fingerprint device info
  getFingerprintDevices: async (): Promise<ApiResponse<FingerprintDeviceInfo[]>> => {
    return apiClient.get<ApiResponse<FingerprintDeviceInfo[]>>('/attendance/fingerprint/devices');
  },
};
