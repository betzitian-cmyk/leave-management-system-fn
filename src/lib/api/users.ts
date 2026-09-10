import { apiClient } from './client';
import type {
  ApiResponse,
  UserListItem,
  UpdateUserRoleRequest,
  UpdateUserStatusRequest,
} from '@/types';

export const usersApi = {
  // Get all users
  getAllUsers: async (): Promise<ApiResponse<UserListItem[]>> => {
    return apiClient.get<ApiResponse<UserListItem[]>>('/auth/users');
  },

  // Update user role
  updateUserRole: async (userId: string, data: UpdateUserRoleRequest): Promise<ApiResponse> => {
    return apiClient.put<ApiResponse>(`/auth/users/${userId}/roles`, data);
  },

  // Update user status
  updateUserStatus: async (userId: string, data: UpdateUserStatusRequest): Promise<ApiResponse> => {
    return apiClient.put<ApiResponse>(`/auth/users/${userId}/status`, data);
  },

  // Delete user
  deleteUser: async (userId: string): Promise<ApiResponse> => {
    return apiClient.delete<ApiResponse>(`/auth/users/${userId}`);
  },
};
