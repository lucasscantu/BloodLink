import { z } from 'zod';
import { BloodType, DemandStatus, DemandUrgency } from '../types';

// Create Demand Schema
export const createDemandSchema = z.object({
  institutionId: z.string().uuid('Invalid institution ID'),
  bloodType: z.enum([
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
  ] as [BloodType, ...BloodType[]]),
  quantity: z.number().positive('Quantity must be positive').int('Quantity must be an integer'),
  urgency: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'EMERGENCIA'] as [DemandUrgency, ...DemandUrgency[]]),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  notes: z.string().optional(),
  expiresAt: z.string().datetime('Invalid date format').optional(),
});

// Update Demand Schema
export const updateDemandSchema = z.object({
  bloodType: z.enum([
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
  ] as [BloodType, ...BloodType[]]).optional(),
  quantity: z.number().positive('Quantity must be positive').int('Quantity must be an integer').optional(),
  urgency: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'EMERGENCIA'] as [DemandUrgency, ...DemandUrgency[]]).optional(),
  reason: z.string().min(5, 'Reason must be at least 5 characters').optional(),
  notes: z.string().optional(),
  status: z.enum([
    'ABERTA', 'EM_ANALISE', 'ATENDIDA', 'PARCIALMENTE_ATENDIDA', 'CANCELADA', 'EXPIRADA'
  ] as [DemandStatus, ...DemandStatus[]]).optional(),
  expiresAt: z.string().datetime('Invalid date format').optional(),
});

// Demand ID Param Schema
export const demandIdParamSchema = z.object({
  id: z.string().uuid('Invalid demand ID'),
});

// Demand Query Schema
export const demandQuerySchema = z.object({
  institutionId: z.string().uuid('Invalid institution ID').optional(),
  bloodType: z.enum([
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
  ] as [BloodType, ...BloodType[]]).optional(),
  status: z.enum([
    'ABERTA', 'EM_ANALISE', 'ATENDIDA', 'PARCIALMENTE_ATENDIDA', 'CANCELADA', 'EXPIRADA'
  ] as [DemandStatus, ...DemandStatus[]]).optional(),
  urgency: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'EMERGENCIA'] as [DemandUrgency, ...DemandUrgency[]]).optional(),
  page: z.number().positive('Page must be positive').default(1),
  limit: z.number().positive('Limit must be positive').default(10),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Match Demand Schema (for finding compatible blood bags)
export const matchDemandSchema = z.object({
  bloodType: z.enum([
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
  ] as [BloodType, ...BloodType[]]),
  quantity: z.number().positive('Quantity must be positive').int('Quantity must be an integer'),
});

// Export types
export type CreateDemandInput = z.infer<typeof createDemandSchema>;
export type UpdateDemandInput = z.infer<typeof updateDemandSchema>;
export type DemandIdParams = z.infer<typeof demandIdParamSchema>;
export type DemandQueryParams = z.infer<typeof demandQuerySchema>;
export type MatchDemandInput = z.infer<typeof matchDemandSchema>;
