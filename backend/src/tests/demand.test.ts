import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { DemandService } from '../services/demand.service';
import { InstitutionService } from '../services/institution.service';
import { UserService } from '../services/user.service';
import { prisma } from '../prisma';
import { DemandStatus, DemandUrgency, BloodType } from '../types';

describe('DemandService', () => {
  let institutionId: string;
  let userId: string;

  beforeAll(async () => {
    // Create test institution
    const institution = await InstitutionService.create({
      name: 'Test Hospital',
      code: 'TH-001',
      type: 'HOSPITAL',
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
      email: 'test@hospital.com',
      capacity: 100,
      isActive: true,
    });

    const user = await UserService.create({
      name: 'Test User',
      email: 'test-demand@test.com',
      password: 'TestPassword123!',
      role: 'HOSPITAL',
      institutionId: institution.id,
    });

    institutionId = institution.id;
    userId = user.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.demand.deleteMany();
    await prisma.user.deleteMany();
    await prisma.institution.deleteMany();
  });

  describe('create', () => {
    it('should create a new demand', async () => {
      const demand = await DemandService.create({
        institutionId,
        bloodType: 'O+' as BloodType,
        quantity: 5,
        urgency: 'ALTA' as DemandUrgency,
        reason: 'Emergency surgery',
        createdBy: userId,
      });

      expect(demand).toBeDefined();
      expect(demand.institutionId).toBe(institutionId);
      expect(demand.bloodType).toBe('O+');
      expect(demand.quantity).toBe(5);
      expect(demand.urgency).toBe('ALTA');
      expect(demand.reason).toBe('Emergency surgery');
      expect(demand.status).toBe('ABERTA');
      expect(demand.hash).toBeDefined();
    });

    it('should create demand with all urgency levels', async () => {
      const urgencies: DemandUrgency[] = ['BAIXA', 'MEDIA', 'ALTA', 'EMERGENCIA'];

      for (const urgency of urgencies) {
        const demand = await DemandService.create({
          institutionId,
          bloodType: 'A+' as BloodType,
          quantity: 1,
          urgency,
          reason: `Test ${urgency}`,
          createdBy: userId,
        });

        expect(demand.urgency).toBe(urgency);
      }
    });

    it('should create demand with all blood types', async () => {
      const bloodTypes: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

      for (const bloodType of bloodTypes) {
        const demand = await DemandService.create({
          institutionId,
          bloodType,
          quantity: 1,
          urgency: 'MEDIA' as DemandUrgency,
          reason: `Test ${bloodType}`,
          createdBy: userId,
        });

        expect(demand.bloodType).toBe(bloodType);
      }
    });
  });

  describe('getById', () => {
    it('should get demand by ID', async () => {
      const created = await DemandService.create({
        institutionId,
        bloodType: 'O+' as BloodType,
        quantity: 10,
        urgency: 'ALTA' as DemandUrgency,
        reason: 'Test get by ID',
        createdBy: userId,
      });

      const demand = await DemandService.getById(created.id);

      expect(demand).toBeDefined();
      expect(demand?.id).toBe(created.id);
      expect(demand?.quantity).toBe(10);
    });

    it('should return null for non-existent demand', async () => {
      const demand = await DemandService.getById('non-existent-id');
      expect(demand).toBeNull();
    });
  });

  describe('list', () => {
    it('should list demands with pagination', async () => {
      // Create multiple demands
      for (let i = 0; i < 15; i++) {
        await DemandService.create({
          institutionId,
          bloodType: ['O+', 'A+', 'B+', 'AB+'][i % 4] as BloodType,
          quantity: 1 + i,
          urgency: ['BAIXA', 'MEDIA', 'ALTA', 'EMERGENCIA'][i % 4] as DemandUrgency,
          reason: `Test demand ${i}`,
          createdBy: userId,
        });
      }

      const result = await DemandService.list({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(10);
      expect(result.meta.total).toBeGreaterThanOrEqual(15);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('should filter demands by institution', async () => {
      const result = await DemandService.list({ institutionId, limit: 100 });
      expect(result.data.every(demand => demand.institutionId === institutionId)).toBe(true);
    });

    it('should filter demands by blood type', async () => {
      const result = await DemandService.list({ bloodType: 'O+' as BloodType, limit: 100 });
      expect(result.data.every(demand => demand.bloodType === 'O+')).toBe(true);
    });

    it('should filter demands by status', async () => {
      const result = await DemandService.list({ status: 'ABERTA' as DemandStatus, limit: 100 });
      expect(result.data.every(demand => demand.status === 'ABERTA')).toBe(true);
    });

    it('should filter demands by urgency', async () => {
      const result = await DemandService.list({ urgency: 'ALTA' as DemandUrgency, limit: 100 });
      expect(result.data.every(demand => demand.urgency === 'ALTA')).toBe(true);
    });
  });

  describe('update', () => {
    it('should update demand', async () => {
      const created = await DemandService.create({
        institutionId,
        bloodType: 'O+' as BloodType,
        quantity: 5,
        urgency: 'ALTA' as DemandUrgency,
        reason: 'Original reason',
        createdBy: userId,
      });

      const updated = await DemandService.update(created.id, {
        quantity: 10,
        reason: 'Updated reason',
        updatedBy: userId,
      });

      expect(updated.quantity).toBe(10);
      expect(updated.reason).toBe('Updated reason');
    });

    it('should update demand status', async () => {
      const created = await DemandService.create({
        institutionId,
        bloodType: 'O+' as BloodType,
        quantity: 5,
        urgency: 'ALTA' as DemandUrgency,
        reason: 'Test',
        createdBy: userId,
      });

      const updated = await DemandService.update(created.id, {
        status: 'EM_ANALISE' as DemandStatus,
        updatedBy: userId,
      });

      expect(updated.status).toBe('EM_ANALISE');
    });

    it('should throw error for non-existent demand', async () => {
      await expect(
        DemandService.update('non-existent-id', {
          quantity: 10,
          updatedBy: userId,
        })
      ).rejects.toThrow('Demand not found');
    });
  });

  describe('updateStatus', () => {
    it('should update demand status', async () => {
      const created = await DemandService.create({
        institutionId,
        bloodType: 'O+' as BloodType,
        quantity: 5,
        urgency: 'ALTA' as DemandUrgency,
        reason: 'Test',
        createdBy: userId,
      });

      const updated = await DemandService.updateStatus(created.id, 'ATENDIDA' as DemandStatus, userId);

      expect(updated.status).toBe('ATENDIDA');
    });

    it('should throw error for non-existent demand', async () => {
      await expect(
        DemandService.updateStatus('non-existent-id', 'ATENDIDA' as DemandStatus, userId)
      ).rejects.toThrow('Demand not found');
    });
  });

  describe('delete', () => {
    it('should delete demand', async () => {
      const created = await DemandService.create({
        institutionId,
        bloodType: 'O+' as BloodType,
        quantity: 5,
        urgency: 'ALTA' as DemandUrgency,
        reason: 'Test delete',
        createdBy: userId,
      });

      const deleted = await DemandService.delete(created.id, userId);

      expect(deleted.id).toBe(created.id);

      const demand = await DemandService.getById(created.id);
      expect(demand).toBeNull();
    });
  });

  describe('getByInstitution', () => {
    it('should get demands by institution', async () => {
      const demands = await DemandService.getByInstitution(institutionId);
      expect(demands.every(demand => demand.institutionId === institutionId)).toBe(true);
    });

    it('should filter by status', async () => {
      const demands = await DemandService.getByInstitution(institutionId, 'ABERTA' as DemandStatus);
      expect(demands.every(demand => demand.status === 'ABERTA')).toBe(true);
    });
  });

  describe('getOpenDemands', () => {
    it('should get all open demands', async () => {
      const demands = await DemandService.getOpenDemands();
      expect(demands.every(demand => demand.status === 'ABERTA')).toBe(true);
    });
  });

  describe('getUrgentDemands', () => {
    it('should get all urgent demands', async () => {
      const demands = await DemandService.getUrgentDemands();
      expect(demands.every(demand => 
        demand.status === 'ABERTA' && 
        ['ALTA', 'EMERGENCIA'].includes(demand.urgency)
      )).toBe(true);
    });
  });

  describe('exists', () => {
    it('should check if demand exists', async () => {
      const created = await DemandService.create({
        institutionId,
        bloodType: 'O+' as BloodType,
        quantity: 5,
        urgency: 'ALTA' as DemandUrgency,
        reason: 'Test exists',
        createdBy: userId,
      });

      expect(await DemandService.exists(created.id)).toBe(true);
      expect(await DemandService.exists('non-existent-id')).toBe(false);
    });
  });

  describe('getStatistics', () => {
    it('should return demand statistics', async () => {
      const stats = await DemandService.getStatistics();

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.byStatus).toBeDefined();
      expect(stats.byBloodType).toBeDefined();
      expect(stats.byUrgency).toBeDefined();
      expect(stats.open).toBeDefined();
      expect(stats.attended).toBeDefined();
      expect(stats.expired).toBeDefined();
    });

    it('should return statistics by institution', async () => {
      const stats = await DemandService.getStatistics(institutionId);
      expect(stats.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('findMatchingBloodBags', () => {
    it('should find matching blood bags for a demand', async () => {
      // Create a demand first
      const demand = await DemandService.create({
        institutionId,
        bloodType: 'O+' as BloodType,
        quantity: 5,
        urgency: 'ALTA' as DemandUrgency,
        reason: 'Test matching',
        createdBy: userId,
      });

      // Create a blood bag in another institution
      const otherInstitution = await InstitutionService.create({
        name: 'Other Hospital',
        code: 'OH-001',
        type: 'HOSPITAL',
        cnpj: '00000000000102',
        address: {
          street: 'Other Street',
          number: '456',
          neighborhood: 'Other',
          city: 'Other City',
          state: 'OS',
          zipCode: '87654321',
          country: 'Test Country',
        },
        phone: '0987654321',
        email: 'other@hospital.com',
        capacity: 100,
        isActive: true,
      });

      // Create a blood bag with matching type
      await prisma.bloodBag.create({
        data: {
          code: 'MATCH-TEST-001',
          bloodType: 'O+',
          factorRh: true,
          collectionDate: new Date(),
          expirationDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
          volume: 450,
          currentInstitutionId: otherInstitution.id,
          currentLocation: 'Storage',
          currentTemperature: 4.0,
          status: 'DISPONIVEL',
          hash: 'test-hash',
          qrCode: 'test-qr',
        },
      });

      const result = await DemandService.findMatchingBloodBags(demand.id);

      expect(result.demand).toBeDefined();
      expect(result.demand?.id).toBe(demand.id);
      expect(result.compatibleInstitutions).toBeDefined();
      expect(Array.isArray(result.compatibleInstitutions)).toBe(true);
    });
  });
});
