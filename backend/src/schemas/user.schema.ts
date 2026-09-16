import { z } from 'zod';
import { UserRole } from '../types';

// Create User Schema
export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  role: z.enum(['ADMIN', 'HEMOCENTRO', 'HOSPITAL', 'AUDITOR'] as [UserRole, ...UserRole[]]),
  institutionId: z.string().uuid('Invalid institution ID'),
  phone: z.string().optional(),
  medicalLicense: z.string().optional(),
});

// Update User Schema
export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email format').optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .optional(),
  role: z.enum(['ADMIN', 'HEMOCENTRO', 'HOSPITAL', 'AUDITOR'] as [UserRole, ...UserRole[]]).optional(),
  institutionId: z.string().uuid('Invalid institution ID').optional(),
  phone: z.string().optional(),
  medicalLicense: z.string().optional(),
  isActive: z.boolean().optional(),
});

// User Login Schema
export const userLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// User ID Param Schema
export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
});

// User Query Schema
export const userQuerySchema = z.object({
  role: z.enum(['ADMIN', 'HEMOCENTRO', 'HOSPITAL', 'AUDITOR'] as [UserRole, ...UserRole[]]).optional(),
  institutionId: z.string().uuid('Invalid institution ID').optional(),
  isActive: z.boolean().optional(),
  page: z.number().positive('Page must be positive').default(1),
  limit: z.number().positive('Limit must be positive').default(10),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Export types
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type UserIdParams = z.infer<typeof userIdParamSchema>;
export type UserQueryParams = z.infer<typeof userQuerySchema>;
