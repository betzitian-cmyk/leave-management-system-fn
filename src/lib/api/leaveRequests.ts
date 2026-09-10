import { apiClient } from './client';
import type {
  ApiResponse,
  LeaveRequest,
  CreateLeaveRequestRequest,
  UpdateLeaveRequestRequest,
  ApproveLeaveRequest,
  RejectLeaveRequest,
  CancelLeaveRequest,
} from '@/types';

export const leaveRequestsApi = {
  // Get all leave requests (Admin/HR/Manager)
  getAllLeaveRequests: async (): Promise<ApiResponse<LeaveRequest[]>> => {
    return apiClient.get<ApiResponse<LeaveRequest[]>>('/leave-requests');
  },

  // Get my leave requests
  getMyLeaveRequests: async (): Promise<ApiResponse<LeaveRequest[]>> => {
    return apiClient.get<ApiResponse<LeaveRequest[]>>('/leave-requests/my-leaves');
  },

  // Get team leave requests (Manager only)
  getTeamLeaveRequests: async (): Promise<ApiResponse<LeaveRequest[]>> => {
    return apiClient.get<ApiResponse<LeaveRequest[]>>('/leave-requests/team');
  },

  // Get leave request by ID
  getLeaveRequestById: async (id: string): Promise<ApiResponse<LeaveRequest>> => {
    return apiClient.get<ApiResponse<LeaveRequest>>(`/leave-requests/${id}`);
  },

  // Create leave request
  createLeaveRequest: async (
    data: CreateLeaveRequestRequest
  ): Promise<ApiResponse<LeaveRequest>> => {
    return apiClient.post<ApiResponse<LeaveRequest>>('/leave-requests', data);
  },

  // Update leave request
  updateLeaveRequest: async (
    id: string,
    data: UpdateLeaveRequestRequest
  ): Promise<ApiResponse<LeaveRequest>> => {
    return apiClient.put<ApiResponse<LeaveRequest>>(`/leave-requests/${id}`, data);
  },

  // Approve leave request
  approveLeaveRequest: async (
    id: string,
    data: ApproveLeaveRequest
  ): Promise<ApiResponse<LeaveRequest>> => {
    return apiClient.post<ApiResponse<LeaveRequest>>(`/leave-requests/${id}/approve`, data);
  },

  // Reject leave request
  rejectLeaveRequest: async (
    id: string,
    data: RejectLeaveRequest
  ): Promise<ApiResponse<LeaveRequest>> => {
    return apiClient.post<ApiResponse<LeaveRequest>>(`/leave-requests/${id}/reject`, data);
  },

  // Cancel leave request
  cancelLeaveRequest: async (
    id: string,
    data?: CancelLeaveRequest
  ): Promise<ApiResponse<LeaveRequest>> => {
    return apiClient.post<ApiResponse<LeaveRequest>>(`/leave-requests/${id}/cancel`, data || {});
  },
};
