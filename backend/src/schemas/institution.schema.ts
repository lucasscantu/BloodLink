import { z } from 'zod';
import { InstitutionType } from '../types';

// Create Institution Schema
export const createInstitutionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters'),
  type: z.enum(['HEMOCENTRO', 'HOSPITAL'] as [InstitutionType, ...InstitutionType[]]),
  cnpj: z.string().min(14, 'CNPJ must be at least 14 characters'),
  address: z.object({
    street: z.string().min(2, 'Street is required'),
    number: z.string().min(1, 'Number is required'),
    complement: z.string().optional(),
    neighborhood: z.string().min(2, 'Neighborhood is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    zipCode: z.string().min(8, 'Zip code is required'),
    country: z.string().default('Brasil'),
  }),
  phone: z.string().min(10, 'Phone is required'),
  email: z.string().email('Invalid email format'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  capacity: z.number().positive('Capacity must be positive').optional().default(100),
  isActive: z.boolean().optional().default(true),
  notes: z.string().optional(),
});

// Update Institution Schema
export const updateInstitutionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  code: z.string().min(2, 'Code must be at least 2 characters').optional(),
  type: z.enum(['HEMOCENTRO', 'HOSPITAL'] as [InstitutionType, ...InstitutionType[]]).optional(),
  cnpj: z.string().min(14, 'CNPJ must be at least 14 characters').optional(),
  address: z.object({
    street: z.string().min(2, 'Street is required').optional(),
    number: z.string().min(1, 'Number is required').optional(),
    complement: z.string().optional(),
    neighborhood: z.string().min(2, 'Neighborhood is required').optional(),
    city: z.string().min(2, 'City is required').optional(),
    state: z.string().min(2, 'State is required').optional(),
    zipCode: z.string().min(8, 'Zip code is required').optional(),
    country: z.string().optional(),
  }).optional(),
  phone: z.string().min(10, 'Phone is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  capacity: z.number().positive('Capacity must be positive').optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
});

// Institution ID Param Schema
export const institutionIdParamSchema = z.object({
  id: z.string().uuid('Invalid institution ID'),
});

// Institution Query Schema
export const institutionQuerySchema = z.object({
  type: z.enum(['HEMOCENTRO', 'HOSPITAL'] as [InstitutionType, ...InstitutionType[]]).optional(),
  isActive: z.boolean().optional(),
  city: z.string().min(2, 'City is required').optional(),
  state: z.string().min(2, 'State is required').optional(),
  page: z.number().positive('Page must be positive').default(1),
  limit: z.number().positive('Limit must be positive').default(10),
  sortBy: z.string().default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Export types
export type CreateInstitutionInput = z.infer<typeof createInstitutionSchema>;
export type UpdateInstitutionInput = z.infer<typeof updateInstitutionSchema>;
export type InstitutionIdParams = z.infer<typeof institutionIdParamSchema>;
export type InstitutionQueryParams = z.infer<typeof institutionQuerySchema>;
