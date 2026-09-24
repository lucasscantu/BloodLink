/**
 * BlockchainService
 * ------------------
 * Interface que isola o restante da aplicação da implementação concreta
 * de blockchain utilizada. Hoje o projeto usa uma rede EVM local (Hardhat)
 * via EvmBlockchainService, mas a aplicação poderia trocar para Hyperledger
 * Fabric (ou outra rede permissionada) implementando esta mesma interface,
 * sem alterar controllers, services de domínio ou frontend.
 */

export interface RegisterEventInput {
  bagId: string;
  eventType: string;
  institutionId: string;
  userId: string;
  dataHash: string; // sha256 hex (64 chars)
}

export interface BlockchainEventResult {
  txHash: string;
  blockNumber: number | null;
  eventIndex: number;
}

export interface OnChainEvent {
  bagId: string;
  eventType: string;
  institutionId: string;
  userId: string;
  dataHash: string;
  timestamp: number;
}

export interface BlockchainService {
  /** Registra um novo evento imutável para uma bolsa. */
  registerEvent(input: RegisterEventInput): Promise<BlockchainEventResult>;

  /** Retorna o histórico completo de eventos de uma bolsa, direto da chain. */
  getBloodBagHistory(bagId: string): Promise<OnChainEvent[]>;

  /** Verifica se o hash informado bate com o hash registrado on-chain naquele índice. */
  verifyEvent(bagId: string, eventIndex: number, expectedHash: string): Promise<boolean>;

  /** Nome da rede/implementação em uso (para exibir na tela de Auditoria). */
  getNetworkInfo(): { network: string; implementation: string };
}
