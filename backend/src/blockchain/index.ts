import { BlockchainService } from "./BlockchainService";
import { EvmBlockchainService } from "./EvmBlockchainService";

/**
 * Ponto único de acesso ao BlockchainService. Trocar de implementação
 * (ex.: para uma futura HyperledgerFabricBlockchainService) exige apenas
 * alterar esta função — nenhum outro arquivo do backend conhece detalhes
 * de blockchain concreta.
 */
let instance: BlockchainService | null = null;

export function getBlockchainService(): BlockchainService {
  if (!instance) {
    instance = new EvmBlockchainService();
  }
  return instance;
}

export * from "./BlockchainService";
