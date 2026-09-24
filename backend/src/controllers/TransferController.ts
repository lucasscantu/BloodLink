import { Request, Response } from "express";
import { TransferStatus } from "@prisma/client";
import { TransferService } from "../services/TransferService";

export class TransferController {
  static async list(req: Request, res: Response) {
    const { status, institutionId } = req.query;
    const transfers = await TransferService.list({
      status: status as TransferStatus | undefined,
      institutionId: institutionId as string | undefined,
    });
    res.json(transfers);
  }

  static async receive(req: Request, res: Response) {
    const transfer = await TransferService.receive(req.params.id, req.user!);
    res.json(transfer);
  }

  static async reject(req: Request, res: Response) {
    const transfer = await TransferService.reject(req.params.id, req.user!);
    res.json(transfer);
  }
}
