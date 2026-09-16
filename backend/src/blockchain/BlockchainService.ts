import { ethers } from 'ethers';
import { config } from '../config';
import { generateEventHash, generateBloodBagHash } from '../utils/hash.utils';
import { BloodBag, Event, TransferRequest, Demand } from '@prisma/client';

/**
 * Blockchain Service Interface
 * This interface allows for easy swapping of blockchain implementations
 */
export interface IBlockchainService {
  connect(): Promise<void>;
  isConnected(): boolean;
  
  // Blood Bag operations
  registerBloodBag(bag: BloodBag): Promise<string>;
  updateBloodBagStatus(bagId: string, status: string, hash: string): Promise<string>;
  verifyBloodBagHash(bagId: string, hash: string): Promise<boolean>;
  
  // Event operations
  registerEvent(
    bagId: string,
    eventType: string,
    description: string,
    institutionId: string,
    userId: string | undefined,
    hash: string
  ): Promise<string>;
  getBloodBagEvents(bagId: string): Promise<any[]>;
  verifyEventHash(eventId: string, hash: string): Promise<boolean>;
  
  // Transfer operations
  registerTransfer(
    bagId: string,
    fromInstitutionId: string,
    toInstitutionId: string,
    status: string,
    hash: string
  ): Promise<string>;
  updateTransferStatus(transferId: string, status: string, hash: string): Promise<string>;
  
  // Demand operations
  registerDemand(demand: Demand): Promise<string>;
  updateDemandStatus(demandId: string, status: string, hash: string): Promise<string>;
  
  // Utility
  getContractAddress(): string;
  getTotalBloodBags(): Promise<number>;
  getTotalEvents(): Promise<number>;
}

/**
 * Hardhat/Ethers.js implementation of BlockchainService
 */
