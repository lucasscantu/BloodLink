import { Prisma, Institution } from '@prisma/client';
import { prisma } from '../prisma';
import { InstitutionType } from '../types';
import { CreateInstitutionInput, UpdateInstitutionInput, InstitutionQueryParams } from '../schemas';

export class InstitutionService {
  /**
   * Create a new institution
   */
  static async create(data: CreateInstitutionInput): Promise<Institution> {
    // Check if code already exists
    const existingInstitution = await prisma.institution.findUnique({
      where: { code: data.code },
    });

    if (existingInstitution) {
      throw new Error('Code already in use');
    }

    return prisma.institution.create({
      data: {
        name: data.name,
        code: data.code,
        type: data.type,
        cnpj: data.cnpj,
        address: data.address,
        phone: data.phone,
        email: data.email,
        latitude: data.latitude,
        longitude: data.longitude,
        capacity: data.capacity || 100,
        isActive: data.isActive !== undefined ? data.isActive : true,
        notes: data.notes,
      },
    });
  }

  /**
   * Get institution by ID
   */
  static async getById(id: string): Promise<Institution | null> {
    return prisma.institution.findUnique({ where: { id } });
  }

  /**
   * Get institution by code
   */
  static async getByCode(code: string): Promise<Institution | null> {
    return prisma.institution.findUnique({ where: { code } });
  }

  /**
   * List all institutions with filters
   */
  static async list(params: InstitutionQueryParams): Promise<{
    data: Institution[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc', ...filters } = params;

    const where: Prisma.InstitutionWhereInput = {};

    if (filters.type) {
      where.type = filters.type as InstitutionType;
    }
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters.city) {
      where.address = { path: ['city'], string_contains: filters.city, mode: 'insensitive' };
    }
    if (filters.state) {
      where.address = { path: ['state'], string_contains: filters.state, mode: 'insensitive' };
    }

    const [institutions, total] = await Promise.all([
      prisma.institution.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.institution.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: institutions,
      meta: { total, page, limit, totalPages },
    };
  }

  /**
   * Update institution
   */
  static async update(id: string, data: UpdateInstitutionInput): Promise<Institution> {
    const existingInstitution = await this.getById(id);
    if (!existingInstitution) {
      throw new Error('Institution not found');
    }

    // Check if code is being changed and if it's already in use
    if (data.code && data.code !== existingInstitution.code) {
      const institutionWithCode = await prisma.institution.findUnique({
        where: { code: data.code },
      });
      if (institutionWithCode && institutionWithCode.id !== id) {
        throw new Error('Code already in use');
      }
    }

    return prisma.institution.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete institution
   */
  static async delete(id: string): Promise<Institution> {
    return prisma.institution.delete({ where: { id } });
  }

  /**
   * Get institutions by type
   */
  static async getByType(type: InstitutionType): Promise<Institution[]> {
    return prisma.institution.findMany({
      where: { type },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get blood centers (HEMOCENTRO)
   */
  static async getBloodCenters(): Promise<Institution[]> {
    return this.getByType('HEMOCENTRO');
  }

  /**
   * Get hospitals
   */
  static async getHospitals(): Promise<Institution[]> {
    return this.getByType('HOSPITAL');
  }

  /**
   * Check if institution exists
   */
  static async exists(id: string): Promise<boolean> {
    const count = await prisma.institution.count({ where: { id } });
    return count > 0;
  }

  /**
   * Get institution statistics
   */
  static async getStatistics(): Promise<{
    total: number;
    byType: Record<string, number>;
    active: number;
    inactive: number;
    totalCapacity: number;
  }> {
    const [total, byType, active, inactive] = await Promise.all([
      prisma.institution.count(),
      prisma.institution.groupBy({
        by: ['type'],
        _count: { _all: true },
        _sum: { capacity: true },
      }),
      prisma.institution.count({ where: { isActive: true } }),
      prisma.institution.count({ where: { isActive: false } }),
    ]);

    const typeCount: Record<string, number> = {};
    let totalCapacity = 0;
    byType.forEach((group) => {
      typeCount[group.type] = group._count._all;
      totalCapacity += group._sum.capacity || 0;
    });

    return {
      total,
      byType: typeCount,
      active,
      inactive,
      totalCapacity,
    };
  }

  /**
   * Get institution with blood bag counts
   */
  static async getWithBloodBagCounts(): Promise<{
    id: string;
    name: string;
    code: string;
    type: InstitutionType;
    totalBags: number;
    availableBags: number;
  }[]> {
    const institutions = await prisma.institution.findMany({
      include: {
        _count: {
          select: {
            bloodBags: true,
            bloodBagsAvailable: {
              where: { status: { in: ['DISPONIVEL', 'ARMAZENADA'] } },
            },
          },
        },
      },
    });

    return institutions.map((institution) => ({
      id: institution.id,
      name: institution.name,
      code: institution.code,
      type: institution.type,
      totalBags: institution._count.bloodBags,
      availableBags: institution._count.bloodBagsAvailable,
    }));
  }
}
