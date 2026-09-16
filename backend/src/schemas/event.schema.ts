import { z } from 'zod';
import { EventType } from '../types';

// Create Event Schema
export const createEventSchema = z.object({
  bagId: z.string().uuid('Invalid blood bag ID'),
  eventType: z.enum([
    'COLETA', 'TESTE', 'APROVACAO', 'REPROVACAO', 'ARMAZENAMENTO',
    'TRANSPORTE', 'RECEBIMENTO', 'RESERVA', 'UTILIZACAO', 'DESCARTE',
    'EXPIRACAO', 'TRANSFERENCIA_SOLICITADA', 'TRANSFERENCIA_APROVADA',
    'TRANSFERENCIA_REJEITADA', 'DEMANDA_CRIADA', 'DEMANDA_ATENDIDA'
  ] as [EventType, ...EventType[]]),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  institutionId: z.string().uuid('Invalid institution ID'),
  userId: z.string().uuid('Invalid user ID').optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Event Query Schema
export const eventQuerySchema = z.object({
  bagId: z.string().uuid('Invalid blood bag ID').optional(),
  eventType: z.enum([
    'COLETA', 'TESTE', 'APROVACAO', 'REPROVACAO', 'ARMAZENAMENTO',
    'TRANSPORTE', 'RECEBIMENTO', 'RESERVA', 'UTILIZACAO', 'DESCARTE',
    'EXPIRACAO', 'TRANSFERENCIA_SOLICITADA', 'TRANSFERENCIA_APROVADA',
    'TRANSFERENCIA_REJEITADA', 'DEMANDA_CRIADA', 'DEMANDA_ATENDIDA'
  ] as [EventType, ...EventType[]]).optional(),
  institutionId: z.string().uuid('Invalid institution ID').optional(),
  userId: z.string().uuid('Invalid user ID').optional(),
  page: z.number().positive('Page must be positive').default(1),
  limit: z.number().positive('Limit must be positive').default(20),
  sortBy: z.string().default('timestamp'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Event ID Param Schema
export const eventIdParamSchema = z.object({
  id: z.string().uuid('Invalid event ID'),
});

// Verify Event Schema
export const verifyEventSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  hash: z.string().min(1, 'Hash is required'),
});

// Export types
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type EventQueryParams = z.infer<typeof eventQuerySchema>;
export type EventIdParams = z.infer<typeof eventIdParamSchema>;
export type VerifyEventInput = z.infer<typeof verifyEventSchema>;
