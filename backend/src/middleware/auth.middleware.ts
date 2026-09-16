import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../prisma';
import { UserRole } from '../types';

interface JwtPayload {
  userId: string;
  role: UserRole;
  institutionId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticação não fornecido',
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticação inválido',
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      error: 'Token de autenticação expirado ou inválido',
    });
  }
}

export function authorize(roles: UserRole[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Permissão negada: papel insuficiente',
      });
    }

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Usuário inativo ou não encontrado',
      });
    }

    next();
  };
}

export function authorizeInstitution(institutionId?: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
      });
    }

    // If institutionId is provided in route params, check if user belongs to it
    const targetInstitutionId = institutionId || req.params.institutionId;
    
    if (targetInstitutionId && req.user.institutionId !== targetInstitutionId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Permissão negada: você não pertence a esta instituição',
      });
    }

    next();
  };
}
