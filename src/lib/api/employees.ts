import { apiClient } from './client';
import type { ApiResponse, Employee, CreateEmployeeRequest, UpdateEmployeeRequest } from '@/types';

export const employeesApi = {
  // Get all employees
  getAllEmployees: async (): Promise<ApiResponse<Employee[]>> => {
    return apiClient.get<ApiResponse<Employee[]>>('/employees');
  },

  // Get employee by ID
  getEmployeeById: async (id: string): Promise<ApiResponse<Employee>> => {
    return apiClient.get<ApiResponse<Employee>>(`/employees/${id}`);
  },

  // Create employee profile
  createEmployee: async (data: CreateEmployeeRequest): Promise<ApiResponse<Employee>> => {
    return apiClient.post<ApiResponse<Employee>>('/employees', data);
  },

  // Update employee
  updateEmployee: async (
    id: string,
    data: UpdateEmployeeRequest
  ): Promise<ApiResponse<Employee>> => {
    return apiClient.put<ApiResponse<Employee>>(`/employees/${id}`, data);
  },
};
