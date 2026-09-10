import { apiClient } from './client';
import type {
  OnboardingProcess,
  OnboardingTask,
  CreateOnboardingRequest,
  UpdateOnboardingRequest,
  CreateOnboardingTaskRequest,
  UpdateOnboardingTaskRequest,
} from '@/types';

// Onboarding Process API
export const onboardingApi = {
  /**
   * Get all onboarding processes (frontend-side filtering)
   */
  async getAllOnboardings() {
    return apiClient.get<{ data: OnboardingProcess[]; total: number }>('/onboarding');
  },

  /**
   * Get onboarding process by ID
   */
  async getOnboardingById(id: string) {
    return apiClient.get<OnboardingProcess>(`/onboarding/${id}`);
  },

  /**
   * Create onboarding process
   */
  async createOnboarding(data: CreateOnboardingRequest) {
    return apiClient.post<OnboardingProcess>('/onboarding', data);
  },

  /**
   * Update onboarding process
   */
  async updateOnboarding(id: string, data: UpdateOnboardingRequest) {
    return apiClient.put<OnboardingProcess>(`/onboarding/${id}`, data);
  },

  /**
   * Delete onboarding process
   */
  async deleteOnboarding(id: string) {
    return apiClient.delete(`/onboarding/${id}`);
  },

  /**
   * Advance onboarding phase
   */
  async advancePhase(id: string) {
    return apiClient.post<OnboardingProcess>(`/onboarding/${id}/advance-phase`, {});
  },

  /**
   * Get onboarding progress
   */
  async getOnboardingProgress(id: string) {
    return apiClient.get<{
      totalTasks: number;
      completedTasks: number;
      pendingTasks: number;
      progressPercentage: number;
    }>(`/onboarding/${id}/progress`);
  },
};

// Onboarding Tasks API
export const onboardingTasksApi = {
  /**
   * Get all tasks for an onboarding process
   */
  async getTasksByOnboardingId(onboardingId: string) {
    return apiClient.get<{ data: OnboardingTask[]; total: number }>(
      `/onboarding/tasks?onboardingId=${onboardingId}`
    );
  },

  /**
   * Get task by ID
   */
  async getTaskById(id: string) {
    return apiClient.get<OnboardingTask>(`/onboarding/tasks/${id}`);
  },

  /**
   * Create onboarding task
   */
  async createTask(data: CreateOnboardingTaskRequest) {
    return apiClient.post<OnboardingTask>('/onboarding/tasks', data);
  },

  /**
   * Update onboarding task
   */
  async updateTask(id: string, data: UpdateOnboardingTaskRequest) {
    return apiClient.put<OnboardingTask>(`/onboarding/tasks/${id}`, data);
  },

  /**
   * Delete onboarding task
   */
  async deleteTask(id: string) {
    return apiClient.delete(`/onboarding/tasks/${id}`);
  },

  /**
   * Update task status
   */
  async updateTaskStatus(
    id: string,
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'ON_HOLD',
    completionNotes?: string
  ) {
    return apiClient.put<OnboardingTask>(`/onboarding/tasks/${id}/status`, {
      status,
      completionNotes,
    });
  },
};
