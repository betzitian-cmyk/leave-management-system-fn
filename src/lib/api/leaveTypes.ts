import { apiClient } from './client';
import type {
  ApiResponse,
  LeaveType,
  CreateLeaveTypeRequest,
  UpdateLeaveTypeRequest,
} from '@/types';

export const leaveTypesApi = {
  // Get all leave types
  getAllLeaveTypes: async (): Promise<ApiResponse<LeaveType[]>> => {
    return apiClient.get<ApiResponse<LeaveType[]>>('/leave-types');
  },

  // Get leave type by ID
  getLeaveTypeById: async (id: string): Promise<ApiResponse<LeaveType>> => {
    return apiClient.get<ApiResponse<LeaveType>>(`/leave-types/${id}`);
  },

  // Create leave type
  createLeaveType: async (data: CreateLeaveTypeRequest): Promise<ApiResponse<LeaveType>> => {
    return apiClient.post<ApiResponse<LeaveType>>('/leave-types', data);
  },

  // Update leave type
  updateLeaveType: async (
    id: string,
    data: UpdateLeaveTypeRequest
  ): Promise<ApiResponse<LeaveType>> => {
    return apiClient.put<ApiResponse<LeaveType>>(`/leave-types/${id}`, data);
  },

  // Delete (deactivate) leave type
  deleteLeaveType: async (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete<ApiResponse<null>>(`/leave-types/${id}`);
  },
};
