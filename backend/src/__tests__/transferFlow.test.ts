/**
 * Testa a lógica de transição de estados do fluxo de transferência
 * (oferta -> aceite -> reserva -> transporte -> recebimento), com o
 * Prisma e o BlockchainService mockados para rodar sem infraestrutura real.
 */

jest.mock("../lib/prisma", () => ({
  prisma: {
    bloodTransfer: { create: jest.fn(), update: jest.fn(), findUniqueOrThrow: jest.fn() },
    bloodBag: { update: jest.fn(), findUniqueOrThrow: jest.fn() },
    bloodBagEvent: { create: jest.fn(), findMany: jest.fn() },
    blockchainTransaction: { create: jest.fn() },
    bloodDemand: { update: jest.fn(), findUniqueOrThrow: jest.fn() },
  },
}));

jest.mock("../blockchain", () => ({
  getBlockchainService: () => ({
    registerEvent: jest.fn().mockResolvedValue({ txHash: "0xabc", blockNumber: 1, eventIndex: 0 }),
    getNetworkInfo: () => ({ network: "mock", implementation: "mock" }),
  }),
}));

import { prisma } from "../lib/prisma";
import { TransferService } from "../services/TransferService";
import { AuthenticatedUser } from "../middlewares/auth";

const user: AuthenticatedUser = { id: "user-1", role: "HOSPITAL", institutionId: "inst-hospital-b", name: "Teste" };

beforeEach(() => jest.clearAllMocks());

describe("TransferService.offer", () => {
  it("só permite oferecer bolsas com status DISPONIVEL", async () => {
    (prisma.bloodBag.findUniqueOrThrow as jest.Mock).mockResolvedValue({
      id: "bag-1",
      status: "RESERVADA",
      instituicaoAtualId: "inst-hospital-b",
    });

    await expect(
      TransferService.offer({ bagId: "bag-1", destinationInstitutionId: "inst-hospital-a" }, user)
    ).rejects.toThrow("Apenas bolsas DISPONIVEIS");
  });

  it("cria a transferência com status OFERTADA quando a bolsa está DISPONIVEL", async () => {
    (prisma.bloodBag.findUniqueOrThrow as jest.Mock).mockResolvedValue({
      id: "bag-1",
      status: "DISPONIVEL",
      instituicaoAtualId: "inst-hospital-b",
    });
    (prisma.bloodTransfer.create as jest.Mock).mockResolvedValue({ id: "transfer-1", status: "OFERTADA" });
    (prisma.bloodBagEvent.create as jest.Mock).mockResolvedValue({ id: "event-1" });
    (prisma.blockchainTransaction.create as jest.Mock).mockResolvedValue({ id: "tx-1" });

    const transfer = await TransferService.offer(
      { bagId: "bag-1", destinationInstitutionId: "inst-hospital-a" },
      user
    );

    expect(transfer.status).toBe("OFERTADA");
    expect(prisma.bloodTransfer.create).toHaveBeenCalled();
  });
});

describe("TransferService.accept", () => {
  it("só permite aceitar transferências com status OFERTADA", async () => {
    (prisma.bloodTransfer.findUniqueOrThrow as jest.Mock).mockResolvedValue({
      id: "transfer-1",
      status: "RECUSADA",
    });

    await expect(TransferService.accept("transfer-1", user)).rejects.toThrow("Apenas transferências OFERTADAS");
    expect(prisma.bloodTransfer.update).not.toHaveBeenCalled();
  });

  it("avança a transferência OFERTADA até EM_TRANSPORTE e reserva a bolsa", async () => {
    (prisma.bloodTransfer.findUniqueOrThrow as jest.Mock).mockResolvedValue({ id: "transfer-1", status: "OFERTADA" });
    (prisma.bloodTransfer.update as jest.Mock).mockResolvedValue({
      id: "transfer-1",
      bagId: "bag-1",
      destinationInstitutionId: "inst-hospital-a",
      status: "EM_TRANSPORTE",
      bloodBag: { instituicaoAtualId: "inst-hospital-b" },
    });
    (prisma.bloodBag.update as jest.Mock).mockResolvedValue({});
    (prisma.bloodBagEvent.create as jest.Mock).mockResolvedValue({ id: "event-1" });
    (prisma.blockchainTransaction.create as jest.Mock).mockResolvedValue({ id: "tx-1" });

    const result = await TransferService.accept("transfer-1", user);

    expect(result.status).toBe("EM_TRANSPORTE");
    // 3 transições de status da bolsa: RESERVADA, depois EM_TRANSPORTE (a 1ª chamada é a checagem inicial via findUniqueOrThrow, não conta aqui)
    expect(prisma.bloodBag.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "RESERVADA" } })
    );
    expect(prisma.bloodBag.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "EM_TRANSPORTE" } })
    );
  });
});

describe("TransferService.receive", () => {
  it("só permite confirmar recebimento de transferências EM_TRANSPORTE", async () => {
    (prisma.bloodTransfer.findUniqueOrThrow as jest.Mock).mockResolvedValue({
      id: "transfer-1",
      status: "OFERTADA",
    });

    await expect(TransferService.receive("transfer-1", user)).rejects.toThrow("Apenas transferências EM_TRANSPORTE");
    expect(prisma.bloodBag.update).not.toHaveBeenCalled();
  });

  it("confirma o recebimento e transfere a bolsa para a instituição de destino quando EM_TRANSPORTE", async () => {
    (prisma.bloodTransfer.findUniqueOrThrow as jest.Mock).mockResolvedValue({
      id: "transfer-1",
      bagId: "bag-1",
      demandId: null,
      status: "EM_TRANSPORTE",
      destinationInstitutionId: "inst-hospital-a",
    });
    (prisma.bloodBag.update as jest.Mock).mockResolvedValue({});
    (prisma.bloodBagEvent.create as jest.Mock).mockResolvedValue({ id: "event-1" });
    (prisma.blockchainTransaction.create as jest.Mock).mockResolvedValue({ id: "tx-1" });
    (prisma.bloodTransfer.update as jest.Mock).mockResolvedValue({ id: "transfer-1", status: "RECEBIDA" });

    const result = await TransferService.receive("transfer-1", user);

    expect(result.status).toBe("RECEBIDA");
    expect(prisma.bloodBag.update).toHaveBeenCalledWith({
      where: { id: "bag-1" },
      data: { status: "DISPONIVEL", instituicaoAtualId: "inst-hospital-a" },
    });
  });
});
