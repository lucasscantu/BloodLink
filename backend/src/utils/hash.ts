import { createHash } from "crypto";

/**
 * Gera o hash SHA-256 determinístico de um evento, usado tanto para
 * armazenar no banco (BloodBagEvent.hash) quanto para registrar on-chain
 * (como bytes32) e permitir a verificação de integridade posterior.
 *
 * Importante: o hash é calculado a partir de identificadores e metadados,
 * nunca a partir de dados pessoais do doador ou paciente.
 */
export interface EventHashInput {
  bagId: string;
  eventType: string;
  institutionId: string;
  userId: string;
  timestamp: string; // ISO string, para determinismo
  data: Record<string, unknown>;
}

export function computeEventHash(input: EventHashInput): string {
  const payload = JSON.stringify({
    bagId: input.bagId,
    eventType: input.eventType,
    institutionId: input.institutionId,
    userId: input.userId,
    timestamp: input.timestamp,
    data: input.data,
  });

  return createHash("sha256").update(payload).digest("hex");
}

/** Converte um hash hex (sha256, 64 chars) em bytes32 (0x + 64 chars) para o contrato. */
export function hashToBytes32(hashHex: string): string {
  return "0x" + hashHex.padStart(64, "0").slice(0, 64);
}
