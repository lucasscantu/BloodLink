jest.mock("../lib/prisma", () => ({
  prisma: {
    bloodBag: { create: jest.fn(), update: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), groupBy: jest.fn() },
    bloodBagEvent: { findMany: jest.fn() },
  },
}));

jest.mock("qrcode", () => ({
  __esModule: true,
  default: { toDataURL: jest.fn().mockResolvedValue("data:image/png;base64,fake") },
}));

jest.mock("./EventService", () => ({
  EventService: { registerEvent: jest.fn().mockResolvedValue({ id: "event-1" }) },
}));

import { prisma } from "../lib/prisma";
import { BloodBagService, bloodTypeLabel } from "./BloodBagService";
import { EventService } from "./EventService";
import { AuthenticatedUser } from "../middlewares/auth";

const user: AuthenticatedUser = { id: "user-1", role: "HEMOCENTRO", institutionId: "inst-1", name: "Marina" };

beforeEach(() => jest.clearAllMocks());

describe("bloodTypeLabel", () => {
  it("converte os códigos internos para os rótulos exibidos ao usuário", () => {
    expect(bloodTypeLabel("O_NEG")).toBe("O-");
    expect(bloodTypeLabel("AB_POS")).toBe("AB+");
  });
});

describe("BloodBagService.create", () => {
  it("cria a bolsa com status COLETADA, gera o QR Code e registra o evento COLETA", async () => {
    (prisma.bloodBag.create as jest.Mock).mockResolvedValue({ id: "bag-1", codigo: "O--2026-00001" });
    (prisma.bloodBag.update as jest.Mock).mockResolvedValue({ id: "bag-1", codigo: "O--2026-00001", qrCode: "data:..." });

    const result = await BloodBagService.create(
      { tipoSanguineo: "O_NEG", instituicaoId: "inst-1", localizacaoAtual: "Câmara 01" },
      user
    );

    expect(prisma.bloodBag.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "COLETADA", tipoSanguineo: "O_NEG" }) })
    );
    expect(prisma.bloodBag.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ qrCode: expect.any(String) }) })
    );
    expect(EventService.registerEvent).toHaveBeenCalledWith(
      expect.objectContaining({ bagId: "bag-1", tipoEvento: "COLETA", instituicaoId: "inst-1", usuarioId: "user-1" })
    );
    expect(result.codigo).toBe("O--2026-00001");
  });

  it("define a validade para 42 dias após a coleta", async () => {
    (prisma.bloodBag.create as jest.Mock).mockResolvedValue({ id: "bag-1", codigo: "A+-2026-00002" });
    (prisma.bloodBag.update as jest.Mock).mockResolvedValue({ id: "bag-1" });

    await BloodBagService.create({ tipoSanguineo: "A_POS", instituicaoId: "inst-1", localizacaoAtual: "Câmara 01" }, user);

    const callArgs = (prisma.bloodBag.create as jest.Mock).mock.calls[0][0].data;
    const dias = Math.round((callArgs.dataValidade.getTime() - callArgs.dataColeta.getTime()) / (1000 * 60 * 60 * 24));
    expect(dias).toBe(42);
  });
});

describe("BloodBagService.approve", () => {
  it("percorre APROVADA -> ARMAZENADA -> DISPONIVEL e registra dois eventos na blockchain", async () => {
    (prisma.bloodBag.update as jest.Mock)
      .mockResolvedValueOnce({ id: "bag-1", instituicaoAtualId: "inst-1", status: "APROVADA" })
      .mockResolvedValueOnce({ id: "bag-1", instituicaoAtualId: "inst-1", status: "ARMAZENADA" })
      .mockResolvedValueOnce({ id: "bag-1", instituicaoAtualId: "inst-1", status: "DISPONIVEL" });

    const result = await BloodBagService.approve("bag-1", user);

    expect(prisma.bloodBag.update).toHaveBeenNthCalledWith(1, { where: { id: "bag-1" }, data: { status: "APROVADA" } });
    expect(prisma.bloodBag.update).toHaveBeenNthCalledWith(2, { where: { id: "bag-1" }, data: { status: "ARMAZENADA" } });
    expect(prisma.bloodBag.update).toHaveBeenNthCalledWith(3, { where: { id: "bag-1" }, data: { status: "DISPONIVEL" } });

    expect(EventService.registerEvent).toHaveBeenCalledTimes(2);
    expect((EventService.registerEvent as jest.Mock).mock.calls[0][0].tipoEvento).toBe("APROVACAO");
    expect((EventService.registerEvent as jest.Mock).mock.calls[1][0].tipoEvento).toBe("ARMAZENAMENTO");
    expect(result.status).toBe("DISPONIVEL");
  });
});

