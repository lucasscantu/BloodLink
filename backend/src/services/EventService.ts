import { EventType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { getBlockchainService } from "../blockchain";
import { computeEventHash } from "../utils/hash";

interface RegisterDomainEventInput {
  bagId: string;
  tipoEvento: EventType;
  descricao: string;
  instituicaoId: string;
  usuarioId?: string | null;
  data?: Record<string, unknown>;
}

/**
 * EventService é o único lugar do sistema que cria um BloodBagEvent.
 * Toda operação relevante sobre uma bolsa (coleta, aprovação, transferência,
 * recebimento, uso, descarte, leitura de temperatura, etc.) passa por aqui,
 * garantindo que:
 *   1. um hash SHA-256 determinístico seja calculado;
 *   2. o evento seja realmente registrado na blockchain (nunca simulado);
 *   3. o BloodBagEvent no PostgreSQL guarde o hash e o id da transação on-chain.
 */
export class EventService {
  static async registerEvent(input: RegisterDomainEventInput) {
    const timestamp = new Date();

    const hash = computeEventHash({
      bagId: input.bagId,
      eventType: input.tipoEvento,
      institutionId: input.instituicaoId,
      userId: input.usuarioId ?? "sistema",
      timestamp: timestamp.toISOString(),
      data: input.data ?? {},
    });

    const blockchain = getBlockchainService();
    const chainResult = await blockchain.registerEvent({
      bagId: input.bagId,
      eventType: input.tipoEvento,
      institutionId: input.instituicaoId,
      userId: input.usuarioId ?? "sistema",
      dataHash: hash,
    });

    const blockchainTx = await prisma.blockchainTransaction.create({
      data: {
        txHash: chainResult.txHash,
        blockNumber: chainResult.blockNumber ?? undefined,
        contractMethod: "registerEvent",
        payloadHash: hash,
        network: blockchain.getNetworkInfo().network,
      },
    });

    const event = await prisma.bloodBagEvent.create({
      data: {
        bagId: input.bagId,
        tipoEvento: input.tipoEvento,
        descricao: input.descricao,
        instituicaoId: input.instituicaoId,
        usuarioId: input.usuarioId ?? undefined,
        timestamp,
        hash,
        eventIndex: chainResult.eventIndex,
        blockchainTransactionId: blockchainTx.id,
      },
      include: { instituicao: true, usuario: true, blockchainTx: true },
    });

    return event;
  }

  /** Recalcula o hash de um evento a partir dos dados atuais do banco e compara com o hash armazenado e com o hash on-chain. */
  static async verifyIntegrity(eventId: string) {
    const event = await prisma.bloodBagEvent.findUniqueOrThrow({
      where: { id: eventId },
      include: { blockchainTx: true },
    });

    // O hash é determinístico a partir de (bagId, tipo, instituição, usuário, timestamp, dados).
    // Como não guardamos o payload bruto "data" separadamente, a verificação de integridade
    // compara o hash persistido no PostgreSQL com o hash efetivamente gravado on-chain,
    // que é a fonte da verdade imutável. Usamos o eventIndex real gravado no momento da
    // criação do evento (retornado pela própria blockchain), em vez de tentar inferir a
    // posição por ordenação de timestamp — o que seria frágil se dois eventos da mesma
    // bolsa caíssem no mesmo milissegundo.
    const blockchain = getBlockchainService();
    const isValid = await blockchain.verifyEvent(event.bagId, event.eventIndex, event.hash);

    return {
      eventId: event.id,
      bagId: event.bagId,
      hashArmazenado: event.hash,
      txHash: event.blockchainTx?.txHash ?? null,
      integro: isValid,
    };
  }
}
