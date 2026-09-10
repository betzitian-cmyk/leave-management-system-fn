import { apiClient } from './client';
import type { User } from '@/types';

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePicture?: File;
}

export const profileApi = {
  /**
   * Get current user's profile
   */
  async getProfile() {
    return apiClient.get<{ success: boolean; data: User; message: string }>('/profile');
  },

  /**
   * Update current user's profile
   */
  async updateProfile(data: UpdateProfileData) {
    const formData = new FormData();

    if (data.firstName) formData.append('firstName', data.firstName);
    if (data.lastName) formData.append('lastName', data.lastName);
    if (data.email) formData.append('email', data.email);
    if (data.profilePicture) formData.append('profilePicture', data.profilePicture);

    return apiClient.put<{ success: boolean; data: User; message: string }>('/profile', formData);
  },

  /**
   * Delete profile picture
   */
  async deleteProfilePicture() {
    return apiClient.delete<{ success: boolean; message: string }>('/profile/picture');
  },
};
