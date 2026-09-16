import { z } from 'zod';
import { TransferStatus } from '../types';

// Create Transfer Schema
export const createTransferSchema = z.object({
  bloodBagId: z.string().uuid('Invalid blood bag ID'),
  fromInstitutionId: z.string().uuid('Invalid institution ID'),
  toInstitutionId: z.string().uuid('Invalid institution ID'),
  quantity: z.number().positive('Quantity must be positive').int('Quantity must be an integer').default(1),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  demandId: z.string().uuid('Invalid demand ID').optional(),
  notes: z.string().optional(),
});

// Update Transfer Schema
export const updateTransferSchema = z.object({
  status: z.enum([
    'SOLICITADA', 'APROVADA', 'REJEITADA', 'EM_TRANSPORTE', 'RECEBIDA', 'CANCELADA', 'COMPLETADA'
  ] as [TransferStatus, ...TransferStatus[]]).optional(),
  notes: z.string().optional(),
  receivedAt: z.string().datetime('Invalid date format').optional(),
  receivedBy: z.string().uuid('Invalid user ID').optional(),
});

// Transfer ID Param Schema
export const transferIdParamSchema = z.object({
  id: z.string().uuid('Invalid transfer ID'),
});

// Transfer Query Schema
export const transferQuerySchema = z.object({
  fromInstitutionId: z.string().uuid('Invalid institution ID').optional(),
  toInstitutionId: z.string().uuid('Invalid institution ID').optional(),
  status: z.enum([
    'SOLICITADA', 'APROVADA', 'REJEITADA', 'EM_TRANSPORTE', 'RECEBIDA', 'CANCELADA', 'COMPLETADA'
  ] as [TransferStatus, ...TransferStatus[]]).optional(),
  demandId: z.string().uuid('Invalid demand ID').optional(),
  bloodBagId: z.string().uuid('Invalid blood bag ID').optional(),
  page: z.number().positive('Page must be positive').default(1),
  limit: z.number().positive('Limit must be positive').default(10),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Transfer Approval Schema
export const transferApprovalSchema = z.object({
  approved: z.boolean(),
  notes: z.string().optional(),
});

// Export types
export type CreateTransferInput = z.infer<typeof createTransferSchema>;
export type UpdateTransferInput = z.infer<typeof updateTransferSchema>;
export type TransferIdParams = z.infer<typeof transferIdParamSchema>;
export type TransferQueryParams = z.infer<typeof transferQuerySchema>;
export type TransferApprovalInput = z.infer<typeof transferApprovalSchema>;
