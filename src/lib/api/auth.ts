import { apiClient } from './client';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ResendVerificationRequest,
  UserInfoResponse,
  UserStatusResponse,
  ApiResponse,
} from '@/types';

export const authApi = {
  // Login
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>('/auth/login', credentials, { skipAuth: true });
  },

  // Register
  register: async (credentials: RegisterRequest): Promise<RegisterResponse> => {
    return apiClient.post<RegisterResponse>('/auth/register', credentials, { skipAuth: true });
  },

  // Logout
  logout: async (): Promise<ApiResponse> => {
    return apiClient.post<ApiResponse>('/auth/logout', {});
  },

  // Get current user info
  getUserInfo: async (): Promise<UserInfoResponse> => {
    return apiClient.get<UserInfoResponse>('/auth/me');
  },

  // Get user status (for role-based routing)
  getUserStatus: async (): Promise<UserStatusResponse> => {
    return apiClient.get<UserStatusResponse>('/auth/status');
  },

  // Refresh token
  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>('/auth/refresh', { refreshToken }, { skipAuth: true });
  },

  // Forgot password
  forgotPassword: async (data: ForgotPasswordRequest): Promise<ApiResponse> => {
    return apiClient.post<ApiResponse>('/auth/forgot-password', data, { skipAuth: true });
  },

  // Reset password
  resetPassword: async (data: ResetPasswordRequest): Promise<ApiResponse> => {
    return apiClient.post<ApiResponse>('/auth/reset-password', data, { skipAuth: true });
  },

  // Verify email
  verifyEmail: async (token: string): Promise<ApiResponse> => {
    return apiClient.get<ApiResponse>(`/auth/verify-email/${token}`, { skipAuth: true });
  },

  // Resend verification email
  resendVerification: async (data: ResendVerificationRequest): Promise<ApiResponse> => {
    return apiClient.post<ApiResponse>('/auth/resend-verification', data, { skipAuth: true });
  },
};
