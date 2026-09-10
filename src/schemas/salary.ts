import { z } from 'zod';

export const createSalarySchema = z.object({
  employeeId: z.string().uuid('Please select a valid employee'),
  type: z.enum(['BASE_SALARY', 'HOURLY_RATE', 'COMMISSION', 'BONUS', 'ALLOWANCE'], {
    message: 'Please select a salary type',
  }),
  amount: z
    .number({ message: 'Amount is required' })
    .positive('Amount must be greater than 0')
    .max(10000000, 'Amount must be less than 10,000,000'),
  payFrequency: z.enum(['HOURLY', 'DAILY', 'WEEKLY', 'BI_WEEKLY', 'MONTHLY', 'ANNUALLY'], {
    message: 'Please select a pay frequency',
  }),
  effectiveDate: z.string().min(1, 'Effective date is required'),
  endDate: z.string().optional(),
  reason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  percentageIncrease: z.number().min(0).max(100).optional(),
  previousAmount: z.number().positive().optional(),
});

export const updateSalarySchema = z.object({
  type: z.enum(['BASE_SALARY', 'HOURLY_RATE', 'COMMISSION', 'BONUS', 'ALLOWANCE']).optional(),
  amount: z.number().positive('Amount must be greater than 0').max(10000000).optional(),
  payFrequency: z
    .enum(['HOURLY', 'DAILY', 'WEEKLY', 'BI_WEEKLY', 'MONTHLY', 'ANNUALLY'])
    .optional(),
  effectiveDate: z.string().optional(),
  endDate: z.string().optional(),
  reason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  percentageIncrease: z.number().min(0).max(100).optional(),
  previousAmount: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

export type CreateSalaryFormData = z.infer<typeof createSalarySchema>;
export type UpdateSalaryFormData = z.infer<typeof updateSalarySchema>;
