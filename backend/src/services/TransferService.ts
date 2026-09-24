import { BloodBagStatus, TransferStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { EventService } from "./EventService";
import { AuthenticatedUser } from "../middlewares/auth";
import { DemandService } from "./DemandService";

export class TransferService {
  /** Uma instituição com estoque oferece uma bolsa específica para atender uma demanda. */
  static async offer(
    params: { demandId?: string; bagId: string; destinationInstitutionId: string },
    user: AuthenticatedUser
  ) {
    const bag = await prisma.bloodBag.findUniqueOrThrow({ where: { id: params.bagId } });

    if (bag.status !== BloodBagStatus.DISPONIVEL) {
      throw new Error("Apenas bolsas DISPONIVEIS podem ser oferecidas para transferência.");
    }

    const transfer = await prisma.bloodTransfer.create({
      data: {
        demandId: params.demandId,
        bagId: params.bagId,
        sourceInstitutionId: bag.instituicaoAtualId,
        destinationInstitutionId: params.destinationInstitutionId,
        status: TransferStatus.OFERTADA,
      },
    });

    await EventService.registerEvent({
      bagId: params.bagId,
      tipoEvento: "TRANSFERENCIA_CRIADA",
      descricao: `Transferência oferecida para instituição destino`,
      instituicaoId: bag.instituicaoAtualId,
      usuarioId: user.id,
      data: { transferId: transfer.id, destino: params.destinationInstitutionId },
    });

    return transfer;
  }

  /** A instituição de destino (ex.: hospital que criou a demanda) aceita a oferta. */
  static async accept(transferId: string, user: AuthenticatedUser) {
    const existing = await prisma.bloodTransfer.findUniqueOrThrow({ where: { id: transferId } });

    if (existing.status !== TransferStatus.OFERTADA) {
      throw new Error("Apenas transferências OFERTADAS podem ser aceitas.");
    }

    const transfer = await prisma.bloodTransfer.update({
      where: { id: transferId },
      data: { status: TransferStatus.ACEITA },
      include: { bloodBag: true },
    });

    await EventService.registerEvent({
      bagId: transfer.bagId,
      tipoEvento: "TRANSFERENCIA_ACEITA",
      descricao: "Transferência aceita pela instituição de destino",
      instituicaoId: transfer.destinationInstitutionId,
      usuarioId: user.id,
      data: { transferId },
    });

    // Reserva a bolsa
    await prisma.bloodBag.update({
      where: { id: transfer.bagId },
      data: { status: BloodBagStatus.RESERVADA },
    });
    await EventService.registerEvent({
      bagId: transfer.bagId,
      tipoEvento: "RESERVA",
      descricao: "Bolsa reservada para transferência",
      instituicaoId: transfer.bloodBag.instituicaoAtualId,
      usuarioId: user.id,
    });

    await prisma.bloodTransfer.update({
      where: { id: transferId },
      data: { status: TransferStatus.RESERVADA },
    });

    // Inicia transporte automaticamente
    await prisma.bloodBag.update({
      where: { id: transfer.bagId },
      data: { status: BloodBagStatus.EM_TRANSPORTE },
    });
    await EventService.registerEvent({
      bagId: transfer.bagId,
      tipoEvento: "TRANSPORTE_INICIADO",
      descricao: "Bolsa em transporte para instituição de destino",
      instituicaoId: transfer.bloodBag.instituicaoAtualId,
      usuarioId: user.id,
    });

    return prisma.bloodTransfer.update({
      where: { id: transferId },
      data: { status: TransferStatus.EM_TRANSPORTE },
    });
  }

  /** A instituição de destino confirma o recebimento físico da bolsa. */
  static async receive(transferId: string, user: AuthenticatedUser) {
    const transfer = await prisma.bloodTransfer.findUniqueOrThrow({ where: { id: transferId } });

    if (transfer.status !== TransferStatus.EM_TRANSPORTE) {
      throw new Error("Apenas transferências EM_TRANSPORTE podem ser recebidas.");
    }

    await prisma.bloodBag.update({
      where: { id: transfer.bagId },
      data: {
        status: BloodBagStatus.DISPONIVEL,
        instituicaoAtualId: transfer.destinationInstitutionId,
      },
    });

    await EventService.registerEvent({
      bagId: transfer.bagId,
      tipoEvento: "RECEBIMENTO",
      descricao: "Bolsa recebida pela instituição de destino",
      instituicaoId: transfer.destinationInstitutionId,
      usuarioId: user.id,
      data: { transferId },
    });

    const updated = await prisma.bloodTransfer.update({
      where: { id: transferId },
      data: { status: TransferStatus.RECEBIDA },
    });

    if (transfer.demandId) {
      await DemandService.updateStatusFromTransfers(transfer.demandId);
    }

    return updated;
  }

  static async reject(transferId: string, user: AuthenticatedUser) {
    const transfer = await prisma.bloodTransfer.update({
      where: { id: transferId },
      data: { status: TransferStatus.RECUSADA },
    });

    await EventService.registerEvent({
      bagId: transfer.bagId,
      tipoEvento: "TRANSFERENCIA_CRIADA",
      descricao: "Oferta de transferência recusada",
      instituicaoId: transfer.destinationInstitutionId,
      usuarioId: user.id,
      data: { transferId, recusada: true },
    });

    return transfer;
  }

  static async list(filters: { status?: TransferStatus; institutionId?: string }) {
    return prisma.bloodTransfer.findMany({
      where: {
        status: filters.status,
        OR: filters.institutionId
          ? [
              { sourceInstitutionId: filters.institutionId },
              { destinationInstitutionId: filters.institutionId },
            ]
          : undefined,
      },
      include: { bloodBag: true, sourceInstitution: true, destinationInstitution: true, demand: true },
      orderBy: { createdAt: "desc" },
    });
  }
}
