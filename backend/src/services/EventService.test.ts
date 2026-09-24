const registerEventMock = jest.fn();
const verifyEventMock = jest.fn();

jest.mock("../lib/prisma", () => ({
  prisma: {
    blockchainTransaction: { create: jest.fn() },
    bloodBagEvent: { create: jest.fn(), findUniqueOrThrow: jest.fn() },
  },
}));

jest.mock("../blockchain", () => ({
  getBlockchainService: () => ({
    registerEvent: registerEventMock,
    verifyEvent: verifyEventMock,
    getNetworkInfo: () => ({ network: "EVM local (Hardhat)", implementation: "EvmBlockchainService" }),
  }),
}));

import { prisma } from "../lib/prisma";
import { EventService } from "./EventService";

beforeEach(() => jest.clearAllMocks());

describe("EventService.registerEvent", () => {
  it("calcula o hash, envia a transação à blockchain e persiste o evento com o txHash e o eventIndex reais", async () => {
    registerEventMock.mockResolvedValue({ txHash: "0xabc123", blockNumber: 7, eventIndex: 3 });
    (prisma.blockchainTransaction.create as jest.Mock).mockResolvedValue({ id: "tx-1" });
    (prisma.bloodBagEvent.create as jest.Mock).mockResolvedValue({ id: "event-1", hash: "hash-fake" });

    const event = await EventService.registerEvent({
      bagId: "bag-1",
      tipoEvento: "COLETA",
      descricao: "Coleta registrada",
      instituicaoId: "inst-1",
      usuarioId: "user-1",
      data: { tipoSanguineo: "O_NEG" },
    });

    expect(registerEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ bagId: "bag-1", eventType: "COLETA", institutionId: "inst-1", userId: "user-1" })
    );
    expect(prisma.blockchainTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ txHash: "0xabc123", blockNumber: 7 }) })
    );
    // O eventIndex retornado pela blockchain precisa ser persistido — é ele que
    // permite localizar o evento exato na chain depois, sem depender de
    // reordenar eventos por timestamp (frágil em caso de empate).
    expect(prisma.bloodBagEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ bagId: "bag-1", blockchainTransactionId: "tx-1", eventIndex: 3 }),
      })
    );
    expect(event.id).toBe("event-1");
  });

  it("usa 'sistema' como usuário quando nenhum usuarioId é informado (ex.: leitura automática de sensor)", async () => {
    registerEventMock.mockResolvedValue({ txHash: "0xdef", blockNumber: 1, eventIndex: 0 });
    (prisma.blockchainTransaction.create as jest.Mock).mockResolvedValue({ id: "tx-2" });
    (prisma.bloodBagEvent.create as jest.Mock).mockResolvedValue({ id: "event-2" });

    await EventService.registerEvent({
      bagId: "bag-1",
      tipoEvento: "ALERTA_TEMPERATURA",
      descricao: "Temperatura fora da faixa",
      instituicaoId: "inst-1",
    });

    expect(registerEventMock).toHaveBeenCalledWith(expect.objectContaining({ userId: "sistema" }));
  });
});

describe("EventService.verifyIntegrity", () => {
  it("retorna integro=true quando o hash bate com o registro on-chain, usando o eventIndex gravado no evento", async () => {
    (prisma.bloodBagEvent.findUniqueOrThrow as jest.Mock).mockResolvedValue({
      id: "event-1",
      bagId: "bag-1",
      hash: "hash-correto",
      eventIndex: 0,
      blockchainTx: { txHash: "0xabc" },
    });
    verifyEventMock.mockResolvedValue(true);

    const result = await EventService.verifyIntegrity("event-1");

    expect(verifyEventMock).toHaveBeenCalledWith("bag-1", 0, "hash-correto");
    expect(result.integro).toBe(true);
    expect(result.txHash).toBe("0xabc");
  });

  it("retorna integro=false quando o hash diverge do registro on-chain", async () => {
    (prisma.bloodBagEvent.findUniqueOrThrow as jest.Mock).mockResolvedValue({
      id: "event-1",
      bagId: "bag-1",
      hash: "hash-adulterado",
      eventIndex: 0,
      blockchainTx: null,
    });
    verifyEventMock.mockResolvedValue(false);

    const result = await EventService.verifyIntegrity("event-1");

    expect(result.integro).toBe(false);
    expect(result.txHash).toBeNull();
  });

  it("usa o eventIndex real do evento (não reordena por timestamp), mesmo para índices altos/fora de ordem", async () => {
    (prisma.bloodBagEvent.findUniqueOrThrow as jest.Mock).mockResolvedValue({
      id: "event-3",
      bagId: "bag-1",
      hash: "hash-3",
      eventIndex: 7,
      blockchainTx: null,
    });
    verifyEventMock.mockResolvedValue(true);

    await EventService.verifyIntegrity("event-3");

    expect(verifyEventMock).toHaveBeenCalledWith("bag-1", 7, "hash-3");
  });
});
