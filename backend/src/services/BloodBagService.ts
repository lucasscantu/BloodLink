import { BloodBagStatus, BloodType } from "@prisma/client";
import QRCode from "qrcode";
import { prisma } from "../lib/prisma";
import { EventService } from "./EventService";
import { AuthenticatedUser } from "../middlewares/auth";

const BLOOD_TYPE_LABEL: Record<BloodType, string> = {
  A_POS: "A+",
  A_NEG: "A-",
  B_POS: "B+",
  B_NEG: "B-",
  AB_POS: "AB+",
  AB_NEG: "AB-",
  O_POS: "O+",
  O_NEG: "O-",
};

export function bloodTypeLabel(type: BloodType) {
  return BLOOD_TYPE_LABEL[type];
}

function generateCodigo(tipo: BloodType) {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `${BLOOD_TYPE_LABEL[tipo]}-${year}-${random}`;
}

export class BloodBagService {
  static async create(
    params: { tipoSanguineo: BloodType; instituicaoId: string; localizacaoAtual: string },
    user: AuthenticatedUser
  ) {
    const dataColeta = new Date();
    const dataValidade = new Date(dataColeta);
    dataValidade.setDate(dataValidade.getDate() + 42); // validade padrão de concentrado de hemácias

    const codigo = generateCodigo(params.tipoSanguineo);

    const bag = await prisma.bloodBag.create({
      data: {
        codigo,
        tipoSanguineo: params.tipoSanguineo,
        dataColeta,
        dataValidade,
        status: BloodBagStatus.COLETADA,
        instituicaoAtualId: params.instituicaoId,
        localizacaoAtual: params.localizacaoAtual,
      },
    });

    const qrCode = await QRCode.toDataURL(`/blood-bags/${bag.codigo}`);
    const updated = await prisma.bloodBag.update({
      where: { id: bag.id },
      data: { qrCode },
    });

    await EventService.registerEvent({
      bagId: bag.id,
      tipoEvento: "COLETA",
      descricao: `Coleta registrada - ${bloodTypeLabel(params.tipoSanguineo)}`,
      instituicaoId: params.instituicaoId,
      usuarioId: user.id,
      data: { codigo, tipoSanguineo: params.tipoSanguineo },
    });

    return updated;
  }

  /**
   * Aprova a bolsa após os testes e a encaminha automaticamente para
   * armazenamento e disponibilidade, gerando um evento na blockchain
   * para cada etapa (APROVACAO e ARMAZENAMENTO).
   */
  static async approve(bagId: string, user: AuthenticatedUser) {
    const bag = await prisma.bloodBag.update({
      where: { id: bagId },
      data: { status: BloodBagStatus.APROVADA },
    });

    await EventService.registerEvent({
      bagId,
      tipoEvento: "APROVACAO",
      descricao: "Testes concluídos, bolsa aprovada",
      instituicaoId: bag.instituicaoAtualId,
      usuarioId: user.id,
    });

    const stored = await prisma.bloodBag.update({
      where: { id: bagId },
      data: { status: BloodBagStatus.ARMAZENADA },
    });

    await EventService.registerEvent({
      bagId,
      tipoEvento: "ARMAZENAMENTO",
      descricao: "Bolsa armazenada em câmara refrigerada",
      instituicaoId: stored.instituicaoAtualId,
      usuarioId: user.id,
    });

    return prisma.bloodBag.update({
      where: { id: bagId },
      data: { status: BloodBagStatus.DISPONIVEL },
    });
  }

  static async reject(bagId: string, motivo: string, user: AuthenticatedUser) {
    const bag = await prisma.bloodBag.update({
      where: { id: bagId },
      data: { status: BloodBagStatus.REPROVADA },
    });

    await EventService.registerEvent({
      bagId,
      tipoEvento: "REPROVACAO",
      descricao: `Bolsa reprovada: ${motivo}`,
      instituicaoId: bag.instituicaoAtualId,
      usuarioId: user.id,
      data: { motivo },
    });

    return bag;
  }

  static async use(bagId: string, user: AuthenticatedUser) {
    const bag = await prisma.bloodBag.update({
      where: { id: bagId },
      data: { status: BloodBagStatus.UTILIZADA },
    });

    await EventService.registerEvent({
      bagId,
      tipoEvento: "UTILIZACAO",
      descricao: "Bolsa utilizada em procedimento clínico",
      instituicaoId: bag.instituicaoAtualId,
      usuarioId: user.id,
    });

    return bag;
  }

  static async discard(bagId: string, motivo: string, user: AuthenticatedUser) {
    const bag = await prisma.bloodBag.update({
      where: { id: bagId },
      data: { status: BloodBagStatus.DESCARTADA },
    });

    await EventService.registerEvent({
      bagId,
      tipoEvento: "DESCARTE",
      descricao: `Bolsa descartada: ${motivo}`,
      instituicaoId: bag.instituicaoAtualId,
      usuarioId: user.id,
      data: { motivo },
    });

    return bag;
  }

  static async list(filters: { status?: BloodBagStatus; tipoSanguineo?: BloodType; instituicaoId?: string }) {
    return prisma.bloodBag.findMany({
      where: {
        status: filters.status,
        tipoSanguineo: filters.tipoSanguineo,
        // O campo no model é "instituicaoAtualId", não "instituicaoId" — passar
        // `filters` direto como `where` (como era feito antes) faz o Prisma
        // rejeitar a query com "Unknown argument `instituicaoId`", quebrando
        // o filtro por instituição em tempo de execução (ex.: o botão "Ver
        // bolsas" na página de detalhe da demanda, no frontend).
        instituicaoAtualId: filters.instituicaoId,
      },
      include: { instituicaoAtual: true },
      orderBy: { createdAt: "desc" },
    });
  }

  static async findByIdOrCodigo(idOrCodigo: string) {
    return prisma.bloodBag.findFirst({
      where: { OR: [{ id: idOrCodigo }, { codigo: idOrCodigo }] },
      include: { instituicaoAtual: true },
    });
  }

  static async history(bagId: string) {
    return prisma.bloodBagEvent.findMany({
      where: { bagId },
      include: { instituicao: true, usuario: true, blockchainTx: true },
      orderBy: { timestamp: "asc" },
    });
  }

  static async stockByType(instituicaoId?: string) {
    const bags = await prisma.bloodBag.groupBy({
      by: ["tipoSanguineo"],
      where: {
        status: BloodBagStatus.DISPONIVEL,
        ...(instituicaoId ? { instituicaoAtualId: instituicaoId } : {}),
      },
      _count: { _all: true },
    });

    return bags.map((b) => ({
      tipoSanguineo: b.tipoSanguineo,
      label: bloodTypeLabel(b.tipoSanguineo),
      quantidade: b._count._all,
    }));
  }
}
