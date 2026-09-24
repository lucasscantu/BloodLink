jest.mock("../lib/prisma", () => ({
  prisma: {
    bloodDemand: { create: jest.fn(), findMany: jest.fn(), findUniqueOrThrow: jest.fn(), update: jest.fn() },
    bloodBag: { groupBy: jest.fn() },
    institution: { findMany: jest.fn() },
  },
}));

import { prisma } from "../lib/prisma";
import { DemandService } from "./DemandService";

beforeEach(() => jest.clearAllMocks());

describe("DemandService.findById e list — include de transfers", () => {
  it("findById inclui destinationInstitution nas transferências (não só sourceInstitution)", async () => {
    (prisma.bloodDemand.findUniqueOrThrow as jest.Mock).mockResolvedValue({ id: "demand-1" });

    await DemandService.findById("demand-1");

    const callArgs = (prisma.bloodDemand.findUniqueOrThrow as jest.Mock).mock.calls[0][0];
    expect(callArgs.include.transfers.include).toEqual(
      expect.objectContaining({ bloodBag: true, sourceInstitution: true, destinationInstitution: true })
    );
  });

  it("list inclui destinationInstitution nas transferências (o frontend renderiza t.destinationInstitution.name)", async () => {
    (prisma.bloodDemand.findMany as jest.Mock).mockResolvedValue([]);

    await DemandService.list({});

    const callArgs = (prisma.bloodDemand.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.include.transfers.include).toEqual(
      expect.objectContaining({ bloodBag: true, sourceInstitution: true, destinationInstitution: true })
    );
  });
});

describe("DemandService.create", () => {
  it("cria a demanda com os parâmetros informados", async () => {
    (prisma.bloodDemand.create as jest.Mock).mockResolvedValue({ id: "demand-1" });

    await DemandService.create({
      hospitalId: "hosp-a",
      tipoSanguineo: "O_NEG",
      quantidade: 5,
      urgencia: "ALTA",
      motivo: "Reposição de estoque",
    });

    expect(prisma.bloodDemand.create).toHaveBeenCalledWith({
      data: { hospitalId: "hosp-a", tipoSanguineo: "O_NEG", quantidade: 5, urgencia: "ALTA", motivo: "Reposição de estoque" },
    });
  });
});

describe("DemandService.findMatchingSuppliers", () => {
  it("exclui a própria instituição solicitante e retorna fornecedores com estoque compatível", async () => {
    (prisma.bloodDemand.findUniqueOrThrow as jest.Mock).mockResolvedValue({
      id: "demand-1",
      hospitalId: "hosp-a",
      tipoSanguineo: "O_NEG",
    });
    (prisma.bloodBag.groupBy as jest.Mock).mockResolvedValue([
      { instituicaoAtualId: "hemocentro", _count: { _all: 10 } },
      { instituicaoAtualId: "hosp-b", _count: { _all: 4 } },
    ]);
    (prisma.institution.findMany as jest.Mock).mockResolvedValue([
      { id: "hemocentro", name: "Hemocentro Central" },
      { id: "hosp-b", name: "Hospital Municipal" },
    ]);

    const result = await DemandService.findMatchingSuppliers("demand-1");

    // Garante que a consulta exclui a instituição que criou a demanda
    expect(prisma.bloodBag.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tipoSanguineo: "O_NEG",
          status: "DISPONIVEL",
          instituicaoAtualId: { not: "hosp-a" },
        }),
      })
    );

    expect(result).toEqual([
      { institution: { id: "hemocentro", name: "Hemocentro Central" }, disponivel: 10, tipoSanguineo: "O-" },
      { institution: { id: "hosp-b", name: "Hospital Municipal" }, disponivel: 4, tipoSanguineo: "O-" },
    ]);
  });

  it("retorna lista vazia quando nenhuma instituição tem estoque compatível", async () => {
    (prisma.bloodDemand.findUniqueOrThrow as jest.Mock).mockResolvedValue({
      id: "demand-1",
      hospitalId: "hosp-a",
      tipoSanguineo: "AB_NEG",
    });
    (prisma.bloodBag.groupBy as jest.Mock).mockResolvedValue([]);
    (prisma.institution.findMany as jest.Mock).mockResolvedValue([]);

    const result = await DemandService.findMatchingSuppliers("demand-1");
    expect(result).toEqual([]);
  });
});

describe("DemandService.updateStatusFromTransfers", () => {
  it("marca como ATENDIDA quando a quantidade recebida atinge o total solicitado", async () => {
    (prisma.bloodDemand.findUniqueOrThrow as jest.Mock).mockResolvedValue({
      id: "demand-1",
      quantidade: 2,
      status: "ABERTA",
      transfers: [{ status: "RECEBIDA" }, { status: "RECEBIDA" }],
    });
    (prisma.bloodDemand.update as jest.Mock).mockResolvedValue({ id: "demand-1", status: "ATENDIDA" });

    await DemandService.updateStatusFromTransfers("demand-1");

    expect(prisma.bloodDemand.update).toHaveBeenCalledWith({
      where: { id: "demand-1" },
      data: { quantidadeAtendida: 2, status: "ATENDIDA" },
    });
  });

  it("marca como PARCIALMENTE_ATENDIDA quando parte da quantidade foi recebida", async () => {
    (prisma.bloodDemand.findUniqueOrThrow as jest.Mock).mockResolvedValue({
      id: "demand-1",
      quantidade: 5,
      status: "ABERTA",
      transfers: [{ status: "RECEBIDA" }, { status: "EM_TRANSPORTE" }],
    });
    (prisma.bloodDemand.update as jest.Mock).mockResolvedValue({ id: "demand-1", status: "PARCIALMENTE_ATENDIDA" });

    await DemandService.updateStatusFromTransfers("demand-1");

    expect(prisma.bloodDemand.update).toHaveBeenCalledWith({
      where: { id: "demand-1" },
      data: { quantidadeAtendida: 1, status: "PARCIALMENTE_ATENDIDA" },
    });
  });

  it("mantém o status original quando nenhuma transferência foi recebida ainda", async () => {
    (prisma.bloodDemand.findUniqueOrThrow as jest.Mock).mockResolvedValue({
      id: "demand-1",
      quantidade: 5,
      status: "ABERTA",
      transfers: [{ status: "OFERTADA" }],
    });
    (prisma.bloodDemand.update as jest.Mock).mockResolvedValue({ id: "demand-1", status: "ABERTA" });

    await DemandService.updateStatusFromTransfers("demand-1");

    expect(prisma.bloodDemand.update).toHaveBeenCalledWith({
      where: { id: "demand-1" },
      data: { quantidadeAtendida: 0, status: "ABERTA" },
    });
  });
});
