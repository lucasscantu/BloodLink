import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";
import {
  BlockchainEventResult,
  BlockchainService,
  OnChainEvent,
  RegisterEventInput,
} from "./BlockchainService";
import { hashToBytes32 } from "../utils/hash";

/**
 * Implementação do BlockchainService usando uma rede EVM local (Hardhat)
 * e o smart contract BloodChainRegistry.sol.
 *
 * O endereço do contrato e o ABI são lidos de deployed.json, gerado pelo
 * script blockchain/scripts/deploy.ts após `npm run blockchain:deploy`.
 */
export class EvmBlockchainService implements BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  // Serializa todas as transações de ESCRITA enviadas por este processo.
  // EvmBlockchainService é um singleton (getBlockchainService()) e todas as
  // requisições HTTP concorrentes compartilham a mesma carteira/nonce. O
  // ethers.js não gerencia nonce automaticamente entre chamadas concorrentes
  // de uma mesma wallet — sem essa fila, duas requisições simultâneas (ex.:
  // dois usuários cadastrando bolsas ao mesmo tempo) poderiam calcular o
  // mesmo nonce e uma das transações falharia ("nonce too low"). Encadear
  // cada nova escrita na promise anterior garante no máximo uma transação
  // em voo por vez. Leituras (getBloodBagHistory/verifyEvent) não passam
  // por aqui, pois não têm esse problema.
  private writeQueue: Promise<unknown> = Promise.resolve();

  constructor() {
    const deployedPath = process.env.BLOCKCHAIN_DEPLOYED_PATH || path.join(__dirname, "deployed.json");

    if (!fs.existsSync(deployedPath)) {
      throw new Error(
        `Contrato não implantado (arquivo não encontrado: ${deployedPath}). Execute ` +
          "`npm run blockchain:start` e `npm run blockchain:deploy` antes de iniciar o backend " +
          "(ou, no Docker, aguarde o serviço 'blockchain' publicar o contrato)."
      );
    }

    const deployed = JSON.parse(fs.readFileSync(deployedPath, "utf-8"));
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || deployed.rpcUrl;
    const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;

    if (!privateKey) {
      throw new Error("BLOCKCHAIN_PRIVATE_KEY não configurada no .env");
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(deployed.address, deployed.abi, this.wallet);
  }

  async registerEvent(input: RegisterEventInput): Promise<BlockchainEventResult> {
    const dataHashBytes32 = hashToBytes32(input.dataHash);

    const result = this.writeQueue.then(async () => {
      const tx = await this.contract.registerEvent(
        input.bagId,
        input.eventType,
        input.institutionId,
        input.userId,
        dataHashBytes32
      );
      const receipt = await tx.wait();

      // eventIndex = quantidade de eventos da bolsa - 1 (o que acabou de ser criado)
      const count: bigint = await this.contract.eventCount(input.bagId);
      const eventIndex = Number(count) - 1;

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber ?? null,
        eventIndex,
      };
    });

    // Mantém a fila avançando mesmo se esta escrita falhar, para que uma
    // transação com erro não trave permanentemente as próximas da fila.
    this.writeQueue = result.catch(() => undefined);

    return result;
  }

  async getBloodBagHistory(bagId: string): Promise<OnChainEvent[]> {
    const raw = await this.contract.getBloodBagHistory(bagId);
    return raw.map((e: any) => ({
      bagId: e.bagId,
      eventType: e.eventType,
      institutionId: e.institutionId,
      userId: e.userId,
      dataHash: e.dataHash,
      timestamp: Number(e.timestamp),
    }));
  }

  async verifyEvent(bagId: string, eventIndex: number, expectedHash: string): Promise<boolean> {
    const expectedBytes32 = hashToBytes32(expectedHash);
    return this.contract.verifyEvent(bagId, eventIndex, expectedBytes32);
  }

  getNetworkInfo() {
    return { network: "EVM local (Hardhat)", implementation: "EvmBlockchainService" };
  }
}
