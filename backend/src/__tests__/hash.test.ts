import { computeEventHash, hashToBytes32 } from "../utils/hash";

describe("computeEventHash", () => {
  it("gera o mesmo hash para o mesmo input (determinístico)", () => {
    const input = {
      bagId: "bag-1",
      eventType: "COLETA",
      institutionId: "inst-1",
      userId: "user-1",
      timestamp: "2026-09-16T10:00:00.000Z",
      data: { tipoSanguineo: "O_NEG" },
    };

    expect(computeEventHash(input)).toBe(computeEventHash(input));
  });

  it("gera hashes diferentes para inputs diferentes", () => {
    const base = {
      bagId: "bag-1",
      eventType: "COLETA",
      institutionId: "inst-1",
      userId: "user-1",
      timestamp: "2026-09-16T10:00:00.000Z",
      data: {},
    };

    const h1 = computeEventHash(base);
    const h2 = computeEventHash({ ...base, eventType: "APROVACAO" });

    expect(h1).not.toBe(h2);
  });

  it("produz um hash sha256 hexadecimal de 64 caracteres", () => {
    const hash = computeEventHash({
      bagId: "bag-1",
      eventType: "COLETA",
      institutionId: "inst-1",
      userId: "user-1",
      timestamp: "2026-09-16T10:00:00.000Z",
      data: {},
    });

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("hashToBytes32", () => {
  it("converte um hash hex em formato bytes32 prefixado com 0x", () => {
    const hash = computeEventHash({
      bagId: "bag-1",
      eventType: "COLETA",
      institutionId: "inst-1",
      userId: "user-1",
      timestamp: "2026-09-16T10:00:00.000Z",
      data: {},
    });

    const bytes32 = hashToBytes32(hash);
    expect(bytes32.startsWith("0x")).toBe(true);
    expect(bytes32.length).toBe(66); // 0x + 64 chars
  });
});
