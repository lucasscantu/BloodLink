import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";

export class UserController {
  static async list(_req: Request, res: Response) {
    const users = await prisma.user.findMany({
      include: { institution: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        active: u.active,
        institution: u.institution,
        createdAt: u.createdAt,
      }))
    );
  }

  static async create(req: Request, res: Response) {
    const { name, email, password, role, institutionId } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, passwordHash, role, institutionId: institutionId || undefined },
    });

    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  }
}
