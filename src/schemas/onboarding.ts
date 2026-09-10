import { z } from 'zod';

export const createOnboardingSchema = z.object({
  employeeId: z.string().uuid('Please select a valid employee'),
  startDate: z.string().refine(
    (date) => {
      const startDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return startDate >= today;
    },
    {
      message: 'Start date must be today or in the future',
    }
  ),
  targetCompletionDate: z
    .string()
    .refine(
      (date) => {
        const completionDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return completionDate >= today;
      },
      {
        message: 'Target completion date must be today or in the future',
      }
    )
    .optional(),
  assignedToId: z.string().uuid('Please select a valid assignee').optional(),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  goals: z.array(z.string().min(3).max(200)).optional(),
  isTemplate: z.boolean().optional(),
  templateName: z.string().min(3).max(100).optional(),
});

export const updateOnboardingSchema = z.object({
  status: z
    .enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'], {
      message: 'Please select a valid status',
    })
    .optional(),
  currentPhase: z
    .enum(['PRE_BOARDING', 'FIRST_DAY', 'FIRST_WEEK', 'FIRST_MONTH', 'FIRST_QUARTER'], {
      message: 'Please select a valid phase',
    })
    .optional(),
  startDate: z
    .string()
    .refine(
      (date) => {
        const startDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return startDate >= today;
      },
      {
        message: 'Start date must be today or in the future',
      }
    )
    .optional(),
  targetCompletionDate: z
    .string()
    .refine(
      (date) => {
        const completionDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return completionDate >= today;
      },
      {
        message: 'Target completion date must be today or in the future',
      }
    )
    .optional(),
  actualCompletionDate: z.string().optional(),
  assignedToId: z.string().uuid('Please select a valid assignee').optional(),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  goals: z.array(z.string().min(3).max(200)).optional(),
  challenges: z.array(z.string().min(3).max(200)).optional(),
  feedback: z.string().max(1000, 'Feedback cannot exceed 1000 characters').optional(),
  satisfactionRating: z
    .number()
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5')
    .optional(),
  improvementSuggestions: z
    .string()
    .max(1000, 'Improvement suggestions cannot exceed 1000 characters')
    .optional(),
});

export type CreateOnboardingFormData = z.infer<typeof createOnboardingSchema>;
export type UpdateOnboardingFormData = z.infer<typeof updateOnboardingSchema>;

// Onboarding Task Schemas
export const createOnboardingTaskSchema = z.object({
  onboardingId: z.string().uuid('Please select a valid onboarding'),
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must be less than 500 characters'),
  category: z.enum([
    'DOCUMENTATION',
    'TRAINING',
    'EQUIPMENT',
    'ACCESS',
    'ORIENTATION',
    'COMPLIANCE',
    'SOCIAL',
    'OTHER',
  ]),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  dueDate: z.string().optional(),
  assignedTo: z.string().uuid().optional().or(z.literal('')),
  instructions: z.string().max(1000, 'Instructions must be less than 1000 characters').optional(),
  requiredDocuments: z.array(z.string()).optional(),
  isRequired: z.boolean().optional(),
  estimatedDuration: z.number().min(0).optional(),
  dependencies: z.array(z.string()).optional(),
});

export const updateOnboardingTaskSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be less than 200 characters')
    .optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  category: z
    .enum([
      'DOCUMENTATION',
      'TRAINING',
      'EQUIPMENT',
      'ACCESS',
      'ORIENTATION',
      'COMPLIANCE',
      'SOCIAL',
      'OTHER',
    ])
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'ON_HOLD']).optional(),
  dueDate: z.string().optional(),
  completedDate: z.string().optional(),
  assignedTo: z.string().uuid().optional().or(z.literal('')),
  completedBy: z.string().uuid().optional().or(z.literal('')),
  instructions: z.string().max(1000, 'Instructions must be less than 1000 characters').optional(),
  requiredDocuments: z.array(z.string()).optional(),
  attachments: z.array(z.string()).optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
  completionNotes: z
    .string()
    .max(500, 'Completion notes must be less than 500 characters')
    .optional(),
  isRequired: z.boolean().optional(),
  estimatedDuration: z.number().min(0).optional(),
  actualDuration: z.number().min(0).optional(),
  dependencies: z.array(z.string()).optional(),
  failureReason: z.string().max(500, 'Failure reason must be less than 500 characters').optional(),
});

export type CreateOnboardingTaskFormData = z.infer<typeof createOnboardingTaskSchema>;
export type UpdateOnboardingTaskFormData = z.infer<typeof updateOnboardingTaskSchema>;
