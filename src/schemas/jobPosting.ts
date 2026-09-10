import { z } from 'zod';

export const createJobPostingSchema = z.object({
  title: z
    .string()
    .min(5, 'Job title must be at least 5 characters')
    .max(200, 'Job title cannot exceed 200 characters'),
  description: z
    .string()
    .min(50, 'Job description must be at least 50 characters')
    .max(2000, 'Job description cannot exceed 2000 characters'),
  requirements: z
    .array(z.string().min(5, 'Requirement must be at least 5 characters').max(200))
    .min(1, 'At least one requirement is required'),
  responsibilities: z
    .array(z.string().min(5, 'Responsibility must be at least 5 characters').max(200))
    .min(1, 'At least one responsibility is required'),
  departmentId: z.string().uuid('Please select a valid department'),
  location: z
    .string()
    .min(2, 'Location must be at least 2 characters')
    .max(100, 'Location cannot exceed 100 characters'),
  type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'], {
    message: 'Please select a job type',
  }),
  experienceLevel: z.enum(['ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD'], {
    message: 'Please select an experience level',
  }),
  salaryRange: z
    .object({
      min: z.number().positive('Minimum salary must be positive'),
      max: z.number().positive('Maximum salary must be positive'),
      currency: z.enum(['USD', 'EUR', 'GBP']),
    })
    .refine((data) => data.max >= data.min, {
      message: 'Maximum salary must be greater than or equal to minimum salary',
      path: ['max'],
    })
    .optional(),
  benefits: z.array(z.string().min(5).max(100)).optional(),
  applicationDeadline: z.string().refine(
    (date) => {
      const deadlineDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return deadlineDate >= today;
    },
    {
      message: 'Application deadline must be today or in the future',
    }
  ),
});

export const updateJobPostingSchema = z.object({
  title: z
    .string()
    .min(5, 'Job title must be at least 5 characters')
    .max(200, 'Job title cannot exceed 200 characters')
    .optional(),
  description: z
    .string()
    .min(50, 'Job description must be at least 50 characters')
    .max(2000, 'Job description cannot exceed 2000 characters')
    .optional(),
  requirements: z
    .array(z.string().min(5, 'Requirement must be at least 5 characters').max(200))
    .min(1, 'At least one requirement is required')
    .optional(),
  responsibilities: z
    .array(z.string().min(5, 'Responsibility must be at least 5 characters').max(200))
    .min(1, 'At least one responsibility is required')
    .optional(),
  departmentId: z.string().uuid('Please select a valid department').optional(),
  location: z
    .string()
    .min(2, 'Location must be at least 2 characters')
    .max(100, 'Location cannot exceed 100 characters')
    .optional(),
  type: z
    .enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'], {
      message: 'Please select a job type',
    })
    .optional(),
  experienceLevel: z
    .enum(['ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD'], {
      message: 'Please select an experience level',
    })
    .optional(),
  salaryRange: z
    .object({
      min: z.number().positive('Minimum salary must be positive'),
      max: z.number().positive('Maximum salary must be positive'),
      currency: z.enum(['USD', 'EUR', 'GBP']),
    })
    .refine((data) => data.max >= data.min, {
      message: 'Maximum salary must be greater than or equal to minimum salary',
      path: ['max'],
    })
    .optional(),
  benefits: z.array(z.string().min(5).max(100)).optional(),
  applicationDeadline: z
    .string()
    .refine(
      (date) => {
        const deadlineDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return deadlineDate >= today;
      },
      {
        message: 'Application deadline must be today or in the future',
      }
    )
    .optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED']).optional(),
});

export type CreateJobPostingFormData = z.infer<typeof createJobPostingSchema>;
export type UpdateJobPostingFormData = z.infer<typeof updateJobPostingSchema>;
