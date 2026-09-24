import { describe, expect, it } from "vitest";
import { extractBagCodeFromScan } from "./qrcode";

describe("extractBagCodeFromScan", () => {
  it("extrai o código de uma URL completa (http/https)", () => {
    expect(extractBagCodeFromScan("https://app.bloodlink.com/blood-bags/O--2026-00001")).toBe("O--2026-00001");
    expect(extractBagCodeFromScan("http://localhost:5173/blood-bags/AB+-2026-00042")).toBe("AB+-2026-00042");
  });

  it("extrai o código de uma URL com barra final ou querystring", () => {
    expect(extractBagCodeFromScan("https://app.bloodlink.com/blood-bags/O--2026-00001/")).toBe("O--2026-00001");
    expect(extractBagCodeFromScan("https://app.bloodlink.com/blood-bags/O--2026-00001?utm=qr")).toBe("O--2026-00001");
  });

  it("extrai o código de um caminho relativo (sem host)", () => {
    expect(extractBagCodeFromScan("/blood-bags/O--2026-00001")).toBe("O--2026-00001");
  });

  it("retorna o próprio texto quando não há padrão de URL (código puro)", () => {
    expect(extractBagCodeFromScan("O--2026-00001")).toBe("O--2026-00001");
  });

  it("remove espaços em branco nas bordas", () => {
    expect(extractBagCodeFromScan("  O--2026-00001  ")).toBe("O--2026-00001");
  });

  it("decodifica caracteres codificados na URL (ex.: + vira %2B)", () => {
    expect(extractBagCodeFromScan("https://app.bloodlink.com/blood-bags/AB%2B-2026-00042")).toBe("AB+-2026-00042");
  });
});
