import { BloodBagStatus, BloodType, DemandStatus, DemandUrgency } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { bloodTypeLabel } from "./BloodBagService";

export class DemandService {
  static async create(params: {
    hospitalId: string;
    tipoSanguineo: BloodType;
    quantidade: number;
    urgencia: DemandUrgency;
    motivo: string;
  }) {
    return prisma.bloodDemand.create({ data: params });
  }

  static async list(filters: { status?: DemandStatus; hospitalId?: string }) {
    return prisma.bloodDemand.findMany({
      where: filters,
      include: {
        hospital: true,
        transfers: { include: { bloodBag: true, sourceInstitution: true, destinationInstitution: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async findById(id: string) {
    return prisma.bloodDemand.findUniqueOrThrow({
      where: { id },
      include: {
        hospital: true,
        transfers: { include: { bloodBag: true, sourceInstitution: true, destinationInstitution: true } },
      },
    });
  }

  /**
   * Procura instituições com bolsas DISPONIVEIS do tipo sanguíneo solicitado,
   * excluindo a própria instituição que criou a demanda.
   */
  static async findMatchingSuppliers(demandId: string) {
    const demand = await prisma.bloodDemand.findUniqueOrThrow({ where: { id: demandId } });

    const grouped = await prisma.bloodBag.groupBy({
      by: ["instituicaoAtualId"],
      where: {
        tipoSanguineo: demand.tipoSanguineo,
        status: BloodBagStatus.DISPONIVEL,
        instituicaoAtualId: { not: demand.hospitalId },
      },
      _count: { _all: true },
    });

    const institutions = await prisma.institution.findMany({
      where: { id: { in: grouped.map((g) => g.instituicaoAtualId) } },
    });

    return grouped.map((g) => ({
      institution: institutions.find((i) => i.id === g.instituicaoAtualId)!,
      disponivel: g._count._all,
      tipoSanguineo: bloodTypeLabel(demand.tipoSanguineo),
    }));
  }

  static async updateStatusFromTransfers(demandId: string) {
    const demand = await prisma.bloodDemand.findUniqueOrThrow({
      where: { id: demandId },
      include: { transfers: true },
    });

    const atendida = demand.transfers.filter((t) => t.status === "RECEBIDA").length;

    let status: DemandStatus = demand.status;
    if (atendida >= demand.quantidade) status = DemandStatus.ATENDIDA;
    else if (atendida > 0) status = DemandStatus.PARCIALMENTE_ATENDIDA;

    return prisma.bloodDemand.update({
      where: { id: demandId },
      data: { quantidadeAtendida: atendida, status },
    });
  }
}
