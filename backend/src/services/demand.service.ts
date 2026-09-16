import { Prisma, Demand } from '@prisma/client';
import { prisma } from '../prisma';
import { blockchainService } from '../blockchain/BlockchainService';
import { generateEventHash } from '../utils/hash.utils';
import { DemandStatus, DemandUrgency, BloodType, EventType } from '../types';
import { CreateDemandInput, UpdateDemandInput, DemandQueryParams } from '../schemas';

interface DemandWithInstitution extends Demand {
  institution?: { id: string; name: string; type: string };
  bloodBags?: any[];
}

export class DemandService {
  /**
   * Create a new demand
   */
  static async create(data: CreateDemandInput & { createdBy: string }): Promise<DemandWithInstitution> {
    const transaction = await prisma.$transaction(async (tx) => {
      // Generate hash
      const hash = generateEventHash(
        '', // id will be generated
        'DEMANDA_CRIADA' as EventType,
        data.institutionId,
        data.createdBy,
        new Date(),
        { bloodType: data.bloodType, quantity: data.quantity, urgency: data.urgency }
      );

      // Create demand
      const demand = await tx.demand.create({
        data: {
          institutionId: data.institutionId,
          bloodType: data.bloodType,
          quantity: data.quantity,
          urgency: data.urgency,
          reason: data.reason,
          status: 'ABERTA' as DemandStatus,
          notes: data.notes,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
          hash,
        },
        include: {
          institution: {
            select: { id: true, name: true, type: true },
          },
        },
      });

      // Register on blockchain
      try {
        await blockchainService.registerDemand(demand);
      } catch (blockchainError) {
        console.error('Blockchain registration failed:', blockchainError);
      }

      return demand;
    });

    return this.getById(transaction.id);
  }

  /**
   * Get demand by ID
   */
  static async getById(id: string): Promise<DemandWithInstitution | null> {
    const demand = await prisma.demand.findUnique({
      where: { id },
      include: {
        institution: {
          select: { id: true, name: true, type: true },
        },
        transferRequests: {
          include: {
            bloodBag: true,
            fromInstitution: { select: { id: true, name: true } },
            toInstitution: { select: { id: true, name: true } },
          },
        },
      },
    });

    return demand as DemandWithInstitution | null;
  }

