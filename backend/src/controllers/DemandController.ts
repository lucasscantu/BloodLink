import { Request, Response } from "express";
import { DemandStatus } from "@prisma/client";
import { DemandService } from "../services/DemandService";
import { TransferService } from "../services/TransferService";

export class DemandController {
  static async list(req: Request, res: Response) {
    const { status, hospitalId } = req.query;
    const demands = await DemandService.list({
      status: status as DemandStatus | undefined,
      hospitalId: hospitalId as string | undefined,
    });
    res.json(demands);
  }

  static async create(req: Request, res: Response) {
    const hospitalId = req.body.hospitalId ?? req.user!.institutionId;
    if (!hospitalId) return res.status(400).json({ error: "Hospital solicitante é obrigatório." });

    const demand = await DemandService.create({ ...req.body, hospitalId });
    res.status(201).json(demand);
  }

  static async getById(req: Request, res: Response) {
    const demand = await DemandService.findById(req.params.id);
    const suppliers = await DemandService.findMatchingSuppliers(req.params.id);
    res.json({ ...demand, fornecedoresCompativeis: suppliers });
  }

  static async offer(req: Request, res: Response) {
    const { bagId, sourceInstitutionId } = req.body;
    const demand = await DemandService.findById(req.params.id);

    const transfer = await TransferService.offer(
      { demandId: demand.id, bagId, destinationInstitutionId: demand.hospitalId },
      req.user!
    );
    res.status(201).json(transfer);
    void sourceInstitutionId; // mantido para compatibilidade futura de validação cruzada
  }

  static async accept(req: Request, res: Response) {
    const { transferId } = req.body;
    const transfer = await TransferService.accept(transferId, req.user!);
    res.json(transfer);
  }
}
