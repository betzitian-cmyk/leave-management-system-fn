import { apiClient } from './client';
import type { ApiResponse, Employee, LeaveRequest } from '@/types';

export const managerApi = {
  // Get team members
  getTeamMembers: async (includeInactive: boolean = false): Promise<ApiResponse<Employee[]>> => {
    const params = new URLSearchParams();
    if (includeInactive) {
      params.append('includeInactive', 'true');
    }
    const queryString = params.toString();
    const url = `/manager/team-members${queryString ? `?${queryString}` : ''}`;
    return apiClient.get<ApiResponse<Employee[]>>(url);
  },

  // Get team calendar (using team leaves endpoint)
  getTeamCalendar: async (): Promise<ApiResponse<LeaveRequest[]>> => {
    return apiClient.get<ApiResponse<LeaveRequest[]>>('/leave-requests/team');
  },
};
