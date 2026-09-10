import { z } from 'zod';

// Create Leave Request Schema
export const createLeaveRequestSchema = z
  .object({
    leaveTypeId: z.string().uuid('Please select a valid leave type'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    reason: z
      .string()
      .min(10, 'Reason must be at least 10 characters')
      .max(500, 'Reason cannot exceed 500 characters'),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end >= start;
    },
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    }
  );

// Update Leave Request Schema
export const updateLeaveRequestSchema = z
  .object({
    startDate: z.string().min(1, 'Start date is required').optional(),
    endDate: z.string().min(1, 'End date is required').optional(),
    reason: z
      .string()
      .min(10, 'Reason must be at least 10 characters')
      .max(500, 'Reason cannot exceed 500 characters')
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        return end >= start;
      }
      return true;
    },
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    }
  );

// Approve Leave Request Schema
export const approveLeaveRequestSchema = z.object({
  comments: z.string().max(200, 'Comments cannot exceed 200 characters').optional(),
});

// Reject Leave Request Schema
export const rejectLeaveRequestSchema = z.object({
  reason: z
    .string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(200, 'Rejection reason cannot exceed 200 characters'),
});

// Cancel Leave Request Schema
export const cancelLeaveRequestSchema = z.object({
  reason: z.string().max(200, 'Cancellation reason cannot exceed 200 characters').optional(),
});

// Type exports
export type CreateLeaveRequestFormData = z.infer<typeof createLeaveRequestSchema>;
export type UpdateLeaveRequestFormData = z.infer<typeof updateLeaveRequestSchema>;
export type ApproveLeaveRequestFormData = z.infer<typeof approveLeaveRequestSchema>;
export type RejectLeaveRequestFormData = z.infer<typeof rejectLeaveRequestSchema>;
export type CancelLeaveRequestFormData = z.infer<typeof cancelLeaveRequestSchema>;
