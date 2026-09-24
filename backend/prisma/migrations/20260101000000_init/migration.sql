-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'HEMOCENTRO', 'HOSPITAL', 'AUDITOR');

-- CreateEnum
CREATE TYPE "InstitutionType" AS ENUM ('HEMOCENTRO', 'HOSPITAL');

-- CreateEnum
CREATE TYPE "BloodType" AS ENUM ('A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG');

-- CreateEnum
CREATE TYPE "BloodBagStatus" AS ENUM ('COLETADA', 'EM_TESTE', 'APROVADA', 'REPROVADA', 'ARMAZENADA', 'EM_TRANSPORTE', 'RECEBIDA', 'DISPONIVEL', 'RESERVADA', 'UTILIZADA', 'DESCARTADA', 'EXPIRADA');

-- CreateEnum
CREATE TYPE "DemandStatus" AS ENUM ('ABERTA', 'EM_ANALISE', 'ATENDIDA', 'PARCIALMENTE_ATENDIDA', 'CANCELADA', 'EXPIRADA');

-- CreateEnum
CREATE TYPE "DemandUrgency" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('OFERTADA', 'ACEITA', 'RESERVADA', 'EM_TRANSPORTE', 'RECEBIDA', 'RECUSADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('COLETA', 'TESTE_INICIADO', 'APROVACAO', 'REPROVACAO', 'ARMAZENAMENTO', 'TRANSFERENCIA_CRIADA', 'TRANSFERENCIA_ACEITA', 'RESERVA', 'TRANSPORTE_INICIADO', 'RECEBIMENTO', 'UTILIZACAO', 'DESCARTE', 'LEITURA_TEMPERATURA', 'ALERTA_TEMPERATURA');

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "InstitutionType" NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "institutionId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloodBag" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipoSanguineo" "BloodType" NOT NULL,
    "dataColeta" TIMESTAMP(3) NOT NULL,
    "dataValidade" TIMESTAMP(3) NOT NULL,
    "status" "BloodBagStatus" NOT NULL DEFAULT 'COLETADA',
    "instituicaoAtualId" TEXT NOT NULL,
    "localizacaoAtual" TEXT NOT NULL,
    "temperaturaAtual" DOUBLE PRECISION,
    "qrCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BloodBag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloodBagEvent" (
    "id" TEXT NOT NULL,
    "bagId" TEXT NOT NULL,
    "tipoEvento" "EventType" NOT NULL,
    "descricao" TEXT NOT NULL,
    "instituicaoId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hash" TEXT NOT NULL,
    "eventIndex" INTEGER NOT NULL,
    "blockchainTransactionId" TEXT,

    CONSTRAINT "BloodBagEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloodDemand" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "tipoSanguineo" "BloodType" NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "quantidadeAtendida" INTEGER NOT NULL DEFAULT 0,
    "urgencia" "DemandUrgency" NOT NULL,
    "motivo" TEXT NOT NULL,
    "status" "DemandStatus" NOT NULL DEFAULT 'ABERTA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BloodDemand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloodTransfer" (
    "id" TEXT NOT NULL,
    "demandId" TEXT,
    "bagId" TEXT NOT NULL,
    "sourceInstitutionId" TEXT NOT NULL,
    "destinationInstitutionId" TEXT NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'OFERTADA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BloodTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemperatureReading" (
    "id" TEXT NOT NULL,
    "bagId" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "alerta" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemperatureReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockchainTransaction" (
    "id" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" INTEGER,
    "contractMethod" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMADA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockchainTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "acao" TEXT NOT NULL,
    "detalhes" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BloodBag_codigo_key" ON "BloodBag"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "BlockchainTransaction_txHash_key" ON "BlockchainTransaction"("txHash");

-- CreateIndex
CREATE INDEX "Institution_type_idx" ON "Institution"("type");

-- CreateIndex
CREATE INDEX "User_institutionId_idx" ON "User"("institutionId");

-- CreateIndex
CREATE INDEX "BloodBag_tipoSanguineo_idx" ON "BloodBag"("tipoSanguineo");

-- CreateIndex
CREATE INDEX "BloodBag_status_idx" ON "BloodBag"("status");

-- CreateIndex
CREATE INDEX "BloodBag_instituicaoAtualId_idx" ON "BloodBag"("instituicaoAtualId");

-- CreateIndex
CREATE INDEX "BloodBagEvent_bagId_idx" ON "BloodBagEvent"("bagId");

-- CreateIndex
CREATE INDEX "BloodBagEvent_tipoEvento_idx" ON "BloodBagEvent"("tipoEvento");

-- CreateIndex
CREATE INDEX "BloodDemand_tipoSanguineo_idx" ON "BloodDemand"("tipoSanguineo");

-- CreateIndex
CREATE INDEX "BloodDemand_status_idx" ON "BloodDemand"("status");

-- CreateIndex
CREATE INDEX "BloodTransfer_status_idx" ON "BloodTransfer"("status");

-- CreateIndex
CREATE INDEX "BloodTransfer_bagId_idx" ON "BloodTransfer"("bagId");

-- CreateIndex
CREATE INDEX "TemperatureReading_bagId_idx" ON "TemperatureReading"("bagId");

-- CreateIndex
CREATE INDEX "AuditLog_acao_idx" ON "AuditLog"("acao");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodBag" ADD CONSTRAINT "BloodBag_instituicaoAtualId_fkey" FOREIGN KEY ("instituicaoAtualId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodBagEvent" ADD CONSTRAINT "BloodBagEvent_bagId_fkey" FOREIGN KEY ("bagId") REFERENCES "BloodBag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodBagEvent" ADD CONSTRAINT "BloodBagEvent_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodBagEvent" ADD CONSTRAINT "BloodBagEvent_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodBagEvent" ADD CONSTRAINT "BloodBagEvent_blockchainTransactionId_fkey" FOREIGN KEY ("blockchainTransactionId") REFERENCES "BlockchainTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodDemand" ADD CONSTRAINT "BloodDemand_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodTransfer" ADD CONSTRAINT "BloodTransfer_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "BloodDemand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodTransfer" ADD CONSTRAINT "BloodTransfer_bagId_fkey" FOREIGN KEY ("bagId") REFERENCES "BloodBag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodTransfer" ADD CONSTRAINT "BloodTransfer_sourceInstitutionId_fkey" FOREIGN KEY ("sourceInstitutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodTransfer" ADD CONSTRAINT "BloodTransfer_destinationInstitutionId_fkey" FOREIGN KEY ("destinationInstitutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemperatureReading" ADD CONSTRAINT "TemperatureReading_bagId_fkey" FOREIGN KEY ("bagId") REFERENCES "BloodBag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