export class HardhatBlockchainService implements IBlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.Wallet | null = null;
  private contract: ethers.Contract | null = null;
  private isConnectedFlag: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      this.provider = new ethers.JsonRpcProvider(config.blockchain.url);
      
      if (config.blockchain.privateKey) {
        this.signer = new ethers.Wallet(
          config.blockchain.privateKey,
          this.provider
        );
      }

      // Load contract ABI
      const artifact = await this.loadContractArtifact();
      
      if (artifact && config.blockchain.contractAddress) {
        this.contract = new ethers.Contract(
          config.blockchain.contractAddress,
          artifact.abi,
          this.signer || this.provider
        );
        this.isConnectedFlag = true;
      }
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      this.isConnectedFlag = false;
    }
  }

  private async loadContractArtifact(): Promise<{ abi: any; bytecode: string } | null> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const artifactPath = path.join(
        __dirname,
        '../../../blockchain/artifacts/contracts/BloodBagRegistry.sol/BloodBagRegistry.json'
      );
      
      if (fs.existsSync(artifactPath)) {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        return artifact;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load contract artifact:', error);
      return null;
    }
  }

  async connect(): Promise<void> {
    if (this.isConnectedFlag) return;
    
    try {
      await this.initialize();
      
      if (this.provider) {
        // Test connection
        await this.provider.getBlockNumber();
        this.isConnectedFlag = true;
      }
    } catch (error) {
      console.error('Failed to connect to blockchain:', error);
      throw new Error('Failed to connect to blockchain');
    }
  }

  isConnected(): boolean {
    return this.isConnectedFlag;
  }

  getContractAddress(): string {
    return config.blockchain.contractAddress;
  }

  // ============================================
  // Blood Bag Operations
  // ============================================

  async registerBloodBag(bag: BloodBag): Promise<string> {
    if (!this.contract || !this.signer) {
      throw new Error('Blockchain not connected or signer not available');
    }

    const tx = await this.contract.registerBloodBag(
      bag.id,
      bag.bloodType as string,
      bag.factorRh || false,
      Math.floor(new Date(bag.collectionDate).getTime() / 1000),
      Math.floor(new Date(bag.expirationDate).getTime() / 1000),
      bag.currentInstitutionId,
      bag.status as string,
      bag.hash || ''
    );

    const receipt = await tx.wait();
    return receipt?.hash || tx.hash;
  }

  async updateBloodBagStatus(bagId: string, status: string, hash: string): Promise<string> {
    if (!this.contract) {
      throw new Error('Blockchain not connected');
    }

    const tx = await this.contract.updateBloodBagStatus(bagId, status, hash);
    const receipt = await tx.wait();
    return receipt?.hash || tx.hash;
  }

  async verifyBloodBagHash(bagId: string, hash: string): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Blockchain not connected');
    }

    return await this.contract.verifyBloodBagHash(bagId, hash);
  }

  // ============================================
  // Event Operations
  // ============================================

  async registerEvent(
    bagId: string,
    eventType: string,
    description: string,
    institutionId: string,
    userId: string | undefined,
    hash: string
  ): Promise<string> {
    if (!this.contract) {
      throw new Error('Blockchain not connected');
    }

    const tx = await this.contract.registerEvent(
      bagId,
      eventType,
      description,
      institutionId,
      userId || '',
      hash
    );

    const receipt = await tx.wait();
    return receipt?.hash || tx.hash;
  }

  async getBloodBagEvents(bagId: string): Promise<any[]> {
    if (!this.contract) {
      throw new Error('Blockchain not connected');
    }

    return await this.contract.getBloodBagEvents(bagId);
  }

  async verifyEventHash(eventId: string, hash: string): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Blockchain not connected');
    }

    // Note: Solidity uses uint256 for event IDs, we need to convert
    const eventIdNum = parseInt(eventId) || 0;
    return await this.contract.verifyEventHash(eventIdNum, hash);
  }

  // ============================================
  // Transfer Operations
  // ============================================

  async registerTransfer(
    bagId: string,
    fromInstitutionId: string,
    toInstitutionId: string,
    status: string,
    hash: string
  ): Promise<string> {
    if (!this.contract) {
      throw new Error('Blockchain not connected');
    }

    const tx = await this.contract.registerTransfer(
      bagId,
      fromInstitutionId,
      toInstitutionId,
      status,
      hash
    );

    const receipt = await tx.wait();
    return receipt?.hash || tx.hash;
  }

  async updateTransferStatus(transferId: string, status: string, hash: string): Promise<string> {
    if (!this.contract) {
      throw new Error('Blockchain not connected');
    }

    const transferIdNum = parseInt(transferId) || 0;
    const tx = await this.contract.updateTransferStatus(transferIdNum, status, hash);
    const receipt = await tx.wait();
    return receipt?.hash || tx.hash;
  }

  // ============================================
  // Demand Operations
  // ============================================

  async registerDemand(demand: Demand): Promise<string> {
    if (!this.contract) {
      throw new Error('Blockchain not connected');
    }

    const tx = await this.contract.registerDemand(
      demand.institutionId,
      demand.bloodType as string,
      demand.quantity,
      demand.urgency as string,
      demand.status as string,
      demand.hash || ''
    );

    const receipt = await tx.wait();
    return receipt?.hash || tx.hash;
  }

  async updateDemandStatus(demandId: string, status: string, hash: string): Promise<string> {
    if (!this.contract) {
      throw new Error('Blockchain not connected');
    }

    const demandIdNum = parseInt(demandId) || 0;
    const tx = await this.contract.updateDemandStatus(demandIdNum, status, hash);
    const receipt = await tx.wait();
    return receipt?.hash || tx.hash;
  }

  // ============================================
  // Utility
  // ============================================

  async getTotalBloodBags(): Promise<number> {
    if (!this.contract) {
      throw new Error('Blockchain not connected');
    }

    const total = await this.contract.getTotalBloodBags();
    return total.toNumber();
  }

  async getTotalEvents(): Promise<number> {
    if (!this.contract) {
      throw new Error('Blockchain not connected');
    }

    const total = await this.contract.getTotalEvents();
    return total.toNumber();
  }

  // ============================================
  // Helper methods for creating hashes
  // ============================================

  createBloodBagHash(bag: BloodBag): string {
    return generateBloodBagHash(
      bag.id,
      bag.code || '',
      bag.bloodType as string,
      bag.factorRh || false,
      new Date(bag.collectionDate),
      new Date(bag.expirationDate)
    );
  }

  createEventHash(
    bagId: string,
    eventType: string,
    institutionId: string,
    userId: string | undefined,
    timestamp: Date,
    additionalData?: Record<string, unknown>
  ): string {
    return generateEventHash(
      bagId,
      eventType,
      institutionId,
      userId,
      timestamp,
      additionalData
    );
  }
}

// Export singleton instance
export const blockchainService = new HardhatBlockchainService();
