import { z } from 'zod';

// Create Attendance Schema
export const createAttendanceSchema = z.object({
  employeeId: z.string().uuid('Please select a valid employee'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  status: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'], {
    message: 'Please select a valid status',
  }),
  checkInTime: z
    .string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format')
    .optional()
    .or(z.literal('')),
  checkOutTime: z
    .string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format')
    .optional()
    .or(z.literal('')),
  notes: z.string().optional(),
});

// Update Attendance Schema
export const updateAttendanceSchema = z.object({
  status: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE']).optional(),
  checkInTime: z
    .string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format')
    .optional()
    .or(z.literal('')),
  checkOutTime: z
    .string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format')
    .optional()
    .or(z.literal('')),
  notes: z.string().optional(),
});

// Type exports
export type CreateAttendanceFormData = z.infer<typeof createAttendanceSchema>;
export type UpdateAttendanceFormData = z.infer<typeof updateAttendanceSchema>;
