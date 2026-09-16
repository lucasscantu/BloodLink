import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { UserService } from '../services/user.service';
import { InstitutionService } from '../services/institution.service';
import { prisma } from '../prisma';
import bcrypt from 'bcrypt';
import { UserRole } from '../types';

describe('UserService', () => {
  let institutionId: string;

  beforeAll(async () => {
    // Create test institution
    const institution = await InstitutionService.create({
      name: 'Test Institution',
      code: 'TI-001',
      type: 'HEMOCENTRO',
      cnpj: '00000000000101',
      address: {
        street: 'Test Street',
        number: '123',
        neighborhood: 'Test',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345678',
        country: 'Test Country',
      },
      phone: '1234567890',
      email: 'test@institution.com',
      capacity: 100,
      isActive: true,
    });

    institutionId = institution.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.user.deleteMany();
    await prisma.institution.deleteMany();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const user = await UserService.create({
        name: 'Test User',
        email: 'test-user@test.com',
        password: 'TestPassword123!',
        role: 'HEMOCENTRO' as UserRole,
        institutionId,
        phone: '1234567890',
      });

      expect(user).toBeDefined();
      expect(user.name).toBe('Test User');
      expect(user.email).toBe('test-user@test.com');
      expect(user.role).toBe('HEMOCENTRO');
      expect(user.institutionId).toBe(institutionId);
      expect(user.password).toBeUndefined(); // Password should not be returned
    });

    it('should hash the password', async () => {
      const user = await UserService.create({
        name: 'Password Test User',
        email: 'password-test@test.com',
        password: 'TestPassword123!',
        role: 'HOSPITAL' as UserRole,
        institutionId,
      });

      // Get the raw user from database
      const rawUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(rawUser).toBeDefined();
      expect(rawUser?.password).not.toBe('TestPassword123!');
      expect(rawUser?.password).toBeDefined();

      // Verify password can be compared
      const isValid = await bcrypt.compare('TestPassword123!', rawUser?.password || '');
      expect(isValid).toBe(true);
    });

    it('should throw error for duplicate email', async () => {
      await UserService.create({
        name: 'User 1',
        email: 'duplicate@test.com',
        password: 'Password123!',
        role: 'HEMOCENTRO' as UserRole,
        institutionId,
      });

      await expect(
        UserService.create({
          name: 'User 2',
          email: 'duplicate@test.com',
          password: 'Password456!',
          role: 'HOSPITAL' as UserRole,
          institutionId,
        })
      ).rejects.toThrow('Email already in use');
    });

    it('should create user with all roles', async () => {
      const roles: UserRole[] = ['ADMIN', 'HEMOCENTRO', 'HOSPITAL', 'AUDITOR'];

      for (const role of roles) {
        const user = await UserService.create({
          name: `${role} User`,
          email: `${role.toLowerCase()}@test.com`,
          password: 'TestPassword123!',
          role,
          institutionId,
        });

        expect(user.role).toBe(role);
      }
    });
  });

  describe('getById', () => {
    it('should get user by ID', async () => {
      const created = await UserService.create({
        name: 'Get By ID Test',
        email: 'get-by-id@test.com',
        password: 'TestPassword123!',
        role: 'HEMOCENTRO' as UserRole,
        institutionId,
      });

      const user = await UserService.getById(created.id);

      expect(user).toBeDefined();
      expect(user?.id).toBe(created.id);
      expect(user?.email).toBe('get-by-id@test.com');
      expect(user?.password).toBeUndefined();
    });

    it('should return null for non-existent user', async () => {
      const user = await UserService.getById('non-existent-id');
      expect(user).toBeNull();
    });
  });

  describe('getByEmail', () => {
    it('should get user by email', async () => {
      await UserService.create({
        name: 'Get By Email Test',
        email: 'get-by-email@test.com',
        password: 'TestPassword123!',
        role: 'HEMOCENTRO' as UserRole,
        institutionId,
      });

      const user = await UserService.getByEmail('get-by-email@test.com');

      expect(user).toBeDefined();
      expect(user?.email).toBe('get-by-email@test.com');
    });

    it('should return null for non-existent email', async () => {
      const user = await UserService.getByEmail('non-existent@test.com');
      expect(user).toBeNull();
    });
  });

  describe('list', () => {
    it('should list users with pagination', async () => {
      // Create multiple users
      for (let i = 0; i < 15; i++) {
        await UserService.create({
          name: `List Test User ${i}`,
          email: `list-test-${i}@test.com`,
          password: 'TestPassword123!',
          role: ['HEMOCENTRO', 'HOSPITAL'][i % 2] as UserRole,
          institutionId,
        });
      }

      const result = await UserService.list({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(10);
      expect(result.meta.total).toBeGreaterThanOrEqual(15);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('should filter users by role', async () => {
      const result = await UserService.list({ role: 'HEMOCENTRO' as UserRole, limit: 100 });
      expect(result.data.every(user => user.role === 'HEMOCENTRO')).toBe(true);
    });

    it('should filter users by institution', async () => {
      const result = await UserService.list({ institutionId, limit: 100 });
      expect(result.data.every(user => user.institutionId === institutionId)).toBe(true);
    });

    it('should filter users by active status', async () => {
      const result = await UserService.list({ isActive: true, limit: 100 });
      expect(result.data.every(user => user.isActive === true)).toBe(true);
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const created = await UserService.create({
        name: 'Update Test',
        email: 'update-test@test.com',
        password: 'TestPassword123!',
        role: 'HEMOCENTRO' as UserRole,
        institutionId,
      });

      const updated = await UserService.update(created.id, {
        name: 'Updated Name',
        phone: '9999999999',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.phone).toBe('9999999999');
    });

    it('should update user password', async () => {
      const created = await UserService.create({
        name: 'Password Update Test',
        email: 'password-update@test.com',
        password: 'OldPassword123!',
        role: 'HEMOCENTRO' as UserRole,
        institutionId,
      });

      await UserService.update(created.id, {
        password: 'NewPassword456!',
      });

      // Verify new password
      const user = await prisma.user.findUnique({ where: { id: created.id } });
      const isValid = await bcrypt.compare('NewPassword456!', user?.password || '');
      expect(isValid).toBe(true);
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        UserService.update('non-existent-id', { name: 'New Name' })
      ).rejects.toThrow('User not found');
    });

    it('should throw error for duplicate email on update', async () => {
      const user1 = await UserService.create({
        name: 'User 1',
        email: 'user1-update@test.com',
        password: 'Password123!',
        role: 'HEMOCENTRO' as UserRole,
        institutionId,
      });

      const user2 = await UserService.create({
        name: 'User 2',
        email: 'user2-update@test.com',
        password: 'Password456!',
        role: 'HOSPITAL' as UserRole,
        institutionId,
      });

      await expect(
        UserService.update(user1.id, { email: 'user2-update@test.com' })
      ).rejects.toThrow('Email already in use');
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      const created = await UserService.create({
        name: 'Delete Test',
        email: 'delete-test@test.com',
        password: 'TestPassword123!',
        role: 'HEMOCENTRO' as UserRole,
        institutionId,
      });

      const deleted = await UserService.delete(created.id);

      expect(deleted.id).toBe(created.id);

      const user = await UserService.getById(created.id);
      expect(user).toBeNull();
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      await UserService.create({
        name: 'Login Test User',
        email: 'login-test@test.com',
        password: 'TestPassword123!',
        role: 'HEMOCENTRO' as UserRole,
        institutionId,
      });

      const result = await UserService.login({
        email: 'login-test@test.com',
        password: 'TestPassword123!',
      });

      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('login-test@test.com');
    });

    it('should throw error for invalid email', async () => {
      await expect(
        UserService.login({
          email: 'invalid@test.com',
          password: 'TestPassword123!',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for invalid password', async () => {
      await UserService.create({
        name: 'Password Test User',
        email: 'password-login@test.com',
        password: 'CorrectPassword123!',
        role: 'HEMOCENTRO' as UserRole,
        institutionId,
      });

      await expect(
        UserService.login({
          email: 'password-login@test.com',
          password: 'WrongPassword123!',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for inactive user', async () => {
      const user = await UserService.create({
        name: 'Inactive User',
        email: 'inactive@test.com',
        password: 'TestPassword123!',
        role: 'HEMOCENTRO' as UserRole,
        institutionId,
      });

      await UserService.toggleActive(user.id);

      await expect(
        UserService.login({
          email: 'inactive@test.com',
          password: 'TestPassword123!',
        })
      ).rejects.toThrow('User account is inactive');
    });

    it('should generate valid JWT token', async () => {
      await UserService.create({
        name: 'JWT Test User',
        email: 'jwt-test@test.com',
        password: 'TestPassword123!',
        role: 'ADMIN' as UserRole,
        institutionId,
      });

      const result = await UserService.login({
        email: 'jwt-test@test.com',
        password: 'TestPassword123!',
      });

      expect(result.token).toBeDefined();
      expect(result.token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('getByInstitution', () => {
    it('should get users by institution', async () => {
      const users = await UserService.getByInstitution(institutionId);
      expect(users.every(user => user.institutionId === institutionId)).toBe(true);
    });
  });

  describe('getByRole', () => {
    it('should get users by role', async () => {
      const users = await UserService.getByRole('HEMOCENTRO' as UserRole);
      expect(users.every(user => user.role === 'HEMOCENTRO')).toBe(true);
    });
  });

  describe('toggleActive', () => {
    it('should toggle user active status', async () => {
      const created = await UserService.create({
        name: 'Toggle Test',
        email: 'toggle-test@test.com',
        password: 'TestPassword123!',
        role: 'HEMOCENTRO' as UserRole,
        institutionId,
        isActive: true,
      });

      const toggled = await UserService.toggleActive(created.id);
      expect(toggled.isActive).toBe(false);

      const toggledAgain = await UserService.toggleActive(created.id);
      expect(toggledAgain.isActive).toBe(true);
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        UserService.toggleActive('non-existent-id')
      ).rejects.toThrow('User not found');
    });
  });

  describe('exists', () => {
    it('should check if user exists', async () => {
      const created = await UserService.create({
        name: 'Exists Test',
        email: 'exists-test@test.com',
        password: 'TestPassword123!',
        role: 'HEMOCENTRO' as UserRole,
        institutionId,
      });

      expect(await UserService.exists(created.id)).toBe(true);
      expect(await UserService.exists('non-existent-id')).toBe(false);
    });
  });

  describe('getStatistics', () => {
    it('should return user statistics', async () => {
      const stats = await UserService.getStatistics();

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.byRole).toBeDefined();
      expect(stats.active).toBeDefined();
      expect(stats.inactive).toBeDefined();
    });
  });
});
