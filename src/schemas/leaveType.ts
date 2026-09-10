import { z } from 'zod';

// Create Leave Type Schema
export const createLeaveTypeSchema = z.object({
  name: z
    .string()
    .min(2, 'Leave type name must be at least 2 characters')
    .max(50, 'Leave type name cannot exceed 50 characters'),
  description: z.string().max(200, 'Description cannot exceed 200 characters').optional(),
  defaultDays: z
    .number()
    .int('Days must be a whole number')
    .min(0, 'Days cannot be negative')
    .max(365, 'Days cannot exceed 365'),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex code (e.g., #FF5733)')
    .optional(),
  active: z.boolean(),
});

// Update Leave Type Schema
export const updateLeaveTypeSchema = z.object({
  name: z
    .string()
    .min(2, 'Leave type name must be at least 2 characters')
    .max(50, 'Leave type name cannot exceed 50 characters')
    .optional(),
  description: z.string().max(200, 'Description cannot exceed 200 characters').optional(),
  defaultDays: z
    .number()
    .int('Days must be a whole number')
    .min(0, 'Days cannot be negative')
    .max(365, 'Days cannot exceed 365')
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex code (e.g., #FF5733)')
    .optional(),
  active: z.boolean().optional(),
});

// Type exports
export type CreateLeaveTypeFormData = z.infer<typeof createLeaveTypeSchema>;
export type UpdateLeaveTypeFormData = z.infer<typeof updateLeaveTypeSchema>;
