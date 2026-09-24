const registerEventMock = jest.fn();
const eventCountMock = jest.fn();

jest.mock("fs", () => ({
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue(
    JSON.stringify({ address: "0xContractAddress", abi: [], rpcUrl: "http://127.0.0.1:8545" })
  ),
}));

jest.mock("ethers", () => ({
  ethers: {
    JsonRpcProvider: jest.fn().mockImplementation(() => ({})),
    Wallet: jest.fn().mockImplementation(() => ({})),
    Contract: jest.fn().mockImplementation(() => ({
      registerEvent: registerEventMock,
      eventCount: eventCountMock,
    })),
  },
}));

process.env.BLOCKCHAIN_PRIVATE_KEY = "0xtest-private-key";
process.env.BLOCKCHAIN_RPC_URL = "http://127.0.0.1:8545";

import { EvmBlockchainService } from "./EvmBlockchainService";

/** Cria uma promise que só resolve quando `resolveIt()` é chamado externamente. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("EvmBlockchainService.registerEvent — serialização de transações concorrentes", () => {
  it("não envia a segunda transação antes da primeira terminar (evita conflito de nonce)", async () => {
    const service = new EvmBlockchainService();
    const callOrder: string[] = [];

    // Transação A: fica "pendurada" até chamarmos resolveWaitA().
    const waitA = deferred<{ hash: string; blockNumber: number }>();
    // Transação B: resolveria IMEDIATAMENTE se pudesse ser enviada em paralelo.
    const waitB = deferred<{ hash: string; blockNumber: number }>();

    registerEventMock.mockImplementation((bagId: string) => {
      callOrder.push(`enviou:${bagId}`);
      if (bagId === "bag-A") return Promise.resolve({ wait: () => waitA.promise });
      return Promise.resolve({ wait: () => waitB.promise });
    });
    eventCountMock.mockResolvedValue(1n);

    const inputBase = { eventType: "COLETA", institutionId: "inst-1", userId: "user-1", dataHash: "a".repeat(64) };

    // Dispara as duas "requisições" concorrentemente, sem aguardar a primeira.
    const resultA = service.registerEvent({ ...inputBase, bagId: "bag-A" });
    const resultB = service.registerEvent({ ...inputBase, bagId: "bag-B" });

    // Dá um tempo para qualquer código síncrono/microtask rodar.
    await Promise.resolve();
    await Promise.resolve();

    // Neste ponto, a transação B NÃO deveria ter sido enviada ainda,
    // porque a fila está esperando a transação A terminar (tx.wait()).
    expect(callOrder).toEqual(["enviou:bag-A"]);

    // Libera a transação A. Só then a fila deve avançar e enviar B.
    waitA.resolve({ hash: "0xA", blockNumber: 1 });
    await resultA;

    waitB.resolve({ hash: "0xB", blockNumber: 2 });
    await resultB;

    expect(callOrder).toEqual(["enviou:bag-A", "enviou:bag-B"]);
  });

  it("uma transação com erro não trava as próximas da fila", async () => {
    const service = new EvmBlockchainService();

    registerEventMock
      .mockRejectedValueOnce(new Error("transação revertida"))
      .mockResolvedValueOnce({ wait: () => Promise.resolve({ hash: "0xOK", blockNumber: 2 }) });
    eventCountMock.mockResolvedValue(1n);

    const inputBase = { eventType: "COLETA", institutionId: "inst-1", userId: "user-1", dataHash: "a".repeat(64) };

    await expect(service.registerEvent({ ...inputBase, bagId: "bag-fail" })).rejects.toThrow("transação revertida");

    // A próxima escrita da fila deve funcionar normalmente, mesmo após a falha anterior.
    const result = await service.registerEvent({ ...inputBase, bagId: "bag-ok" });
    expect(result.txHash).toBe("0xOK");
  });
});
