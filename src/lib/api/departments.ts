import { apiClient } from './client';
import type {
  ApiResponse,
  Department,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
} from '@/types';

export const departmentsApi = {
  // Get all departments
  getAllDepartments: async (): Promise<ApiResponse<Department[]>> => {
    return apiClient.get<ApiResponse<Department[]>>('/departments');
  },

  // Get department by ID
  getDepartmentById: async (id: string): Promise<ApiResponse<Department>> => {
    return apiClient.get<ApiResponse<Department>>(`/departments/${id}`);
  },

  // Create department
  createDepartment: async (data: CreateDepartmentRequest): Promise<ApiResponse<Department>> => {
    return apiClient.post<ApiResponse<Department>>('/departments', data);
  },

  // Update department
  updateDepartment: async (
    id: string,
    data: UpdateDepartmentRequest
  ): Promise<ApiResponse<Department>> => {
    return apiClient.put<ApiResponse<Department>>(`/departments/${id}`, data);
  },

  // Delete department
  deleteDepartment: async (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete<ApiResponse<null>>(`/departments/${id}`);
  },
};
