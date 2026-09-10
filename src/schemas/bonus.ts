import { z } from 'zod';

export const createBonusSchema = z.object({
  employeeId: z.string().uuid('Please select a valid employee'),
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  type: z.enum(
    [
      'PERFORMANCE',
      'ANNUAL',
      'QUARTERLY',
      'PROJECT',
      'REFERRAL',
      'RETENTION',
      'SIGN_ON',
      'MILESTONE',
      'OTHER',
    ],
    { message: 'Please select a bonus type' }
  ),
  amount: z
    .number({ message: 'Amount is required' })
    .positive('Amount must be greater than 0')
    .max(10000000, 'Amount must be less than 10,000,000'),
  percentage: z.number().min(0).max(100).optional(),
  effectiveDate: z.string().min(1, 'Effective date is required'),
  paymentDate: z.string().optional(),
  criteria: z.string().max(1000).optional(),
  notes: z.string().max(1000).optional(),
  paymentMethod: z.string().max(100).optional(),
  isTaxable: z.boolean().default(true).optional(),
  taxAmount: z.number().min(0).optional(),
  netAmount: z.number().min(0).optional(),
});

export const updateBonusSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200).optional(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000)
    .optional(),
  type: z
    .enum([
      'PERFORMANCE',
      'ANNUAL',
      'QUARTERLY',
      'PROJECT',
      'REFERRAL',
      'RETENTION',
      'SIGN_ON',
      'MILESTONE',
      'OTHER',
    ])
    .optional(),
  amount: z.number().positive('Amount must be greater than 0').max(10000000).optional(),
  percentage: z.number().min(0).max(100).optional(),
  effectiveDate: z.string().optional(),
  paymentDate: z.string().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'PAID', 'CANCELLED', 'REJECTED']).optional(),
  criteria: z.string().max(1000).optional(),
  notes: z.string().max(1000).optional(),
  paymentMethod: z.string().max(100).optional(),
  referenceNumber: z.string().max(100).optional(),
  isTaxable: z.boolean().optional(),
  taxAmount: z.number().min(0).optional(),
  netAmount: z.number().min(0).optional(),
  rejectionReason: z.string().max(500).optional(),
});

export type CreateBonusFormData = z.infer<typeof createBonusSchema>;
export type UpdateBonusFormData = z.infer<typeof updateBonusSchema>;
