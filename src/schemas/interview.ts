import { z } from 'zod';

export const createInterviewSchema = z.object({
  jobApplicationId: z.string().uuid('Please select a valid job application'),
  interviewerId: z.string().uuid('Please select a valid interviewer'),
  scheduledDate: z.string().refine(
    (date) => {
      const interviewDate = new Date(date);
      const now = new Date();
      return interviewDate >= now;
    },
    {
      message: 'Interview date must be in the future',
    }
  ),
  duration: z
    .number()
    .int('Duration must be a whole number')
    .min(15, 'Duration must be at least 15 minutes')
    .max(480, 'Duration cannot exceed 480 minutes (8 hours)'),
  type: z.enum(['PHONE', 'VIDEO', 'ONSITE', 'TECHNICAL', 'BEHAVIORAL'], {
    message: 'Please select an interview type',
  }),
  location: z
    .string()
    .min(2, 'Location must be at least 2 characters')
    .max(200, 'Location cannot exceed 200 characters')
    .optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

export const updateInterviewSchema = z.object({
  scheduledDate: z
    .string()
    .refine(
      (date) => {
        const interviewDate = new Date(date);
        const now = new Date();
        return interviewDate >= now;
      },
      {
        message: 'Interview date must be in the future',
      }
    )
    .optional(),
  duration: z
    .number()
    .int('Duration must be a whole number')
    .min(15, 'Duration must be at least 15 minutes')
    .max(480, 'Duration cannot exceed 480 minutes (8 hours)')
    .optional(),
  type: z
    .enum(['PHONE', 'VIDEO', 'ONSITE', 'TECHNICAL', 'BEHAVIORAL'], {
      message: 'Please select an interview type',
    })
    .optional(),
  location: z
    .string()
    .min(2, 'Location must be at least 2 characters')
    .max(200, 'Location cannot exceed 200 characters')
    .optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']).optional(),
  feedback: z.string().max(1000, 'Feedback cannot exceed 1000 characters').optional(),
  rating: z
    .number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5')
    .optional(),
});

export type CreateInterviewFormData = z.infer<typeof createInterviewSchema>;
export type UpdateInterviewFormData = z.infer<typeof updateInterviewSchema>;
