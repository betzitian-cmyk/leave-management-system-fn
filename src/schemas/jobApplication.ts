import { z } from 'zod';

export const createJobApplicationSchema = z.object({
  jobPostingId: z.string().uuid('Please select a valid job posting'),
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number')
    .min(10, 'Phone number must be at least 10 characters')
    .max(20, 'Phone number cannot exceed 20 characters'),
  resume: z.string().url('Please provide a valid resume URL'),
  coverLetter: z
    .string()
    .min(100, 'Cover letter must be at least 100 characters')
    .max(1000, 'Cover letter cannot exceed 1000 characters')
    .optional(),
  experience: z
    .number()
    .int('Experience must be a whole number')
    .min(0, 'Experience cannot be negative')
    .max(50, 'Experience cannot exceed 50 years'),
  expectedSalary: z.number().positive('Expected salary must be positive').optional(),
  availability: z.string().optional(),
});

export const updateJobApplicationSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED'], {
    message: 'Please select a valid status',
  }),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  rating: z
    .number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5')
    .optional(),
});

export type CreateJobApplicationFormData = z.infer<typeof createJobApplicationSchema>;
export type UpdateJobApplicationFormData = z.infer<typeof updateJobApplicationSchema>;
