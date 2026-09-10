import { z } from 'zod';

// Create Employee Schema
export const createEmployeeSchema = z.object({
  userId: z.string().uuid('Please select a valid user'),
  position: z.enum(['EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'ADMIN'], {
    message: 'Please select a position',
  }),
  departmentId: z.string().uuid('Please select a valid department'),
  hireDate: z.string().optional(),
  managerId: z.string().uuid().optional().or(z.literal('')),
});

// Update Employee Schema
export const updateEmployeeSchema = z.object({
  position: z
    .enum(['EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'ADMIN'], {
      message: 'Please select a position',
    })
    .optional(),
  departmentId: z.string().uuid('Please select a valid department').optional(),
  managerId: z.string().uuid().optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED']).optional(),
});

// Type exports
export type CreateEmployeeFormData = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeFormData = z.infer<typeof updateEmployeeSchema>;
