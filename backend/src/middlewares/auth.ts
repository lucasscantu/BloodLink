import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedUser {
  id: string;
  role: "ADMIN" | "HEMOCENTRO" | "HOSPITAL" | "AUDITOR";
  institutionId: string | null;
  name: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/** Exige um JWT válido no header Authorization: Bearer <token>. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token de autenticação ausente." });
  }

  const token = header.slice("Bearer ".length);

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET não configurado");

    const payload = jwt.verify(token, secret) as AuthenticatedUser;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
}

/** Restringe o endpoint a determinados papéis (RBAC). */
export function requireRole(...roles: AuthenticatedUser["role"][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Não autenticado." });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Acesso negado para este perfil de usuário." });
    }
    next();
  };
}
