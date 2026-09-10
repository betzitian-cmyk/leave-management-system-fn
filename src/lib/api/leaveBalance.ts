import { apiClient } from './client';
import type { ApiResponse, LeaveBalance } from '@/types';

export const leaveBalanceApi = {
  // Get my leave balances
  // Note: Backend returns array directly, not wrapped in ApiResponse
  getMyLeaveBalances: async (): Promise<LeaveBalance[] | ApiResponse<LeaveBalance[]>> => {
    const response = await apiClient.get<LeaveBalance[] | ApiResponse<LeaveBalance[]>>(
      '/leave-balances/my-balances'
    );
    // Handle both direct array response and wrapped response
    if (Array.isArray(response)) {
      return response;
    }
    return response;
  },

  // Get employee leave balances (HR/Admin/Manager only)
  getEmployeeLeaveBalances: async (
    employeeId: string
  ): Promise<LeaveBalance[] | ApiResponse<LeaveBalance[]>> => {
    const response = await apiClient.get<LeaveBalance[] | ApiResponse<LeaveBalance[]>>(
      `/leave-balances/employee/${employeeId}`
    );
    // Handle both direct array response and wrapped response
    if (Array.isArray(response)) {
      return response;
    }
    return response;
  },
};
