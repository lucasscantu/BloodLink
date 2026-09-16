import { expect } from 'chai';
import { ethers } from 'hardhat';
import { BloodBagRegistry } from '../typechain-types';

describe('BloodBagRegistry', function () {
  let bloodBagRegistry: BloodBagRegistry;
  let owner: any;
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const BloodBagRegistryFactory = await ethers.getContractFactory('BloodBagRegistry');
    bloodBagRegistry = (await BloodBagRegistryFactory.deploy()) as BloodBagRegistry;
    await bloodBagRegistry.waitForDeployment();
  });

  describe('Blood Bag Registration', function () {
    it('Should register a new blood bag', async function () {
      const bagId = 'O+-2024-001';
      const bloodType = 'O+';
      const factorRh = true;
      const collectionDate = Math.floor(Date.now() / 1000);
      const expirationDate = collectionDate + 86400 * 42; // 42 days later
      const institutionId = 'hemocentro-001';
      const status = 'COLETADA';
      const hash = ethers.keccak256(ethers.toUtf8Bytes('test-hash'));

      const tx = await bloodBagRegistry.registerBloodBag(
        bagId,
        bloodType,
        factorRh,
        collectionDate,
        expirationDate,
        institutionId,
        status,
        hash
      );

      await expect(tx).to.emit(bloodBagRegistry, 'BloodBagRegistered');

      const totalBags = await bloodBagRegistry.getTotalBloodBags();
      expect(totalBags).to.equal(1);

      const bag = await bloodBagRegistry.getBloodBagById(bagId);
      expect(bag[1].bagId).to.equal(bagId);
      expect(bag[1].bloodType).to.equal(bloodType);
    });

    it('Should update blood bag status', async function () {
      const bagId = 'A+-2024-002';
      const bloodType = 'A+';
      const factorRh = true;
      const collectionDate = Math.floor(Date.now() / 1000);
      const expirationDate = collectionDate + 86400 * 42;
      const institutionId = 'hemocentro-001';
      const status = 'COLETADA';
      const hash = ethers.keccak256(ethers.toUtf8Bytes('test-hash'));

      await bloodBagRegistry.registerBloodBag(
        bagId,
        bloodType,
        factorRh,
        collectionDate,
        expirationDate,
        institutionId,
        status,
        hash
      );

      const newStatus = 'APROVADA';
      const newHash = ethers.keccak256(ethers.toUtf8Bytes('new-hash'));

      const tx = await bloodBagRegistry.updateBloodBagStatus(bagId, newStatus, newHash);
      await expect(tx).to.not.be.reverted;

      const bag = await bloodBagRegistry.getBloodBagById(bagId);
      expect(bag[1].status).to.equal(newStatus);
    });
  });

  describe('Event Registration', function () {
    it('Should register an event for a blood bag', async function () {
      const bagId = 'B+-2024-003';
      const bloodType = 'B+';
      const factorRh = true;
      const collectionDate = Math.floor(Date.now() / 1000);
      const expirationDate = collectionDate + 86400 * 42;
      const institutionId = 'hemocentro-001';
      const status = 'COLETADA';
      const hash = ethers.keccak256(ethers.toUtf8Bytes('test-hash'));

      await bloodBagRegistry.registerBloodBag(
        bagId,
        bloodType,
        factorRh,
        collectionDate,
        expirationDate,
        institutionId,
        status,
        hash
      );

      const eventType = 'COLETA';
      const description = 'Coleta de sangue realizada';
      const userId = 'user-001';
      const eventHash = ethers.keccak256(ethers.toUtf8Bytes('event-hash'));

      const tx = await bloodBagRegistry.registerEvent(
        bagId,
        eventType,
        description,
        institutionId,
        userId,
        eventHash
      );

      await expect(tx).to.emit(bloodBagRegistry, 'EventRegistered');

      const totalEvents = await bloodBagRegistry.getTotalEvents();
      expect(totalEvents).to.equal(1);

      const events = await bloodBagRegistry.getBloodBagEvents(bagId);
      expect(events.length).to.equal(1);
      expect(events[0].eventType).to.equal(eventType);
    });

    it('Should get event by ID', async function () {
      const bagId = 'AB+-2024-004';
      const bloodType = 'AB+';
      const factorRh = true;
      const collectionDate = Math.floor(Date.now() / 1000);
      const expirationDate = collectionDate + 86400 * 42;
      const institutionId = 'hemocentro-001';
      const status = 'COLETADA';
      const hash = ethers.keccak256(ethers.toUtf8Bytes('test-hash'));

      await bloodBagRegistry.registerBloodBag(
        bagId,
        bloodType,
        factorRh,
        collectionDate,
        expirationDate,
        institutionId,
        status,
        hash
      );

      const eventType = 'APROVACAO';
      const description = 'Testes aprovados';
      const userId = 'user-001';
      const eventHash = ethers.keccak256(ethers.toUtf8Bytes('event-hash'));

      const tx = await bloodBagRegistry.registerEvent(
        bagId,
        eventType,
        description,
        institutionId,
        userId,
        eventHash
      );

      const receipt = await tx.wait();
      // Get event ID from logs
      const eventId = receipt?.logs[0].args[0];

      const event = await bloodBagRegistry.getEvent(eventId);
      expect(event.eventType).to.equal(eventType);
      expect(event.bagId).to.equal(bagId);
    });
  });

  describe('Transfer Registration', function () {
    it('Should register a transfer', async function () {
      const bagId = 'O--2024-005';
      const bloodType = 'O-';
      const factorRh = false;
      const collectionDate = Math.floor(Date.now() / 1000);
      const expirationDate = collectionDate + 86400 * 42;
      const institutionId = 'hemocentro-001';
      const status = 'ARMAZENADA';
      const hash = ethers.keccak256(ethers.toUtf8Bytes('test-hash'));

      await bloodBagRegistry.registerBloodBag(
        bagId,
        bloodType,
        factorRh,
        collectionDate,
        expirationDate,
        institutionId,
        status,
        hash
      );

      const fromInstitutionId = 'hemocentro-001';
      const toInstitutionId = 'hospital-001';
      const transferStatus = 'SOLICITADA';
      const transferHash = ethers.keccak256(ethers.toUtf8Bytes('transfer-hash'));

      const tx = await bloodBagRegistry.registerTransfer(
        bagId,
        fromInstitutionId,
        toInstitutionId,
        transferStatus,
        transferHash
      );

      await expect(tx).to.emit(bloodBagRegistry, 'TransferRegistered');

      const totalTransfers = await bloodBagRegistry.getTotalTransfers();
      expect(totalTransfers).to.equal(1);
    });

    it('Should update transfer status', async function () {
      const bagId = 'A--2024-006';
      const bloodType = 'A-';
      const factorRh = false;
      const collectionDate = Math.floor(Date.now() / 1000);
      const expirationDate = collectionDate + 86400 * 42;
      const institutionId = 'hemocentro-001';
      const status = 'ARMAZENADA';
      const hash = ethers.keccak256(ethers.toUtf8Bytes('test-hash'));

      await bloodBagRegistry.registerBloodBag(
        bagId,
        bloodType,
        factorRh,
        collectionDate,
        expirationDate,
        institutionId,
        status,
        hash
      );

      const fromInstitutionId = 'hemocentro-001';
      const toInstitutionId = 'hospital-001';
      const transferStatus = 'SOLICITADA';
      const transferHash = ethers.keccak256(ethers.toUtf8Bytes('transfer-hash'));

      const registerTx = await bloodBagRegistry.registerTransfer(
        bagId,
        fromInstitutionId,
        toInstitutionId,
        transferStatus,
        transferHash
      );

      const receipt = await registerTx.wait();
      const transferId = receipt?.logs[0].args[0];

      const newStatus = 'APROVADA';
      const newHash = ethers.keccak256(ethers.toUtf8Bytes('new-transfer-hash'));

      const tx = await bloodBagRegistry.updateTransferStatus(transferId, newStatus, newHash);
      await expect(tx).to.not.be.reverted;

      const transfer = await bloodBagRegistry.getTransfer(transferId);
      expect(transfer.status).to.equal(newStatus);
    });
  });

  describe('Demand Registration', function () {
    it('Should register a demand', async function () {
      const institutionId = 'hospital-001';
      const bloodType = 'O+';
      const quantity = 10;
      const urgency = 'ALTA';
      const status = 'ABERTA';
      const hash = ethers.keccak256(ethers.toUtf8Bytes('demand-hash'));

      const tx = await bloodBagRegistry.registerDemand(
        institutionId,
        bloodType,
        quantity,
        urgency,
        status,
        hash
      );

      await expect(tx).to.emit(bloodBagRegistry, 'DemandRegistered');

      const totalDemands = await bloodBagRegistry.getTotalDemands();
      expect(totalDemands).to.equal(1);

      const demandId = (await tx.wait())?.logs[0].args[0];
      const demand = await bloodBagRegistry.getDemand(demandId);
      expect(demand.institutionId).to.equal(institutionId);
      expect(demand.bloodType).to.equal(bloodType);
      expect(demand.quantity).to.equal(quantity);
    });

    it('Should update demand status', async function () {
      const institutionId = 'hospital-001';
      const bloodType = 'B+';
      const quantity = 5;
      const urgency = 'MEDIA';
      const status = 'ABERTA';
      const hash = ethers.keccak256(ethers.toUtf8Bytes('demand-hash'));

      const registerTx = await bloodBagRegistry.registerDemand(
        institutionId,
        bloodType,
        quantity,
        urgency,
        status,
        hash
      );

      const receipt = await registerTx.wait();
      const demandId = receipt?.logs[0].args[0];

      const newStatus = 'ATENDIDA';
      const newHash = ethers.keccak256(ethers.toUtf8Bytes('new-demand-hash'));

      const tx = await bloodBagRegistry.updateDemandStatus(demandId, newStatus, newHash);
      await expect(tx).to.not.be.reverted;

      const demand = await bloodBagRegistry.getDemand(demandId);
      expect(demand.status).to.equal(newStatus);
    });
  });

  describe('Hash Verification', function () {
    it('Should verify blood bag hash', async function () {
      const bagId = 'O+-2024-007';
      const bloodType = 'O+';
      const factorRh = true;
      const collectionDate = Math.floor(Date.now() / 1000);
      const expirationDate = collectionDate + 86400 * 42;
      const institutionId = 'hemocentro-001';
      const status = 'COLETADA';
      const hash = ethers.keccak256(ethers.toUtf8Bytes('test-hash'));

      await bloodBagRegistry.registerBloodBag(
        bagId,
        bloodType,
        factorRh,
        collectionDate,
        expirationDate,
        institutionId,
        status,
        hash
      );

      const isValid = await bloodBagRegistry.verifyBloodBagHash(bagId, hash);
      expect(isValid).to.be.true;

      const invalidHash = ethers.keccak256(ethers.toUtf8Bytes('invalid-hash'));
      const isInvalid = await bloodBagRegistry.verifyBloodBagHash(bagId, invalidHash);
      expect(isInvalid).to.be.false;
    });
  });
});
