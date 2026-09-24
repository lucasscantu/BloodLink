import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export class InstitutionController {
  static async list(_req: Request, res: Response) {
    const institutions = await prisma.institution.findMany({
      include: {
        _count: { select: { bloodBags: true, demands: true } },
      },
      orderBy: { name: "asc" },
    });
    res.json(institutions);
  }

  static async create(req: Request, res: Response) {
    const institution = await prisma.institution.create({ data: req.body });
    res.status(201).json(institution);
  }

  static async getById(req: Request, res: Response) {
    const institution = await prisma.institution.findUniqueOrThrow({ where: { id: req.params.id } });
    res.json(institution);
  }
}
