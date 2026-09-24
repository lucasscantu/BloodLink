/**
 * Stub de "@prisma/client" usado exclusivamente pela suíte de testes (Jest).
 *
 * Por quê: os enums do Prisma (BloodBagStatus, BloodType, etc.) só existem em
 * tempo de execução depois que `npx prisma generate` baixa o engine binário e
 * gera o client de verdade. Isso exige acesso à internet no momento do build.
 * Para que os testes unitários rodem de forma rápida e determinística em
 * qualquer ambiente (inclusive CI sem acesso a binaries.prisma.sh), este
 * arquivo substitui "@prisma/client" durante os testes (ver moduleNameMapper
 * em jest.config.js), fornecendo os mesmos enums como objetos identidade —
 * exatamente como o Prisma gera, já que os valores do schema.prisma usam o
 * mesmo nome como chave e como valor (ex.: `DISPONIVEL: "DISPONIVEL"`).
 *
 * Isso NÃO afeta o build de produção nem o `npx prisma generate` normal:
 * fora do Jest, o backend continua usando o client real gerado pelo Prisma.
 */

function identityEnum(keys: string[]): Record<string, string> {
  return Object.fromEntries(keys.map((k) => [k, k]));
}

export const UserRole = identityEnum(["ADMIN", "HEMOCENTRO", "HOSPITAL", "AUDITOR"]);

export const InstitutionType = identityEnum(["HEMOCENTRO", "HOSPITAL"]);

export const BloodType = identityEnum(["A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG"]);

export const BloodBagStatus = identityEnum([
  "COLETADA",
  "EM_TESTE",
  "APROVADA",
  "REPROVADA",
  "ARMAZENADA",
  "EM_TRANSPORTE",
  "RECEBIDA",
  "DISPONIVEL",
  "RESERVADA",
  "UTILIZADA",
  "DESCARTADA",
  "EXPIRADA",
]);

export const DemandStatus = identityEnum([
  "ABERTA",
  "EM_ANALISE",
  "ATENDIDA",
  "PARCIALMENTE_ATENDIDA",
  "CANCELADA",
  "EXPIRADA",
]);

export const DemandUrgency = identityEnum(["BAIXA", "MEDIA", "ALTA", "CRITICA"]);

export const TransferStatus = identityEnum([
  "OFERTADA",
  "ACEITA",
  "RESERVADA",
  "EM_TRANSPORTE",
  "RECEBIDA",
  "RECUSADA",
  "CANCELADA",
]);

export const EventType = identityEnum([
  "COLETA",
  "TESTE_INICIADO",
  "APROVACAO",
  "REPROVACAO",
  "ARMAZENAMENTO",
  "TRANSFERENCIA_CRIADA",
  "TRANSFERENCIA_ACEITA",
  "RESERVA",
  "TRANSPORTE_INICIADO",
  "RECEBIMENTO",
  "UTILIZACAO",
  "DESCARTE",
  "LEITURA_TEMPERATURA",
  "ALERTA_TEMPERATURA",
]);

/**
 * Nenhum teste instancia PrismaClient diretamente (sempre mockamos
 * "../lib/prisma"), mas exportamos um stub para o caso de algum import
 * indireto precisar do símbolo.
 */
export class PrismaClient {
  constructor() {
    throw new Error(
      "PrismaClient real não está disponível em testes. Mocke '../lib/prisma' no seu teste."
    );
  }
}