describe("BloodBagService.reject", () => {
  it("marca a bolsa como REPROVADA e registra o motivo no evento", async () => {
    (prisma.bloodBag.update as jest.Mock).mockResolvedValue({ id: "bag-1", instituicaoAtualId: "inst-1", status: "REPROVADA" });

    await BloodBagService.reject("bag-1", "Sorologia reagente", user);

    expect(EventService.registerEvent).toHaveBeenCalledWith(
      expect.objectContaining({ tipoEvento: "REPROVACAO", data: { motivo: "Sorologia reagente" } })
    );
  });
});

describe("BloodBagService.use e discard", () => {
  it("use() marca a bolsa como UTILIZADA", async () => {
    (prisma.bloodBag.update as jest.Mock).mockResolvedValue({ id: "bag-1", instituicaoAtualId: "inst-1", status: "UTILIZADA" });
    const result = await BloodBagService.use("bag-1", user);
    expect(result.status).toBe("UTILIZADA");
    expect((EventService.registerEvent as jest.Mock).mock.calls[0][0].tipoEvento).toBe("UTILIZACAO");
  });

  it("discard() marca a bolsa como DESCARTADA com o motivo informado", async () => {
    (prisma.bloodBag.update as jest.Mock).mockResolvedValue({ id: "bag-1", instituicaoAtualId: "inst-1", status: "DESCARTADA" });
    await BloodBagService.discard("bag-1", "Fora da validade", user);
    expect((EventService.registerEvent as jest.Mock).mock.calls[0][0].data).toEqual({ motivo: "Fora da validade" });
  });
});

describe("BloodBagService.list", () => {
  it("mapeia o filtro instituicaoId para o campo real do model (instituicaoAtualId)", async () => {
    (prisma.bloodBag.findMany as jest.Mock).mockResolvedValue([]);

    await BloodBagService.list({ status: "DISPONIVEL", tipoSanguineo: "O_NEG", instituicaoId: "inst-1" });

    expect(prisma.bloodBag.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "DISPONIVEL", tipoSanguineo: "O_NEG", instituicaoAtualId: "inst-1" },
      })
    );
  });

  it("não inclui instituicaoId (nome de campo inexistente no model) na cláusula where", async () => {
    (prisma.bloodBag.findMany as jest.Mock).mockResolvedValue([]);

    await BloodBagService.list({ instituicaoId: "inst-1" });

    const whereArg = (prisma.bloodBag.findMany as jest.Mock).mock.calls[0][0].where;
    expect(whereArg).not.toHaveProperty("instituicaoId");
    expect(whereArg.instituicaoAtualId).toBe("inst-1");
  });
});

describe("BloodBagService.stockByType", () => {
  it("mapeia o resultado do groupBy para {tipoSanguineo, label, quantidade}", async () => {
    (prisma.bloodBag.groupBy as jest.Mock).mockResolvedValue([
      { tipoSanguineo: "O_NEG", _count: { _all: 5 } },
      { tipoSanguineo: "A_POS", _count: { _all: 3 } },
    ]);

    const result = await BloodBagService.stockByType();

    expect(result).toEqual([
      { tipoSanguineo: "O_NEG", label: "O-", quantidade: 5 },
      { tipoSanguineo: "A_POS", label: "A+", quantidade: 3 },
    ]);
  });
});
