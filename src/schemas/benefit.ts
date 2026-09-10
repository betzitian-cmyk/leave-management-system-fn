import { z } from 'zod';

export const createBenefitSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  type: z.enum(
    [
      'HEALTH_INSURANCE',
      'DENTAL_INSURANCE',
      'VISION_INSURANCE',
      'LIFE_INSURANCE',
      'DISABILITY_INSURANCE',
      'RETIREMENT_PLAN',
      'PAID_TIME_OFF',
      'SICK_LEAVE',
      'MATERNITY_LEAVE',
      'PATERNITY_LEAVE',
      'EDUCATION_REIMBURSEMENT',
      'TRANSPORTATION',
      'MEAL_ALLOWANCE',
      'GYM_MEMBERSHIP',
      'OTHER',
    ],
    { message: 'Please select a benefit type' }
  ),
  category: z.enum(
    ['INSURANCE', 'RETIREMENT', 'TIME_OFF', 'WELLNESS', 'PROFESSIONAL_DEVELOPMENT', 'LIFESTYLE'],
    { message: 'Please select a category' }
  ),
  cost: z.number().positive().optional(),
  employeeContribution: z.number().positive().optional(),
  employeeContributionPercentage: z.number().min(0).max(100).optional(),
  requiresEnrollment: z.boolean().default(false).optional(),
  effectiveDate: z.string().optional(),
  endDate: z.string().optional(),
  eligibilityCriteria: z.array(z.string().min(1)).optional(),
  documentsRequired: z.array(z.string().min(1)).optional(),
  provider: z.string().max(200).optional(),
  contactInfo: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

export const updateBenefitSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(200).optional(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000)
    .optional(),
  type: z
    .enum([
      'HEALTH_INSURANCE',
      'DENTAL_INSURANCE',
      'VISION_INSURANCE',
      'LIFE_INSURANCE',
      'DISABILITY_INSURANCE',
      'RETIREMENT_PLAN',
      'PAID_TIME_OFF',
      'SICK_LEAVE',
      'MATERNITY_LEAVE',
      'PATERNITY_LEAVE',
      'EDUCATION_REIMBURSEMENT',
      'TRANSPORTATION',
      'MEAL_ALLOWANCE',
      'GYM_MEMBERSHIP',
      'OTHER',
    ])
    .optional(),
  category: z
    .enum([
      'INSURANCE',
      'RETIREMENT',
      'TIME_OFF',
      'WELLNESS',
      'PROFESSIONAL_DEVELOPMENT',
      'LIFESTYLE',
    ])
    .optional(),
  cost: z.number().positive().optional(),
  employeeContribution: z.number().positive().optional(),
  employeeContributionPercentage: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
  requiresEnrollment: z.boolean().optional(),
  effectiveDate: z.string().optional(),
  endDate: z.string().optional(),
  eligibilityCriteria: z.array(z.string().min(1)).optional(),
  documentsRequired: z.array(z.string().min(1)).optional(),
  provider: z.string().max(200).optional(),
  contactInfo: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

export type CreateBenefitFormData = z.infer<typeof createBenefitSchema>;
export type UpdateBenefitFormData = z.infer<typeof updateBenefitSchema>;
