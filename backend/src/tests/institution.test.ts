import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { InstitutionService } from '../services/institution.service';
import { prisma } from '../prisma';
import { InstitutionType } from '../types';

describe('InstitutionService', () => {
  afterAll(async () => {
    // Clean up
    await prisma.institution.deleteMany();
  });

  describe('create', () => {
    it('should create a new institution', async () => {
      const institution = await InstitutionService.create({
        name: 'Test Institution',
        code: 'TI-001',
        type: 'HEMOCENTRO' as InstitutionType,
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

      expect(institution).toBeDefined();
      expect(institution.name).toBe('Test Institution');
      expect(institution.code).toBe('TI-001');
      expect(institution.type).toBe('HEMOCENTRO');
      expect(institution.cnpj).toBe('00000000000101');
      expect(institution.address.street).toBe('Test Street');
      expect(institution.phone).toBe('1234567890');
      expect(institution.email).toBe('test@institution.com');
      expect(institution.capacity).toBe(100);
      expect(institution.isActive).toBe(true);
    });

    it('should create institution with default values', async () => {
      const institution = await InstitutionService.create({
        name: 'Default Institution',
        code: 'DI-001',
        type: 'HOSPITAL' as InstitutionType,
        cnpj: '00000000000102',
        address: {
          street: 'Default Street',
          number: '1',
          neighborhood: 'Default',
          city: 'Default City',
          state: 'DS',
          zipCode: '12345678',
        },
        phone: '1234567890',
        email: 'default@institution.com',
      });

      expect(institution.capacity).toBe(100); // Default capacity
      expect(institution.isActive).toBe(true); // Default isActive
    });

    it('should throw error for duplicate code', async () => {
      await InstitutionService.create({
        name: 'Institution 1',
        code: 'DUP-001',
        type: 'HEMOCENTRO' as InstitutionType,
        cnpj: '00000000000103',
        address: {
          street: 'Street 1',
          number: '1',
          neighborhood: 'Neighborhood',
          city: 'City',
          state: 'ST',
          zipCode: '12345678',
        },
        phone: '1234567890',
        email: 'institution1@test.com',
      });

      await expect(
        InstitutionService.create({
          name: 'Institution 2',
          code: 'DUP-001',
          type: 'HOSPITAL' as InstitutionType,
          cnpj: '00000000000104',
          address: {
            street: 'Street 2',
            number: '2',
            neighborhood: 'Neighborhood',
            city: 'City',
            state: 'ST',
            zipCode: '12345678',
          },
          phone: '1234567890',
          email: 'institution2@test.com',
        })
      ).rejects.toThrow('Code already in use');
    });
  });

  describe('getById', () => {
    it('should get institution by ID', async () => {
      const created = await InstitutionService.create({
        name: 'Get By ID Test',
        code: 'GBI-001',
        type: 'HEMOCENTRO' as InstitutionType,
        cnpj: '00000000000105',
        address: {
          street: 'Test Street',
          number: '123',
          neighborhood: 'Test',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345678',
        },
        phone: '1234567890',
        email: 'get-by-id@test.com',
      });

      const institution = await InstitutionService.getById(created.id);

      expect(institution).toBeDefined();
      expect(institution?.id).toBe(created.id);
      expect(institution?.name).toBe('Get By ID Test');
    });

    it('should return null for non-existent institution', async () => {
      const institution = await InstitutionService.getById('non-existent-id');
      expect(institution).toBeNull();
    });
  });

  describe('getByCode', () => {
    it('should get institution by code', async () => {
      await InstitutionService.create({
        name: 'Get By Code Test',
        code: 'GBC-001',
        type: 'HEMOCENTRO' as InstitutionType,
        cnpj: '00000000000106',
        address: {
          street: 'Test Street',
          number: '123',
          neighborhood: 'Test',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345678',
        },
        phone: '1234567890',
        email: 'get-by-code@test.com',
      });

      const institution = await InstitutionService.getByCode('GBC-001');

      expect(institution).toBeDefined();
      expect(institution?.code).toBe('GBC-001');
    });

    it('should return null for non-existent code', async () => {
      const institution = await InstitutionService.getByCode('NON-EXISTENT');
      expect(institution).toBeNull();
    });
  });

  describe('list', () => {
    it('should list institutions with pagination', async () => {
      // Create multiple institutions
      for (let i = 0; i < 15; i++) {
        await InstitutionService.create({
          name: `List Test Institution ${i}`,
          code: `LIST-${i}`,
          type: ['HEMOCENTRO', 'HOSPITAL'][i % 2] as InstitutionType,
          cnpj: `000000000001${String(i).padStart(2, '0')}`,
          address: {
            street: `Street ${i}`,
            number: String(i),
            neighborhood: 'Neighborhood',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345678',
          },
          phone: '1234567890',
          email: `list-${i}@test.com`,
        });
      }

      const result = await InstitutionService.list({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(10);
      expect(result.meta.total).toBeGreaterThanOrEqual(15);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('should filter institutions by type', async () => {
      const result = await InstitutionService.list({ type: 'HEMOCENTRO' as InstitutionType, limit: 100 });
      expect(result.data.every(inst => inst.type === 'HEMOCENTRO')).toBe(true);
    });

    it('should filter institutions by active status', async () => {
      const result = await InstitutionService.list({ isActive: true, limit: 100 });
      expect(result.data.every(inst => inst.isActive === true)).toBe(true);
    });

    it('should filter institutions by city', async () => {
      const result = await InstitutionService.list({ city: 'Test City', limit: 100 });
      expect(result.data.every(inst => inst.address.city === 'Test City')).toBe(true);
    });

    it('should filter institutions by state', async () => {
      const result = await InstitutionService.list({ state: 'TS', limit: 100 });
      expect(result.data.every(inst => inst.address.state === 'TS')).toBe(true);
    });
  });

  describe('update', () => {
    it('should update institution', async () => {
      const created = await InstitutionService.create({
        name: 'Update Test',
        code: 'UT-001',
        type: 'HEMOCENTRO' as InstitutionType,
        cnpj: '00000000000107',
        address: {
          street: 'Test Street',
          number: '123',
          neighborhood: 'Test',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345678',
        },
        phone: '1234567890',
        email: 'update-test@test.com',
      });

      const updated = await InstitutionService.update(created.id, {
        name: 'Updated Name',
        code: 'UT-002',
        capacity: 200,
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.code).toBe('UT-002');
      expect(updated.capacity).toBe(200);
    });

    it('should throw error for non-existent institution', async () => {
      await expect(
        InstitutionService.update('non-existent-id', { name: 'New Name' })
      ).rejects.toThrow('Institution not found');
    });

    it('should throw error for duplicate code on update', async () => {
      const inst1 = await InstitutionService.create({
        name: 'Institution 1',
        code: 'DUP-U-001',
        type: 'HEMOCENTRO' as InstitutionType,
        cnpj: '00000000000108',
        address: {
          street: 'Street 1',
          number: '1',
          neighborhood: 'Neighborhood',
          city: 'City',
          state: 'ST',
          zipCode: '12345678',
        },
        phone: '1234567890',
        email: 'inst1@test.com',
      });

      const inst2 = await InstitutionService.create({
        name: 'Institution 2',
        code: 'DUP-U-002',
        type: 'HOSPITAL' as InstitutionType,
        cnpj: '00000000000109',
        address: {
          street: 'Street 2',
          number: '2',
          neighborhood: 'Neighborhood',
          city: 'City',
          state: 'ST',
          zipCode: '12345678',
        },
        phone: '1234567890',
        email: 'inst2@test.com',
      });

      await expect(
        InstitutionService.update(inst1.id, { code: 'DUP-U-002' })
      ).rejects.toThrow('Code already in use');
    });
  });

  describe('delete', () => {
    it('should delete institution', async () => {
      const created = await InstitutionService.create({
        name: 'Delete Test',
        code: 'DL-001',
        type: 'HEMOCENTRO' as InstitutionType,
        cnpj: '00000000000110',
        address: {
          street: 'Test Street',
          number: '123',
          neighborhood: 'Test',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345678',
        },
        phone: '1234567890',
        email: 'delete-test@test.com',
      });

      const deleted = await InstitutionService.delete(created.id);

      expect(deleted.id).toBe(created.id);

      const institution = await InstitutionService.getById(created.id);
      expect(institution).toBeNull();
    });
  });

  describe('getByType', () => {
    it('should get institutions by type', async () => {
      const institutions = await InstitutionService.getByType('HEMOCENTRO' as InstitutionType);
      expect(institutions.every(inst => inst.type === 'HEMOCENTRO')).toBe(true);
    });
  });

  describe('getBloodCenters', () => {
    it('should get all blood centers (HEMOCENTRO)', async () => {
      const bloodCenters = await InstitutionService.getBloodCenters();
      expect(bloodCenters.every(inst => inst.type === 'HEMOCENTRO')).toBe(true);
    });
  });

  describe('getHospitals', () => {
    it('should get all hospitals', async () => {
      const hospitals = await InstitutionService.getHospitals();
      expect(hospitals.every(inst => inst.type === 'HOSPITAL')).toBe(true);
    });
  });

  describe('exists', () => {
    it('should check if institution exists', async () => {
      const created = await InstitutionService.create({
        name: 'Exists Test',
        code: 'EX-001',
        type: 'HEMOCENTRO' as InstitutionType,
        cnpj: '00000000000111',
        address: {
          street: 'Test Street',
          number: '123',
          neighborhood: 'Test',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345678',
        },
        phone: '1234567890',
        email: 'exists-test@test.com',
      });

      expect(await InstitutionService.exists(created.id)).toBe(true);
      expect(await InstitutionService.exists('non-existent-id')).toBe(false);
    });
  });

  describe('getStatistics', () => {
    it('should return institution statistics', async () => {
      const stats = await InstitutionService.getStatistics();

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.byType).toBeDefined();
      expect(stats.active).toBeDefined();
      expect(stats.inactive).toBeDefined();
      expect(stats.totalCapacity).toBeDefined();
    });
  });

  describe('getWithBloodBagCounts', () => {
    it('should return institutions with blood bag counts', async () => {
      const result = await InstitutionService.getWithBloodBagCounts();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      const first = result[0];
      expect(first.id).toBeDefined();
      expect(first.name).toBeDefined();
      expect(first.code).toBeDefined();
      expect(first.type).toBeDefined();
      expect(first.totalBags).toBeDefined();
      expect(first.availableBags).toBeDefined();
    });
  });
});
