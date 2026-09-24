import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

export class AuthController {
  static async login(req: Request, res: Response) {
    const { email, password } = req.body as { email: string; password: string };

    const user = await prisma.user.findUnique({ where: { email }, include: { institution: true } });

    if (!user || !user.active) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    const secret = process.env.JWT_SECRET!;
    const payload = {
      id: user.id,
      role: user.role,
      institutionId: user.institutionId,
      name: user.name,
    };

    const token = jwt.sign(payload, secret, { expiresIn: "12h" });

    await prisma.auditLog.create({
      data: { usuarioId: user.id, acao: "LOGIN", detalhes: `Login realizado por ${user.email}` },
    });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        institution: user.institution,
      },
    });
  }

  static async me(req: Request, res: Response) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.user!.id },
      include: { institution: true },
    });
    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      institution: user.institution,
    });
  }
}
