import { prisma } from "../lib/prisma";
import { EventService } from "./EventService";

const FAIXA_MIN = 2; // °C
const FAIXA_MAX = 6; // °C

export class TemperatureService {
  static async registerReading(bagId: string, valor: number) {
    const alerta = valor < FAIXA_MIN || valor > FAIXA_MAX;

    const reading = await prisma.temperatureReading.create({
      data: { bagId, valor, alerta },
    });

    await prisma.bloodBag.update({
      where: { id: bagId },
      data: { temperaturaAtual: valor },
    });

    if (alerta) {
      const bag = await prisma.bloodBag.findUniqueOrThrow({ where: { id: bagId } });
      await EventService.registerEvent({
        bagId,
        tipoEvento: "ALERTA_TEMPERATURA",
        descricao: `Temperatura fora da faixa segura: ${valor}°C (faixa: ${FAIXA_MIN}-${FAIXA_MAX}°C)`,
        instituicaoId: bag.instituicaoAtualId,
        data: { valor },
      });
    }

    return reading;
  }

  static async history(bagId: string) {
    return prisma.temperatureReading.findMany({
      where: { bagId },
      orderBy: { timestamp: "asc" },
    });
  }

  static async listAlerts() {
    return prisma.temperatureReading.findMany({
      where: { alerta: true },
      include: { bloodBag: { include: { instituicaoAtual: true } } },
      orderBy: { timestamp: "desc" },
      take: 50,
    });
  }

  /**
   * Simula uma leitura de sensor de temperatura para uma bolsa.
   * Usada pelo seed e por um endpoint de demonstração, já que o protótipo
   * não possui hardware físico de sensores.
   */
  static simulateTemperature(baseline = 4.0): number {
    const variacao = (Math.random() - 0.5) * 1.2; // pequena variação normal
    const chanceDeAlerta = Math.random() < 0.05; // 5% de chance de simular uma falha de refrigeração
    const valor = chanceDeAlerta ? baseline + 4 + Math.random() * 3 : baseline + variacao;
    return Math.round(valor * 10) / 10;
  }
}
