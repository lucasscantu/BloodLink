import { Prisma, BloodBag, Event, TemperatureReading } from '@prisma/client';
import { prisma } from '../prisma';
import { blockchainService } from '../blockchain/BlockchainService';
import { generateBloodBagHash, generateEventHash } from '../utils/hash.utils';
import { generateQRCode } from '../utils/qrcode.utils';
import { BagStatus, EventType } from '../types';
import { CreateBloodBagInput, UpdateBloodBagInput, BloodBagQueryParams } from '../schemas';

interface BloodBagWithEvents extends BloodBag {
  events?: Event[];
  temperatureReadings?: TemperatureReading[];
}

export class BloodBagService {
  /**
   * Create a new blood bag
   */
  static async create(data: CreateBloodBagInput & { createdBy: string }): Promise<BloodBagWithEvents> {
    const transaction = await prisma.$transaction(async (tx) => {
      // Generate unique code
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      const code = `${data.bloodType}-${datePart}-${randomPart}`;

      // Generate hash
      const hash = generateBloodBagHash(
        '', // id will be generated
        code,
        data.bloodType,
        data.factorRh || false,
        new Date(data.collectionDate),
        new Date(data.expirationDate)
      );

      // Generate QR Code
      const qrCode = await generateQRCode(code);

      // Create blood bag
      const bag = await tx.bloodBag.create({
        data: {
          code,
          bloodType: data.bloodType,
          factorRh: data.factorRh || false,
          collectionDate: new Date(data.collectionDate),
          expirationDate: new Date(data.expirationDate),
          volume: data.volume || 450,
          currentInstitutionId: data.currentInstitutionId,
          currentLocation: data.currentLocation || 'Unknown',
          currentTemperature: data.currentTemperature,
          status: 'COLETADA' as BagStatus,
          hash,
          qrCode,
          donorId: data.donorId,
          notes: data.notes,
        },
      });

      // Register event on blockchain
      try {
        const eventHash = generateEventHash(
          bag.id,
          'COLETA' as EventType,
          bag.currentInstitutionId,
          data.createdBy,
          new Date(),
          { code, bloodType: bag.bloodType }
        );

        await blockchainService.registerEvent(
          bag.id,
          'COLETA',
          `Coleta realizada: ${code}`,
          bag.currentInstitutionId,
          data.createdBy,
          eventHash
        );

        // Register blood bag on blockchain
        await blockchainService.registerBloodBag(bag);
      } catch (blockchainError) {
        console.error('Blockchain registration failed:', blockchainError);
      }

      // Create initial event in database
      await tx.event.create({
        data: {
          bagId: bag.id,
          eventType: 'COLETA' as EventType,
          description: `Coleta realizada: ${code}`,
          institutionId: bag.currentInstitutionId,
          userId: data.createdBy,
          hash: generateEventHash(
            bag.id,
            'COLETA',
            bag.currentInstitutionId,
            data.createdBy,
            new Date(),
            { code }
          ),
          blockchainTransactionId: '',
        },
      });

      return bag;
    });

    return this.getById(transaction.id);
  }

