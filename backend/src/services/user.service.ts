import { Prisma, User } from '@prisma/client';
import { prisma } from '../prisma';
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
import { config } from '../config';
import { UserRole } from '../types';
import { CreateUserInput, UpdateUserInput, UserLoginInput, UserQueryParams } from '../schemas';

interface UserWithInstitution extends User {
  institution?: { id: string; name: string; type: string };
}

export class UserService {
  /**
   * Create a new user
   */
  static async create(data: CreateUserInput): Promise<UserWithInstitution> {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('Email already in use');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        institutionId: data.institutionId,
        phone: data.phone,
        medicalLicense: data.medicalLicense,
        isActive: true,
      },
      include: {
        institution: {
          select: { id: true, name: true, type: true },
        },
      },
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as UserWithInstitution;
  }

  /**
   * Get user by ID
   */
  static async getById(id: string): Promise<UserWithInstitution | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        institution: {
          select: { id: true, name: true, type: true },
        },
      },
    });

    if (!user) return null;

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as UserWithInstitution;
  }

  /**
   * Get user by email
   */
  static async getByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  /**
   * List all users with filters
   */
  static async list(params: UserQueryParams): Promise<{
    data: UserWithInstitution[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = params;

    const where: Prisma.UserWhereInput = {};

    if (filters.role) {
      where.role = filters.role as UserRole;
    }
    if (filters.institutionId) {
      where.institutionId = filters.institutionId;
    }
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          institution: {
            select: { id: true, name: true, type: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Remove passwords from response
    const usersWithoutPassword = users.map((user) => {
      const { password, ...rest } = user;
      return rest as UserWithInstitution;
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: usersWithoutPassword,
      meta: { total, page, limit, totalPages },
    };
  }

  /**
   * Update user
   */
  static async update(id: string, data: UpdateUserInput): Promise<UserWithInstitution> {
    const existingUser = await this.getById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Check if email is being changed and if it's already in use
    if (data.email && data.email !== existingUser.email) {
      const userWithEmail = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (userWithEmail && userWithEmail.id !== id) {
        throw new Error('Email already in use');
      }
    }

    // Hash password if provided
    const updateData: Prisma.UserUpdateInput = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        institution: {
          select: { id: true, name: true, type: true },
        },
      },
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as UserWithInstitution;
  }

  /**
   * Delete user
   */
  static async delete(id: string): Promise<UserWithInstitution> {
    const user = await prisma.user.delete({
      where: { id },
      include: {
        institution: {
          select: { id: true, name: true, type: true },
        },
      },
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as UserWithInstitution;
  }

  /**
   * Login user
   */
  static async login(data: UserLoginInput): Promise<{ user: UserWithInstitution; token: string }> {
    const user = await this.getByEmail(data.email);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('User account is inactive');
    }

    // Check password
    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        institutionId: user.institutionId,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Get user with institution
    const userWithInstitution = await this.getById(user.id);

    if (!userWithInstitution) {
      throw new Error('User not found');
    }

    return { user: userWithInstitution, token };
  }

  /**
   * Get users by institution
   */
  static async getByInstitution(institutionId: string): Promise<UserWithInstitution[]> {
    const users = await prisma.user.findMany({
      where: { institutionId },
      include: {
        institution: {
          select: { id: true, name: true, type: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return users.map((user) => {
      const { password, ...rest } = user;
      return rest as UserWithInstitution;
    });
  }

  /**
   * Get users by role
   */
  static async getByRole(role: UserRole): Promise<UserWithInstitution[]> {
    const users = await prisma.user.findMany({
      where: { role },
      include: {
        institution: {
          select: { id: true, name: true, type: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return users.map((user) => {
      const { password, ...rest } = user;
      return rest as UserWithInstitution;
    });
  }

  /**
   * Toggle user active status
   */
  static async toggleActive(id: string): Promise<UserWithInstitution> {
    const existingUser = await this.getById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: !existingUser.isActive },
      include: {
        institution: {
          select: { id: true, name: true, type: true },
        },
      },
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as UserWithInstitution;
  }

  /**
   * Check if user exists
   */
  static async exists(id: string): Promise<boolean> {
    const count = await prisma.user.count({ where: { id } });
    return count > 0;
  }

  /**
   * Get user statistics
   */
  static async getStatistics(): Promise<{
    total: number;
    byRole: Record<string, number>;
    active: number;
    inactive: number;
  }> {
    const [total, byRole, active, inactive] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({
        by: ['role'],
        _count: { _all: true },
      }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
    ]);

    const roleCount: Record<string, number> = {};
    byRole.forEach((group) => {
      roleCount[group.role] = group._count._all;
    });

    return {
      total,
      byRole: roleCount,
      active,
      inactive,
    };
  }
}
