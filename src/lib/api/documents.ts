import { apiClient } from './client';
import type { ApiResponse, Document } from '@/types';

export const documentsApi = {
  // Get documents for a leave request
  getDocumentsByLeaveRequest: async (leaveRequestId: string): Promise<ApiResponse<Document[]>> => {
    return apiClient.get<ApiResponse<Document[]>>(`/documents/leave-request/${leaveRequestId}`);
  },

  // Get document by ID
  getDocumentById: async (id: string): Promise<ApiResponse<Document>> => {
    return apiClient.get<ApiResponse<Document>>(`/documents/${id}`);
  },

  // Upload document for a leave request
  uploadDocument: async (leaveRequestId: string, file: File): Promise<ApiResponse<Document>> => {
    // The apiClient automatically handles FormData creation when it detects a File
    return apiClient.post<ApiResponse<Document>>(`/documents/upload/${leaveRequestId}`, {
      document: file,
    });
  },

  // Delete document (HR/Admin only)
  deleteDocument: async (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete<ApiResponse<null>>(`/documents/${id}`);
  },
};
