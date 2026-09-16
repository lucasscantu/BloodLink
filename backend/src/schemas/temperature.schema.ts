import { z } from 'zod';

// Create Temperature Reading Schema
export const createTemperatureSchema = z.object({
  bagId: z.string().uuid('Invalid blood bag ID'),
  temperature: z.number().min(-100, 'Temperature too low').max(100, 'Temperature too high'),
  unit: z.enum(['C', 'F']).default('C'),
  alertThreshold: z.number().optional(),
  notes: z.string().optional(),
});

// Temperature Query Schema
export const temperatureQuerySchema = z.object({
  bagId: z.string().uuid('Invalid blood bag ID').optional(),
  institutionId: z.string().uuid('Invalid institution ID').optional(),
  minTemp: z.number().optional(),
  maxTemp: z.number().optional(),
  from: z.string().datetime('Invalid date format').optional(),
  to: z.string().datetime('Invalid date format').optional(),
  page: z.number().positive('Page must be positive').default(1),
  limit: z.number().positive('Limit must be positive').default(50),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Temperature Alert Schema
export const temperatureAlertSchema = z.object({
  bagId: z.string().uuid('Invalid blood bag ID'),
  currentTemp: z.number(),
  minTemp: z.number().default(2),
  maxTemp: z.number().default(6),
});

// Export types
export type CreateTemperatureInput = z.infer<typeof createTemperatureSchema>;
export type TemperatureQueryParams = z.infer<typeof temperatureQuerySchema>;
export type TemperatureAlertInput = z.infer<typeof temperatureAlertSchema>;
