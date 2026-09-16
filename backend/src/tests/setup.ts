import { config } from '../config';
import { prisma } from '../prisma';

// Jest setup file
// This runs before each test file

beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Ensure database is connected
  await prisma.$connect();
});

afterAll(async () => {
  // Disconnect from database
  await prisma.$disconnect();
});

// Global error handler for tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Mock console methods in tests if needed
// jest.spyOn(console, 'log').mockImplementation(() => {});
// jest.spyOn(console, 'error').mockImplementation(() => {});
// jest.spyOn(console, 'warn').mockImplementation(() => {});

// Export for use in tests
export { config, prisma };
