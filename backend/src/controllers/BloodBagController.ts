import { Request, Response } from "express";
import { BloodBagStatus, BloodType } from "@prisma/client";
import { BloodBagService } from "../services/BloodBagService";
import { EventService } from "../services/EventService";

export class BloodBagController {
  static async list(req: Request, res: Response) {
    const { status, tipoSanguineo, instituicaoId } = req.query;
    const bags = await BloodBagService.list({
      status: status as BloodBagStatus | undefined,
      tipoSanguineo: tipoSanguineo as BloodType | undefined,
      instituicaoId: instituicaoId as string | undefined,
    });
    res.json(bags);
  }

  static async create(req: Request, res: Response) {
    const { tipoSanguineo, localizacaoAtual } = req.body;
    const institutionId = req.body.instituicaoId ?? req.user!.institutionId;

    if (!institutionId) {
      return res.status(400).json({ error: "Instituição responsável pela coleta é obrigatória." });
    }

    const bag = await BloodBagService.create(
      { tipoSanguineo, instituicaoId: institutionId, localizacaoAtual },
      req.user!
    );
    res.status(201).json(bag);
  }

  static async getById(req: Request, res: Response) {
    const bag = await BloodBagService.findByIdOrCodigo(req.params.id);
    if (!bag) return res.status(404).json({ error: "Bolsa não encontrada." });
    res.json(bag);
  }

  static async history(req: Request, res: Response) {
    const bag = await BloodBagService.findByIdOrCodigo(req.params.id);
    if (!bag) return res.status(404).json({ error: "Bolsa não encontrada." });
    const history = await BloodBagService.history(bag.id);
    res.json(history);
  }

  static async approve(req: Request, res: Response) {
    const bag = await BloodBagService.approve(req.params.id, req.user!);
    res.json(bag);
  }

  static async reject(req: Request, res: Response) {
    const bag = await BloodBagService.reject(req.params.id, req.body.motivo ?? "Não especificado", req.user!);
    res.json(bag);
  }

  static async use(req: Request, res: Response) {
    const bag = await BloodBagService.use(req.params.id, req.user!);
    res.json(bag);
  }

  static async discard(req: Request, res: Response) {
    const bag = await BloodBagService.discard(req.params.id, req.body.motivo ?? "Não especificado", req.user!);
    res.json(bag);
  }

  static async verifyIntegrity(req: Request, res: Response) {
    const events = await BloodBagService.history(req.params.id);
    const results = await Promise.all(events.map((e) => EventService.verifyIntegrity(e.id)));
    res.json(results);
  }
}