  /**
   * List all demands with filters
   */
  static async list(params: DemandQueryParams): Promise<{
    data: DemandWithInstitution[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = params;

    const where: Prisma.DemandWhereInput = {};

    if (filters.institutionId) {
      where.institutionId = filters.institutionId;
    }
    if (filters.bloodType) {
      where.bloodType = filters.bloodType as BloodType;
    }
    if (filters.status) {
      where.status = filters.status as DemandStatus;
    }
    if (filters.urgency) {
      where.urgency = filters.urgency as DemandUrgency;
    }

    const [demands, total] = await Promise.all([
      prisma.demand.findMany({
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
      prisma.demand.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: demands as DemandWithInstitution[],
      meta: { total, page, limit, totalPages },
    };
  }

  /**
   * Update demand
   */
  static async update(
    id: string,
    data: UpdateDemandInput & { updatedBy: string }
  ): Promise<DemandWithInstitution> {
    const existingDemand = await this.getById(id);
    if (!existingDemand) {
      throw new Error('Demand not found');
    }

    const transaction = await prisma.$transaction(async (tx) => {
      // Generate new hash if critical fields changed
      let hash = existingDemand.hash;
      const criticalFields = ['bloodType', 'quantity', 'urgency', 'status'];
      const hasCriticalChange = criticalFields.some(
        (field) => data[field as keyof UpdateDemandInput] !== undefined
      );

      if (hasCriticalChange) {
        hash = generateEventHash(
          id,
          'DEMANDA_ATUALIZADA' as EventType,
          existingDemand.institutionId,
          data.updatedBy,
          new Date(),
          { ...existingDemand, ...data }
        );
      }

      // Update demand
      const updatedDemand = await tx.demand.update({
        where: { id },
        data: {
          ...data,
          hash,
          updatedAt: new Date(),
        },
        include: {
          institution: {
            select: { id: true, name: true, type: true },
          },
        },
      });

      // Register on blockchain if status changed
      if (data.status && data.status !== existingDemand.status) {
        try {
          await blockchainService.updateDemandStatus(id, data.status, hash);
        } catch (blockchainError) {
          console.error('Blockchain update failed:', blockchainError);
        }
      }

      return updatedDemand;
    });

    return this.getById(transaction.id);
  }

  /**
   * Delete demand
   */
  static async delete(id: string, deletedBy: string): Promise<Demand> {
    const existingDemand = await this.getById(id);
    if (!existingDemand) {
      throw new Error('Demand not found');
    }

    return prisma.demand.delete({ where: { id } });
  }

  /**
   * Update demand status
   */
  static async updateStatus(
    id: string,
    status: DemandStatus,
    userId: string
  ): Promise<DemandWithInstitution> {
    const existingDemand = await this.getById(id);
    if (!existingDemand) {
      throw new Error('Demand not found');
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const hash = generateEventHash(
        id,
        `DEMANDA_${status}` as EventType,
        existingDemand.institutionId,
        userId,
        new Date(),
        { from: existingDemand.status, to: status }
      );

      const updatedDemand = await tx.demand.update({
        where: { id },
        data: {
          status,
          hash,
          updatedAt: new Date(),
        },
        include: {
          institution: {
            select: { id: true, name: true, type: true },
          },
        },
      });

      // Register on blockchain
      try {
        await blockchainService.updateDemandStatus(id, status, hash);
      } catch (blockchainError) {
        console.error('Blockchain update failed:', blockchainError);
      }

      return updatedDemand;
    });

    return this.getById(transaction.id);
  }

  /**
   * Get demands by institution
   */
  static async getByInstitution(
    institutionId: string,
    status?: DemandStatus
  ): Promise<DemandWithInstitution[]> {
    const where: Prisma.DemandWhereInput = {
      institutionId,
    };

    if (status) {
      where.status = status;
    }

    return prisma.demand.findMany({
      where,
      include: {
        institution: {
          select: { id: true, name: true, type: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }) as Promise<DemandWithInstitution[]>;
  }

  /**
   * Get open demands
   */
  static async getOpenDemands(): Promise<DemandWithInstitution[]> {
    return this.getByInstitution('', 'ABERTA') as Promise<DemandWithInstitution[]>;
  }

  /**
   * Get urgent demands
   */
  static async getUrgentDemands(): Promise<DemandWithInstitution[]> {
    return prisma.demand.findMany({
      where: {
        status: 'ABERTA' as DemandStatus,
        urgency: { in: ['ALTA', 'EMERGENCIA'] },
      },
      include: {
        institution: {
          select: { id: true, name: true, type: true },
        },
      },
      orderBy: [{ urgency: 'desc' }, { createdAt: 'asc' }],
    }) as Promise<DemandWithInstitution[]>;
  }

  /**
   * Find matching blood bags for a demand
   */
  static async findMatchingBloodBags(
    demandId: string
  ): Promise<{
    demand: DemandWithInstitution;
    compatibleInstitutions: {
      institution: { id: string; name: string; type: string };
      bags: any[];
      totalAvailable: number;
    }[];
  }> {
    const demand = await this.getById(demandId);
    if (!demand) {
      throw new Error('Demand not found');
    }

    // Find compatible blood bags (excluding the requesting institution)
    const compatibleInstitutions = await prisma.institution.findMany({
      where: {
        id: { not: demand.institutionId },
      },
      include: {
        bloodBags: {
          where: {
            bloodType: demand.bloodType,
            status: { in: ['DISPONIVEL', 'ARMAZENADA'] },
            expirationDate: { gt: new Date() },
          },
          orderBy: { expirationDate: 'asc' },
        },
      },
    });

    const result = compatibleInstitutions
      .filter((institution) => institution.bloodBags.length > 0)
      .map((institution) => ({
        institution: {
          id: institution.id,
          name: institution.name,
          type: institution.type,
        },
        bags: institution.bloodBags,
        totalAvailable: institution.bloodBags.length,
      }));

    return {
      demand: demand as DemandWithInstitution,
      compatibleInstitutions: result,
    };
  }

  /**
   * Check if demand exists
   */
  static async exists(id: string): Promise<boolean> {
    const count = await prisma.demand.count({ where: { id } });
    return count > 0;
  }

  /**
   * Get demand statistics
   */
  static async getStatistics(institutionId?: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byBloodType: Record<string, number>;
    byUrgency: Record<string, number>;
    open: number;
    attended: number;
    expired: number;
  }> {
    const where: Prisma.DemandWhereInput = {};
    if (institutionId) {
      where.institutionId = institutionId;
    }

    const [total, byStatus, byBloodType, byUrgency, open, attended, expired] = await Promise.all([
      prisma.demand.count({ where }),
      prisma.demand.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      prisma.demand.groupBy({
        by: ['bloodType'],
        where,
        _count: { _all: true },
      }),
      prisma.demand.groupBy({
        by: ['urgency'],
        where,
        _count: { _all: true },
      }),
      prisma.demand.count({ where: { ...where, status: 'ABERTA' as DemandStatus } }),
      prisma.demand.count({ where: { ...where, status: { in: ['ATENDIDA', 'PARCIALMENTE_ATENDIDA'] } } }),
      prisma.demand.count({ where: { ...where, status: 'EXPIRADA' as DemandStatus } }),
    ]);

    const statusCount: Record<string, number> = {};
    byStatus.forEach((group) => {
      statusCount[group.status] = group._count._all;
    });

    const bloodTypeCount: Record<string, number> = {};
    byBloodType.forEach((group) => {
      bloodTypeCount[group.bloodType] = group._count._all;
    });

    const urgencyCount: Record<string, number> = {};
    byUrgency.forEach((group) => {
      urgencyCount[group.urgency] = group._count._all;
    });

    return {
      total,
      byStatus: statusCount,
      byBloodType: bloodTypeCount,
      byUrgency: urgencyCount,
      open,
      attended,
      expired,
    };
  }
}
