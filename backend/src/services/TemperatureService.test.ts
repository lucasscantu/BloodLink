jest.mock("../lib/prisma", () => ({
  prisma: {
    temperatureReading: { create: jest.fn(), findMany: jest.fn() },
    bloodBag: { update: jest.fn(), findUniqueOrThrow: jest.fn() },
  },
}));

jest.mock("./EventService", () => ({
  EventService: { registerEvent: jest.fn().mockResolvedValue({ id: "event-1" }) },
}));

import { prisma } from "../lib/prisma";
import { TemperatureService } from "./TemperatureService";
import { EventService } from "./EventService";

beforeEach(() => jest.clearAllMocks());

describe("TemperatureService.registerReading", () => {
  it("não gera alerta para leitura dentro da faixa segura (2°C-6°C)", async () => {
    (prisma.temperatureReading.create as jest.Mock).mockResolvedValue({ id: "reading-1", valor: 4.2, alerta: false });
    (prisma.bloodBag.update as jest.Mock).mockResolvedValue({});

    const reading = await TemperatureService.registerReading("bag-1", 4.2);

    expect(reading.alerta).toBe(false);
    expect(EventService.registerEvent).not.toHaveBeenCalled();
  });

  it("gera alerta e registra evento na blockchain para leitura acima da faixa segura", async () => {
    (prisma.temperatureReading.create as jest.Mock).mockResolvedValue({ id: "reading-2", valor: 9.4, alerta: true });
    (prisma.bloodBag.update as jest.Mock).mockResolvedValue({});
    (prisma.bloodBag.findUniqueOrThrow as jest.Mock).mockResolvedValue({ id: "bag-1", instituicaoAtualId: "inst-1" });

    await TemperatureService.registerReading("bag-1", 9.4);

    expect(prisma.temperatureReading.create).toHaveBeenCalledWith({ data: { bagId: "bag-1", valor: 9.4, alerta: true } });
    expect(EventService.registerEvent).toHaveBeenCalledWith(
      expect.objectContaining({ tipoEvento: "ALERTA_TEMPERATURA", bagId: "bag-1" })
    );
  });

  it("gera alerta para leitura abaixo da faixa segura", async () => {
    (prisma.temperatureReading.create as jest.Mock).mockResolvedValue({ id: "reading-3", valor: 0.5, alerta: true });
    (prisma.bloodBag.update as jest.Mock).mockResolvedValue({});
    (prisma.bloodBag.findUniqueOrThrow as jest.Mock).mockResolvedValue({ id: "bag-1", instituicaoAtualId: "inst-1" });

    const reading = await TemperatureService.registerReading("bag-1", 0.5);
    expect(reading.alerta).toBe(true);
  });
});

describe("TemperatureService.simulateTemperature", () => {
  it("gera valores plausíveis em torno do baseline na maior parte das vezes", () => {
    const originalRandom = Math.random;
    Math.random = () => 0.5; // sem variação, sem "falha de refrigeração"

    const valor = TemperatureService.simulateTemperature(4.0);
    expect(valor).toBeCloseTo(4.0, 1);

    Math.random = originalRandom;
  });

  it("arredonda o resultado para uma casa decimal", () => {
    const valor = TemperatureService.simulateTemperature();
    expect(valor).toBe(Math.round(valor * 10) / 10);
  });
});
