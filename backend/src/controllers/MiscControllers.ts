import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { DashboardService } from "../services/DashboardService";
import { TemperatureService } from "../services/TemperatureService";
import { EventService } from "../services/EventService";
import { getBlockchainService } from "../blockchain";

export class DashboardController {
  static async summary(_req: Request, res: Response) {
    res.json(await DashboardService.getSummary());
  }
}

export class AuditController {
  static async list(_req: Request, res: Response) {
    const events = await prisma.bloodBagEvent.findMany({
      include: { instituicao: true, usuario: true, blockchainTx: true, bloodBag: true },
      orderBy: { timestamp: "desc" },
      take: 200,
    });
    res.json(events);
  }

  static async logs(_req: Request, res: Response) {
    const logs = await prisma.auditLog.findMany({
      include: { usuario: true },
      orderBy: { timestamp: "desc" },
      take: 200,
    });
    res.json(logs);
  }
}

export class BlockchainController {
  static async transactions(_req: Request, res: Response) {
    const txs = await prisma.blockchainTransaction.findMany({
      include: { events: { include: { bloodBag: true, instituicao: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.json(txs);
  }

  static async verify(req: Request, res: Response) {
    // req.params.id é o id do BloodBagEvent
    const result = await EventService.verifyIntegrity(req.params.id);
    res.json(result);
  }

  static async networkInfo(_req: Request, res: Response) {
    res.json(getBlockchainService().getNetworkInfo());
  }
}

export class TemperatureController {
  static async history(req: Request, res: Response) {
    res.json(await TemperatureService.history(req.params.bagId));
  }

  static async register(req: Request, res: Response) {
    const { valor } = req.body;
    res.status(201).json(await TemperatureService.registerReading(req.params.bagId, valor));
  }

  static async alerts(_req: Request, res: Response) {
    res.json(await TemperatureService.listAlerts());
  }
}
