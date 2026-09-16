import { z } from 'zod';
import { BloodType, BagStatus } from '../types';

// Create Blood Bag Schema
export const createBloodBagSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  bloodType: z.enum([
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
  ] as [BloodType, ...BloodType[]]),
  factorRh: z.boolean().optional().default(false),
  collectionDate: z.string().datetime('Invalid date format'),
  expirationDate: z.string().datetime('Invalid date format'),
  volume: z.number().positive('Volume must be positive').optional().default(450),
  currentInstitutionId: z.string().uuid('Invalid institution ID'),
  currentLocation: z.string().min(1, 'Location is required').optional(),
  currentTemperature: z.number().optional(),
  donorId: z.string().optional(),
  notes: z.string().optional(),
});

// Update Blood Bag Schema
export const updateBloodBagSchema = z.object({
  code: z.string().min(1, 'Code is required').optional(),
  bloodType: z.enum([
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
  ] as [BloodType, ...BloodType[]]).optional(),
  factorRh: z.boolean().optional(),
  collectionDate: z.string().datetime('Invalid date format').optional(),
  expirationDate: z.string().datetime('Invalid date format').optional(),
  volume: z.number().positive('Volume must be positive').optional(),
  currentInstitutionId: z.string().uuid('Invalid institution ID').optional(),
  currentLocation: z.string().min(1, 'Location is required').optional(),
  currentTemperature: z.number().optional(),
  status: z.enum([
    'COLETADA', 'EM_TESTE', 'APROVADA', 'REPROVADA', 'ARMAZENADA',
    'EM_TRANSPORTE', 'RECEBIDA', 'DISPONIVEL', 'RESERVADA',
    'UTILIZADA', 'DESCARTADA', 'EXPIRADA'
  ] as [BagStatus, ...BagStatus[]]).optional(),
  donorId: z.string().optional(),
  notes: z.string().optional(),
});

// Blood Bag Query Schema
export const bloodBagQuerySchema = z.object({
  bloodType: z.enum([
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
  ] as [BloodType, ...BloodType[]]).optional(),
  factorRh: z.boolean().optional(),
  status: z.enum([
    'COLETADA', 'EM_TESTE', 'APROVADA', 'REPROVADA', 'ARMAZENADA',
    'EM_TRANSPORTE', 'RECEBIDA', 'DISPONIVEL', 'RESERVADA',
    'UTILIZADA', 'DESCARTADA', 'EXPIRADA'
  ] as [BagStatus, ...BagStatus[]]).optional(),
  currentInstitutionId: z.string().uuid('Invalid institution ID').optional(),
  page: z.number().positive('Page must be positive').default(1),
  limit: z.number().positive('Limit must be positive').default(10),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Blood Bag ID Param Schema
export const bloodBagIdParamSchema = z.object({
  id: z.string().uuid('Invalid blood bag ID'),
});

// Blood Bag Code Param Schema
export const bloodBagCodeParamSchema = z.object({
  code: z.string().min(1, 'Code is required'),
});

// Export types
export type CreateBloodBagInput = z.infer<typeof createBloodBagSchema>;
export type UpdateBloodBagInput = z.infer<typeof updateBloodBagSchema>;
export type BloodBagQueryParams = z.infer<typeof bloodBagQuerySchema>;
export type BloodBagIdParams = z.infer<typeof bloodBagIdParamSchema>;
export type BloodBagCodeParams = z.infer<typeof bloodBagCodeParamSchema>;