  /**
   * Get blood bag by ID
   */
  static async getById(id: string): Promise<BloodBagWithEvents | null> {
    const bag = await prisma.bloodBag.findUnique({
      where: { id },
      include: {
        events: {
          orderBy: { timestamp: 'desc' },
        },
        temperatureReadings: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return bag as BloodBagWithEvents | null;
  }

  /**
   * Get blood bag by code
   */
  static async getByCode(code: string): Promise<BloodBagWithEvents | null> {
    const bag = await prisma.bloodBag.findUnique({
      where: { code },
      include: {
        events: {
          orderBy: { timestamp: 'desc' },
        },
        temperatureReadings: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return bag as BloodBagWithEvents | null;
  }

  /**
   * List all blood bags with filters
   */
  static async list(params: BloodBagQueryParams): Promise<{
    data: BloodBag[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = params;

    const where: Prisma.BloodBagWhereInput = {};

    if (filters.bloodType) {
      where.bloodType = filters.bloodType;
    }
    if (filters.factorRh !== undefined) {
      where.factorRh = filters.factorRh;
    }
    if (filters.status) {
      where.status = filters.status as BagStatus;
    }
    if (filters.currentInstitutionId) {
      where.currentInstitutionId = filters.currentInstitutionId;
    }

    const [bags, total] = await Promise.all([
      prisma.bloodBag.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.bloodBag.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: bags,
      meta: { total, page, limit, totalPages },
    };
  }

  /**
   * Update blood bag
   */
  static async update(
    id: string,
    data: UpdateBloodBagInput & { updatedBy: string }
  ): Promise<BloodBagWithEvents> {
    const existingBag = await this.getById(id);
    if (!existingBag) {
      throw new Error('Blood bag not found');
    }

    const transaction = await prisma.$transaction(async (tx) => {
      // Generate new hash if critical fields changed
      let hash = existingBag.hash;
      const changedFields = Object.keys(data) as (keyof UpdateBloodBagInput)[];
      
      const criticalFields = ['bloodType', 'factorRh', 'collectionDate', 'expirationDate'];
      const hasCriticalChange = criticalFields.some(field => 
        changedFields.includes(field as keyof UpdateBloodBagInput) &&
        data[field as keyof UpdateBloodBagInput] !== undefined
      );

      if (hasCriticalChange) {
        hash = generateBloodBagHash(
          id,
          existingBag.code,
          (data.bloodType || existingBag.bloodType) as string,
          (data.factorRh ?? existingBag.factorRh) as boolean,
          new Date(data.collectionDate || existingBag.collectionDate),
          new Date(data.expirationDate || existingBag.expirationDate)
        );
      }

      // Update blood bag
      const updatedBag = await tx.bloodBag.update({
        where: { id },
        data: {
          ...data,
          hash,
          updatedAt: new Date(),
        },
      });

      // Register event for status change
      if (data.status && data.status !== existingBag.status) {
        const eventHash = generateEventHash(
          id,
          `STATUS_CHANGE` as EventType,
          updatedBag.currentInstitutionId,
          data.updatedBy,
          new Date(),
          { from: existingBag.status, to: data.status }
        );

        await tx.event.create({
          data: {
            bagId: id,
            eventType: `STATUS_CHANGE` as EventType,
            description: `Status changed from ${existingBag.status} to ${data.status}`,
            institutionId: updatedBag.currentInstitutionId,
            userId: data.updatedBy,
            hash: eventHash,
            blockchainTransactionId: '',
          },
        });

        // Register on blockchain
        try {
          await blockchainService.updateBloodBagStatus(id, data.status, hash);
        } catch (blockchainError) {
          console.error('Blockchain update failed:', blockchainError);
        }
      }

      return updatedBag;
    });

    return this.getById(transaction.id);
  }

  /**
   * Delete blood bag
   */
  static async delete(id: string, deletedBy: string): Promise<BloodBag> {
    const existingBag = await this.getById(id);
    if (!existingBag) {
      throw new Error('Blood bag not found');
    }

    return await prisma.$transaction(async (tx) => {
      // Register deletion event
      await tx.event.create({
        data: {
          bagId: id,
          eventType: 'DESCARTE' as EventType,
          description: 'Bolsa removida do sistema',
          institutionId: existingBag.currentInstitutionId,
          userId: deletedBy,
          hash: generateEventHash(
            id,
            'DESCARTE',
            existingBag.currentInstitutionId,
            deletedBy,
            new Date(),
            { reason: 'Administrative deletion' }
          ),
          blockchainTransactionId: '',
        },
      });

      return await tx.bloodBag.delete({ where: { id } });
    });
  }

  /**
   * Update blood bag status with event registration
   */
  static async updateStatus(
    id: string,
    status: BagStatus,
    description: string,
    userId: string,
    institutionId: string
  ): Promise<BloodBagWithEvents> {
    const existingBag = await this.getById(id);
    if (!existingBag) {
      throw new Error('Blood bag not found');
    }

    const transaction = await prisma.$transaction(async (tx) => {
      // Update status
      const updatedBag = await tx.bloodBag.update({
        where: { id },
        data: {
          status,
          updatedAt: new Date(),
        },
      });

      // Generate event hash
      const eventHash = generateEventHash(
        id,
        status as EventType,
        institutionId,
        userId,
        new Date(),
        { description }
      );

      // Create event
      await tx.event.create({
        data: {
          bagId: id,
          eventType: status as EventType,
          description,
          institutionId,
          userId,
          hash: eventHash,
          blockchainTransactionId: '',
        },
      });

      // Register on blockchain
      try {
        await blockchainService.registerEvent(
          id,
          status,
          description,
          institutionId,
          userId,
          eventHash
        );
        await blockchainService.updateBloodBagStatus(id, status, updatedBag.hash);
      } catch (blockchainError) {
        console.error('Blockchain registration failed:', blockchainError);
      }

      return updatedBag;
    });

    return this.getById(transaction.id);
  }

  /**
   * Get blood bags by institution
   */
  static async getByInstitution(
    institutionId: string,
    status?: BagStatus
  ): Promise<BloodBag[]> {
    const where: Prisma.BloodBagWhereInput = {
      currentInstitutionId: institutionId,
    };

    if (status) {
      where.status = status;
    }

    return prisma.bloodBag.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get available blood bags for transfer
   */
  static async getAvailableForTransfer(
    institutionId: string,
    bloodType?: string
  ): Promise<BloodBag[]> {
    const where: Prisma.BloodBagWhereInput = {
      currentInstitutionId: institutionId,
      status: { in: ['DISPONIVEL', 'ARMAZENADA'] },
    };

    if (bloodType) {
      where.bloodType = bloodType as any;
    }

    return prisma.bloodBag.findMany({
      where,
      orderBy: { expirationDate: 'asc' },
    });
  }

  /**
   * Find compatible blood bags for a demand
   */
  static async findCompatibleForDemand(
    bloodType: string,
    quantity: number,
    excludeInstitutionId?: string
  ): Promise<{ institution: { id: string; name: string; type: string }; bags: BloodBag[] }[]> {
    const where: Prisma.BloodBagWhereInput = {
      status: { in: ['DISPONIVEL', 'ARMAZENADA'] },
      bloodType: bloodType as any,
      expirationDate: { gt: new Date() },
    };

    if (excludeInstitutionId) {
      where.currentInstitutionId = { not: excludeInstitutionId };
    }

    const bags = await prisma.bloodBag.findMany({
      where,
      include: {
        institution: {
          select: { id: true, name: true, type: true },
        },
      },
      orderBy: { expirationDate: 'asc' },
    });

    // Group by institution
    const grouped = bags.reduce((acc, bag) => {
      const institution = bag.institution as unknown as { id: string; name: string; type: string };
      if (!acc[institution.id]) {
        acc[institution.id] = {
          institution,
          bags: [],
        };
      }
      acc[institution.id].bags.push(bag);
      return acc;
    }, {} as Record<string, { institution: { id: string; name: string; type: string }; bags: BloodBag[] }>);

    return Object.values(grouped);
  }

  /**
   * Check if blood bag exists and is valid
   */
  static async exists(id: string): Promise<boolean> {
    const count = await prisma.bloodBag.count({ where: { id } });
    return count > 0;
  }

  /**
   * Get blood bag statistics
   */
  static async getStatistics(institutionId?: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byBloodType: Record<string, number>;
    expired: number;
    lowStock: number;
  }> {
    const where: Prisma.BloodBagWhereInput = {};
    if (institutionId) {
      where.currentInstitutionId = institutionId;
    }

    const [total, byStatus, byBloodType, expired] = await Promise.all([
      prisma.bloodBag.count({ where }),
      prisma.bloodBag.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      prisma.bloodBag.groupBy({
        by: ['bloodType'],
        where,
        _count: { _all: true },
      }),
      prisma.bloodBag.count({
        where: { ...where, expirationDate: { lt: new Date() } },
      }),
    ]);

    const statusCount: Record<string, number> = {};
    byStatus.forEach((group) => {
      statusCount[group.status] = group._count._all;
    });

    const bloodTypeCount: Record<string, number> = {};
    byBloodType.forEach((group) => {
      bloodTypeCount[group.bloodType] = group._count._all;
    });

    // Check for low stock (less than 5 bags per type)
    const allTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    let lowStock = 0;
    for (const type of allTypes) {
      if ((bloodTypeCount[type] || 0) < 5) {
        lowStock++;
      }
    }

    return {
      total,
      byStatus: statusCount,
      byBloodType: bloodTypeCount,
      expired,
      lowStock,
    };
  }
}
