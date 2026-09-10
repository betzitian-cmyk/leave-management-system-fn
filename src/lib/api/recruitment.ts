import { apiClient } from './client';
import type {
  JobPosting,
  CreateJobPostingRequest,
  UpdateJobPostingRequest,
  JobApplication,
  CreateJobApplicationRequest,
  UpdateJobApplicationRequest,
  Interview,
  CreateInterviewRequest,
  UpdateInterviewRequest,
} from '@/types';

// Job Postings API
export const jobPostingsApi = {
  /**
   * Get all job postings
   */
  async getAllJobPostings() {
    return apiClient.get<{ data: JobPosting[]; total: number }>('/recruitment/job-postings');
  },

  /**
   * Get job posting by ID
   */
  async getJobPostingById(id: string) {
    return apiClient.get<JobPosting>(`/recruitment/job-postings/${id}`);
  },

  /**
   * Create new job posting
   */
  async createJobPosting(data: CreateJobPostingRequest) {
    return apiClient.post<JobPosting>('/recruitment/job-postings', data);
  },

  /**
   * Update job posting
   */
  async updateJobPosting(id: string, data: UpdateJobPostingRequest) {
    return apiClient.put<JobPosting>(`/recruitment/job-postings/${id}`, data);
  },

  /**
   * Publish job posting
   */
  async publishJobPosting(id: string, approvedBy: string) {
    return apiClient.post<JobPosting>(`/recruitment/job-postings/${id}/publish`, { approvedBy });
  },

  /**
   * Delete job posting
   */
  async deleteJobPosting(id: string) {
    return apiClient.delete(`/recruitment/job-postings/${id}`);
  },
};

// Job Applications API
export const jobApplicationsApi = {
  /**
   * Get all job applications
   */
  async getAllApplications() {
    return apiClient.get<{ data: JobApplication[]; total: number }>('/recruitment/applications');
  },

  /**
   * Get job application by ID
   */
  async getApplicationById(id: string) {
    return apiClient.get<JobApplication>(`/recruitment/applications/${id}`);
  },

  /**
   * Create new job application
   */
  async createApplication(data: CreateJobApplicationRequest) {
    return apiClient.post<JobApplication>('/recruitment/applications', data);
  },

  /**
   * Update job application
   */
  async updateApplication(id: string, data: UpdateJobApplicationRequest) {
    return apiClient.put<JobApplication>(`/recruitment/applications/${id}`, data);
  },

  /**
   * Delete job application
   */
  async deleteApplication(id: string) {
    return apiClient.delete(`/recruitment/applications/${id}`);
  },
};

// Interviews API
export const interviewsApi = {
  /**
   * Get all interviews
   */
  async getAllInterviews() {
    return apiClient.get<{ data: Interview[]; total: number }>('/recruitment/interviews');
  },

  /**
   * Get interview by ID
   */
  async getInterviewById(id: string) {
    return apiClient.get<Interview>(`/recruitment/interviews/${id}`);
  },

  /**
   * Create new interview
   */
  async createInterview(data: CreateInterviewRequest) {
    return apiClient.post<Interview>('/recruitment/interviews', data);
  },

  /**
   * Update interview
   */
  async updateInterview(id: string, data: UpdateInterviewRequest) {
    return apiClient.put<Interview>(`/recruitment/interviews/${id}`, data);
  },

  /**
   * Delete interview
   */
  async deleteInterview(id: string) {
    return apiClient.delete(`/recruitment/interviews/${id}`);
  },
};
