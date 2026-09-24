import { BloodBagStatus, DemandStatus, DemandUrgency, TransferStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { BloodBagService } from "./BloodBagService";

export class DashboardService {
  static async getSummary() {
    const [
      disponiveis,
      emTransporte,
      utilizadas,
      expiradas,
      demandasAbertas,
      demandasUrgentes,
      transferenciasAndamento,
      alertasTemperatura,
      estoquePorTipo,
    ] = await Promise.all([
      prisma.bloodBag.count({ where: { status: BloodBagStatus.DISPONIVEL } }),
      prisma.bloodBag.count({ where: { status: BloodBagStatus.EM_TRANSPORTE } }),
      prisma.bloodBag.count({ where: { status: BloodBagStatus.UTILIZADA } }),
      prisma.bloodBag.count({ where: { status: BloodBagStatus.EXPIRADA } }),
      prisma.bloodDemand.count({ where: { status: DemandStatus.ABERTA } }),
      prisma.bloodDemand.count({
        where: { status: DemandStatus.ABERTA, urgencia: { in: [DemandUrgency.ALTA, DemandUrgency.CRITICA] } },
      }),
      prisma.bloodTransfer.count({
        where: { status: { in: [TransferStatus.OFERTADA, TransferStatus.ACEITA, TransferStatus.RESERVADA, TransferStatus.EM_TRANSPORTE] } },
      }),
      prisma.temperatureReading.count({ where: { alerta: true } }),
      BloodBagService.stockByType(),
    ]);

    const movimentacoes = await prisma.bloodBagEvent.groupBy({
      by: ["tipoEvento"],
      _count: { _all: true },
    });

    const demandasPorStatus = await prisma.bloodDemand.groupBy({
      by: ["status"],
      _count: { _all: true },
    });

    return {
      cards: {
        disponiveis,
        emTransporte,
        utilizadas,
        expiradas,
        demandasAbertas,
        demandasUrgentes,
        transferenciasAndamento,
        alertasTemperatura,
      },
      estoquePorTipo,
      movimentacoes: movimentacoes.map((m) => ({ tipo: m.tipoEvento, quantidade: m._count._all })),
      demandasPorStatus: demandasPorStatus.map((d) => ({ status: d.status, quantidade: d._count._all })),
    };
  }
}
