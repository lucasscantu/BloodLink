import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { UserService } from '../services/user.service';
import { InstitutionService } from '../services/institution.service';
import { prisma } from '../prisma';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UserRole } from '../types';

describe('Authentication', () => {
  let institutionId: string;

  beforeAll(async () => {
    // Create test institution
    const institution = await InstitutionService.create({
      name: 'Test Institution',
      code: 'TI-AUTH-001',
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

  describe('User Registration', () => {
    it('should register a new user with valid data', async () => {
      const user = await UserService.create({
        name: 'Test User',
        email: 'test-auth@test.com',
        password: 'ValidPassword123!',
        role: 'HEMOCENTRO' as UserRole,
        institutionId,
      });

      expect(user).toBeDefined();
      expect(user.name).toBe('Test User');
      expect(user.email).toBe('test-auth@test.com');
      expect(user.role).toBe('HEMOCENTRO');
      expect(user.institutionId).toBe(institutionId);
    });

    it('should reject user with weak password', async () => {
      await expect(
        UserService.create({
          name: 'Weak Password User',
          email: 'weak-password@test.com',
          password: 'weak', // Too short, no requirements
          role: 'HEMOCENTRO' as UserRole,
          institutionId,
        })
      ).rejects.toBeDefined();
    });

    it('should reject user with invalid email', async () => {
      await expect(
        UserService.create({
          name: 'Invalid Email User',
          email: 'invalid-email', // Not a valid email
          password: 'ValidPassword123!',
          role: 'HEMOCENTRO' as UserRole,
          institutionId,
        })
      ).rejects.toBeDefined();
    });

    it('should reject duplicate email', async () => {
      await UserService.create({
        name: 'User 1',
        email: 'duplicate-auth@test.com',
        password: 'ValidPassword123!',
        role: 'HEMOCENTRO' as UserRole,
        institutionId,
      });

      await expect(
        UserService.create({
          name: 'User 2',
          email: 'duplicate-auth@test.com',
          password: 'ValidPassword456!',
          role: 'HOSPITAL' as UserRole,
          institutionId,
        })
      ).rejects.toThrow('Email already in use');
    });
  });

  describe('User Login', () => {
    it('should login with valid credentials', async () => {
      await UserService.create({
        name: 'Login Test User',
        email: 'login-auth@test.com',
        password: 'TestPassword123!',
        role: 'HEMOCENTRO' as UserRole,
        institutionId,
      });

      const result = await UserService.login({
        email: 'login-auth@test.com',
        password: 'TestPassword123!',
      });

      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('login-auth@test.com');
    });

    it('should reject login with invalid email', async () => {
      await expect(
        UserService.login({
          email: 'invalid-auth@test.com',
          password: 'TestPassword123!',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should reject login with invalid password', async () => {
      await UserService.create({
        name: 'Password Test User',
        email: 'password-auth@test.com',
        password: 'CorrectPassword123!',
        role: 'HEMOCENTRO' as UserRole,
        institutionId,
      });

      await expect(
        UserService.login({
          email: 'password-auth@test.com',
          password: 'WrongPassword123!',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should reject login for inactive user', async () => {
      const user = await UserService.create({
        name: 'Inactive User',
        email: 'inactive-auth@test.com',
        password: 'TestPassword123!',
        role: 'HEMOCENTRO' as UserRole,
        institutionId,
      });

      await UserService.toggleActive(user.id);

      await expect(
        UserService.login({
          email: 'inactive-auth@test.com',
          password: 'TestPassword123!',
        })
      ).rejects.toThrow('User account is inactive');
    });
  });

  describe('JWT Token', () => {
    it('should generate valid JWT token on login', async () => {
      await UserService.create({
        name: 'JWT Test User',
        email: 'jwt-auth@test.com',
        password: 'TestPassword123!',
        role: 'ADMIN' as UserRole,
        institutionId,
      });

      const result = await UserService.login({
        email: 'jwt-auth@test.com',
        password: 'TestPassword123!',
      });

      expect(result.token).toBeDefined();
      
      // Verify JWT structure
      const parts = result.token.split('.');
      expect(parts).toHaveLength(3);
      
      // Verify header
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
      expect(header.alg).toBe('HS256');
      expect(header.typ).toBe('JWT');

      // Verify payload
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      expect(payload.id).toBeDefined();
      expect(payload.email).toBe('jwt-auth@test.com');
      expect(payload.role).toBe('ADMIN');
      expect(payload.institutionId).toBe(institutionId);
    });

    it('should verify JWT token signature', async () => {
      await UserService.create({
        name: 'Verify Test User',
        email: 'verify-auth@test.com',
        password: 'TestPassword123!',
        role: 'HEMOCENTRO' as UserRole,
        institutionId,
      });

      const result = await UserService.login({
        email: 'verify-auth@test.com',
        password: 'TestPassword123!',
      });

      const payload = jwt.verify(result.token, config.jwt.secret);
      
      expect(payload).toBeDefined();
      expect((payload as any).email).toBe('verify-auth@test.com');
    });

    it('should have expiration time in JWT', async () => {
      await UserService.create({
        name: 'Expiration Test User',
        email: 'expiration-auth@test.com',
        password: 'TestPassword123!',
        role: 'HEMOCENTRO' as UserRole,
        institutionId,
      });

      const result = await UserService.login({
        email: 'expiration-auth@test.com',
        password: 'TestPassword123!',
      });

      const payload = JSON.parse(Buffer.from(result.token.split('.')[1], 'base64').toString());
      expect(payload.exp).toBeDefined();
      
      // Check if expiration is in the future
      const now = Math.floor(Date.now() / 1000);
      expect(payload.exp).toBeGreaterThan(now);
    });
  });

  describe('User Roles', () => {
    it('should create users with all roles', async () => {
      const roles: UserRole[] = ['ADMIN', 'HEMOCENTRO', 'HOSPITAL', 'AUDITOR'];

      for (const role of roles) {
        const user = await UserService.create({
          name: `${role} User`,
          email: `${role.toLowerCase()}-auth@test.com`,
          password: 'TestPassword123!',
          role,
          institutionId,
        });

        expect(user.role).toBe(role);
      }
    });

    it('should login users with all roles', async () => {
      const roles: UserRole[] = ['ADMIN', 'HEMOCENTRO', 'HOSPITAL', 'AUDITOR'];

      for (const role of roles) {
        await UserService.create({
          name: `${role} Login User`,
          email: `${role.toLowerCase()}-login-auth@test.com`,
          password: 'TestPassword123!',
          role,
          institutionId,
        });

        const result = await UserService.login({
          email: `${role.toLowerCase()}-login-auth@test.com`,
          password: 'TestPassword123!',
        });

        const payload = JSON.parse(Buffer.from(result.token.split('.')[1], 'base64').toString());
        expect(payload.role).toBe(role);
      }
    });
  });

  describe('Password Hashing', () => {
    it('should hash password on creation', async () => {
      const user = await UserService.create({
        name: 'Hash Test User',
        email: 'hash-auth@test.com',
        password: 'TestPassword123!',
        role: 'HEMOCENTRO' as UserRole,
        institutionId,
      });

      // Get raw user from database
      const rawUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(rawUser?.password).not.toBe('TestPassword123!');
      expect(rawUser?.password).toBeDefined();

      // Verify password can be compared
      const isValid = await bcrypt.compare('TestPassword123!', rawUser?.password || '');
      expect(isValid).toBe(true);
    });

    it('should hash password on update', async () => {
      const user = await UserService.create({
        name: 'Update Hash Test User',
        email: 'update-hash-auth@test.com',
        password: 'OldPassword123!',
        role: 'HEMOCENTRO' as UserRole,
        institutionId,
      });

      await UserService.update(user.id, {
        password: 'NewPassword456!',
      });

      const rawUser = await prisma.user.findUnique({ where: { id: user.id } });
      const isValid = await bcrypt.compare('NewPassword456!', rawUser?.password || '');
      expect(isValid).toBe(true);
    });
  });

  describe('User Management', () => {
    it('should get user by ID', async () => {
      const created = await UserService.create({
        name: 'Get By ID User',
        email: 'get-by-id-auth@test.com',
        password: 'TestPassword123!',
        role: 'HEMOCENTRO' as UserRole,
        institutionId,
      });

      const user = await UserService.getById(created.id);
      expect(user?.id).toBe(created.id);
      expect(user?.password).toBeUndefined();
    });

    it('should list users by institution', async () => {
      const users = await UserService.getByInstitution(institutionId);
      expect(users.every(user => user.institutionId === institutionId)).toBe(true);
    });

    it('should list users by role', async () => {
      const users = await UserService.getByRole('HEMOCENTRO' as UserRole);
      expect(users.every(user => user.role === 'HEMOCENTRO')).toBe(true);
    });

    it('should toggle user active status', async () => {
      const user = await UserService.create({
        name: 'Toggle User',
        email: 'toggle-auth@test.com',
        password: 'TestPassword123!',
        role: 'HEMOCENTRO' as UserRole,
        institutionId,
        isActive: true,
      });

      const toggled = await UserService.toggleActive(user.id);
      expect(toggled.isActive).toBe(false);

      const toggledAgain = await UserService.toggleActive(user.id);
      expect(toggledAgain.isActive).toBe(true);
    });

    it('should update user information', async () => {
      const user = await UserService.create({
        name: 'Update User',
        email: 'update-auth@test.com',
        password: 'TestPassword123!',
        role: 'HEMOCENTRO' as UserRole,
        institutionId,
        phone: '1234567890',
      });

      const updated = await UserService.update(user.id, {
        name: 'Updated Name',
        phone: '9999999999',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.phone).toBe('9999999999');
    });

    it('should delete user', async () => {
      const user = await UserService.create({
        name: 'Delete User',
        email: 'delete-auth@test.com',
        password: 'TestPassword123!',
        role: 'HEMOCENTRO' as UserRole,
        institutionId,
      });

      const deleted = await UserService.delete(user.id);
      expect(deleted.id).toBe(user.id);

      const userAfterDelete = await UserService.getById(user.id);
      expect(userAfterDelete).toBeNull();
    });
  });
});

// Import bcrypt for password verification
import bcrypt from 'bcrypt';
