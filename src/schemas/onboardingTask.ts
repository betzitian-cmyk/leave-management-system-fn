import { z } from 'zod';

export const createOnboardingTaskSchema = z.object({
  onboardingId: z.string().uuid('Please select a valid onboarding process'),
  title: z
    .string()
    .min(5, 'Task title must be at least 5 characters')
    .max(200, 'Task title cannot exceed 200 characters'),
  description: z
    .string()
    .min(10, 'Task description must be at least 10 characters')
    .max(1000, 'Task description cannot exceed 1000 characters'),
  category: z.enum(
    [
      'DOCUMENTATION',
      'TRAINING',
      'EQUIPMENT',
      'ACCESS',
      'ORIENTATION',
      'COMPLIANCE',
      'SOCIAL',
      'OTHER',
    ],
    {
      message: 'Please select a valid category',
    }
  ),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
    message: 'Please select a valid priority',
  }),
  orderIndex: z.number().int().min(1).optional(),
  dueDate: z
    .string()
    .refine(
      (date) => {
        const dueDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dueDate >= today;
      },
      {
        message: 'Due date must be today or in the future',
      }
    )
    .optional(),
  assignedTo: z.string().uuid('Please select a valid assignee').optional(),
  instructions: z.string().max(2000, 'Instructions cannot exceed 2000 characters').optional(),
  requiredDocuments: z.array(z.string().min(3).max(200)).optional(),
  isRequired: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
  estimatedDuration: z.number().int().min(1).optional(),
  dependencies: z.array(z.string().uuid()).optional(),
});

export const updateOnboardingTaskSchema = z.object({
  title: z
    .string()
    .min(5, 'Task title must be at least 5 characters')
    .max(200, 'Task title cannot exceed 200 characters')
    .optional(),
  description: z
    .string()
    .min(10, 'Task description must be at least 10 characters')
    .max(1000, 'Task description cannot exceed 1000 characters')
    .optional(),
  category: z
    .enum(
      [
        'DOCUMENTATION',
        'TRAINING',
        'EQUIPMENT',
        'ACCESS',
        'ORIENTATION',
        'COMPLIANCE',
        'SOCIAL',
        'OTHER',
      ],
      {
        message: 'Please select a valid category',
      }
    )
    .optional(),
  priority: z
    .enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
      message: 'Please select a valid priority',
    })
    .optional(),
  status: z
    .enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'ON_HOLD'], {
      message: 'Please select a valid status',
    })
    .optional(),
  orderIndex: z.number().int().min(1).optional(),
  dueDate: z
    .string()
    .refine(
      (date) => {
        const dueDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dueDate >= today;
      },
      {
        message: 'Due date must be today or in the future',
      }
    )
    .optional(),
  completedDate: z.string().optional(),
  assignedTo: z.string().uuid('Please select a valid assignee').optional(),
  completedBy: z.string().uuid().optional(),
  instructions: z.string().max(2000, 'Instructions cannot exceed 2000 characters').optional(),
  requiredDocuments: z.array(z.string().min(3).max(200)).optional(),
  attachments: z.array(z.string().url('Must be a valid URL')).optional(),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  completionNotes: z
    .string()
    .max(1000, 'Completion notes cannot exceed 1000 characters')
    .optional(),
  isRequired: z.boolean().optional(),
  estimatedDuration: z.number().int().min(1).optional(),
  actualDuration: z.number().int().min(1).optional(),
  failureReason: z.string().max(500, 'Failure reason cannot exceed 500 characters').optional(),
});

export type CreateOnboardingTaskFormData = z.infer<typeof createOnboardingTaskSchema>;
export type UpdateOnboardingTaskFormData = z.infer<typeof updateOnboardingTaskSchema>;
