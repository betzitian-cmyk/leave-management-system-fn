import * as z from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters'),
  description: z.string().optional(),
  managerId: z.string().optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters').optional(),
  description: z.string().optional(),
  managerId: z.string().optional(),
});

export type CreateDepartmentFormData = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentFormData = z.infer<typeof updateDepartmentSchema>;
