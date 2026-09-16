import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { BloodBagService } from '../services/blood-bag.service';
import { InstitutionService } from '../services/institution.service';
import { UserService } from '../services/user.service';
import { prisma } from '../prisma';
import { BagStatus, BloodType } from '../types';

describe('BloodBagService', () => {
  let hemocentroId: string;
  let hospitalId: string;
  let userId: string;

  beforeAll(async () => {
    // Create test institutions
    const hemocentro = await InstitutionService.create({
      name: 'Hemocentro Test',
      code: 'HT-001',
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
      email: 'test@hemocentro.com',
      capacity: 100,
      isActive: true,
    });

    const hospital = await InstitutionService.create({
      name: 'Hospital Test',
      code: 'HP-001',
      type: 'HOSPITAL',
      cnpj: '00000000000102',
      address: {
        street: 'Test Street',
        number: '456',
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
      email: 'test-blood-bag@test.com',
      password: 'TestPassword123!',
      role: 'HEMOCENTRO',
      institutionId: hemocentro.id,
      phone: '1234567890',
    });

    hemocentroId = hemocentro.id;
    hospitalId = hospital.id;
    userId = user.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.bloodBag.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();
    await prisma.institution.deleteMany();
  });

  describe('create', () => {
    it('should create a new blood bag', async () => {
      const today = new Date();
      const expirationDate = new Date();
      expirationDate.setDate(today.getDate() + 42);

      const bloodBag = await BloodBagService.create({
        code: 'TEST-001',
        bloodType: 'O+' as BloodType,
        factorRh: true,
        collectionDate: today.toISOString(),
        expirationDate: expirationDate.toISOString(),
        volume: 450,
        currentInstitutionId: hemocentroId,
        currentLocation: 'Test Location',
        currentTemperature: 4.0,
        createdBy: userId,
      });

      expect(bloodBag).toBeDefined();
      expect(bloodBag.code).toBe('TEST-001');
      expect(bloodBag.bloodType).toBe('O+');
      expect(bloodBag.factorRh).toBe(true);
      expect(bloodBag.status).toBe('COLETADA');
      expect(bloodBag.hash).toBeDefined();
      expect(bloodBag.qrCode).toBeDefined();
    });

    it('should create blood bag with auto-generated code', async () => {
      const today = new Date();
      const expirationDate = new Date();
      expirationDate.setDate(today.getDate() + 42);

      const bloodBag = await BloodBagService.create({
        bloodType: 'A+' as BloodType,
        factorRh: true,
        collectionDate: today.toISOString(),
        expirationDate: expirationDate.toISOString(),
        volume: 450,
        currentInstitutionId: hemocentroId,
        currentLocation: 'Test Location',
        createdBy: userId,
      });

      expect(bloodBag.code).toContain('A+');
      expect(bloodBag.code).toContain(new Date().toISOString().slice(0, 10).replace(/-/g, ''));
    });
  });

  describe('getById', () => {
    it('should get blood bag by ID', async () => {
      const today = new Date();
      const expirationDate = new Date();
      expirationDate.setDate(today.getDate() + 42);

      const created = await BloodBagService.create({
        code: 'TEST-002',
        bloodType: 'B+' as BloodType,
        factorRh: true,
        collectionDate: today.toISOString(),
        expirationDate: expirationDate.toISOString(),
        currentInstitutionId: hemocentroId,
        createdBy: userId,
      });

      const bloodBag = await BloodBagService.getById(created.id);

      expect(bloodBag).toBeDefined();
      expect(bloodBag?.id).toBe(created.id);
      expect(bloodBag?.code).toBe('TEST-002');
    });

    it('should return null for non-existent blood bag', async () => {
      const bloodBag = await BloodBagService.getById('non-existent-id');
      expect(bloodBag).toBeNull();
    });
  });

  describe('getByCode', () => {
    it('should get blood bag by code', async () => {
      const today = new Date();
      const expirationDate = new Date();
      expirationDate.setDate(today.getDate() + 42);

      await BloodBagService.create({
        code: 'TEST-003',
        bloodType: 'AB+' as BloodType,
        factorRh: true,
        collectionDate: today.toISOString(),
        expirationDate: expirationDate.toISOString(),
        currentInstitutionId: hemocentroId,
        createdBy: userId,
      });

      const bloodBag = await BloodBagService.getByCode('TEST-003');

      expect(bloodBag).toBeDefined();
      expect(bloodBag?.code).toBe('TEST-003');
    });

    it('should return null for non-existent code', async () => {
      const bloodBag = await BloodBagService.getByCode('NON-EXISTENT');
      expect(bloodBag).toBeNull();
    });
  });

  describe('list', () => {
    it('should list blood bags with pagination', async () => {
      // Create multiple blood bags
      const today = new Date();
      const expirationDate = new Date();
      expirationDate.setDate(today.getDate() + 42);

      for (let i = 0; i < 15; i++) {
        await BloodBagService.create({
          code: `LIST-TEST-${i}`,
          bloodType: ['O+', 'A+', 'B+', 'AB+'][i % 4] as BloodType,
          factorRh: true,
          collectionDate: today.toISOString(),
          expirationDate: expirationDate.toISOString(),
          currentInstitutionId: hemocentroId,
          createdBy: userId,
        });
      }

      const result = await BloodBagService.list({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(10);
      expect(result.meta.total).toBeGreaterThanOrEqual(15);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('should filter blood bags by blood type', async () => {
      const result = await BloodBagService.list({ bloodType: 'O+' as BloodType, limit: 100 });
      expect(result.data.every(bag => bag.bloodType === 'O+')).toBe(true);
    });

    it('should filter blood bags by institution', async () => {
      const result = await BloodBagService.list({ currentInstitutionId: hemocentroId, limit: 100 });
      expect(result.data.every(bag => bag.currentInstitutionId === hemocentroId)).toBe(true);
    });

    it('should filter blood bags by status', async () => {
      const result = await BloodBagService.list({ status: 'COLETADA' as BagStatus, limit: 100 });
      expect(result.data.every(bag => bag.status === 'COLETADA')).toBe(true);
    });
  });

  describe('update', () => {
    it('should update blood bag', async () => {
      const today = new Date();
      const expirationDate = new Date();
      expirationDate.setDate(today.getDate() + 42);

      const created = await BloodBagService.create({
        code: 'UPDATE-TEST',
        bloodType: 'O+' as BloodType,
        factorRh: true,
        collectionDate: today.toISOString(),
        expirationDate: expirationDate.toISOString(),
        currentInstitutionId: hemocentroId,
        createdBy: userId,
      });

      const updated = await BloodBagService.update(created.id, {
        status: 'APROVADA' as BagStatus,
        currentLocation: 'Updated Location',
        updatedBy: userId,
      });

      expect(updated.status).toBe('APROVADA');
      expect(updated.currentLocation).toBe('Updated Location');
    });

    it('should throw error for non-existent blood bag', async () => {
      await expect(
        BloodBagService.update('non-existent-id', { status: 'APROVADA' as BagStatus, updatedBy: userId })
      ).rejects.toThrow('Blood bag not found');
    });
  });

  describe('updateStatus', () => {
    it('should update blood bag status with event', async () => {
      const today = new Date();
      const expirationDate = new Date();
      expirationDate.setDate(today.getDate() + 42);

      const created = await BloodBagService.create({
        code: 'STATUS-TEST',
        bloodType: 'O+' as BloodType,
        factorRh: true,
        collectionDate: today.toISOString(),
        expirationDate: expirationDate.toISOString(),
        currentInstitutionId: hemocentroId,
        createdBy: userId,
      });

      const updated = await BloodBagService.updateStatus(
        created.id,
        'APROVADA' as BagStatus,
        'Test status update',
        userId,
        hemocentroId
      );

      expect(updated.status).toBe('APROVADA');
      expect(updated.events).toBeDefined();
      expect(updated.events?.length).toBeGreaterThan(0);
    });
  });

  describe('getByInstitution', () => {
    it('should get blood bags by institution', async () => {
      const bags = await BloodBagService.getByInstitution(hemocentroId);
      expect(bags.every(bag => bag.currentInstitutionId === hemocentroId)).toBe(true);
    });

    it('should filter by status', async () => {
      const bags = await BloodBagService.getByInstitution(hemocentroId, 'COLETADA' as BagStatus);
      expect(bags.every(bag => bag.status === 'COLETADA')).toBe(true);
    });
  });

  describe('getAvailableForTransfer', () => {
    it('should get available blood bags', async () => {
      const bags = await BloodBagService.getAvailableForTransfer(hemocentroId);
      expect(bags.every(bag => ['DISPONIVEL', 'ARMAZENADA'].includes(bag.status))).toBe(true);
    });

    it('should filter by blood type', async () => {
      const bags = await BloodBagService.getAvailableForTransfer(hemocentroId, 'O+');
      expect(bags.every(bag => bag.bloodType === 'O+')).toBe(true);
    });
  });

  describe('exists', () => {
    it('should check if blood bag exists', async () => {
      const today = new Date();
      const expirationDate = new Date();
      expirationDate.setDate(today.getDate() + 42);

      const created = await BloodBagService.create({
        code: 'EXISTS-TEST',
        bloodType: 'O+' as BloodType,
        factorRh: true,
        collectionDate: today.toISOString(),
        expirationDate: expirationDate.toISOString(),
        currentInstitutionId: hemocentroId,
        createdBy: userId,
      });

      expect(await BloodBagService.exists(created.id)).toBe(true);
      expect(await BloodBagService.exists('non-existent-id')).toBe(false);
    });
  });

  describe('getStatistics', () => {
    it('should return blood bag statistics', async () => {
      const stats = await BloodBagService.getStatistics();

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.byStatus).toBeDefined();
      expect(stats.byBloodType).toBeDefined();
      expect(stats.expired).toBeDefined();
      expect(stats.lowStock).toBeDefined();
    });

    it('should return statistics by institution', async () => {
      const stats = await BloodBagService.getStatistics(hemocentroId);
      expect(stats.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('findCompatibleForDemand', () => {
    it('should find compatible blood bags for a demand', async () => {
      const today = new Date();
      const expirationDate = new Date();
      expirationDate.setDate(today.getDate() + 42);

      // Create a blood bag in hospital
      await BloodBagService.create({
        code: 'COMPATIBLE-TEST',
        bloodType: 'O+' as BloodType,
        factorRh: true,
        collectionDate: today.toISOString(),
        expirationDate: expirationDate.toISOString(),
        currentInstitutionId: hospitalId,
        status: 'DISPONIVEL' as BagStatus,
        createdBy: userId,
      });

      const result = await BloodBagService.findCompatibleForDemand('O+', 1, hemocentroId);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].bags.length).toBeGreaterThan(0);
    });
  });
});
