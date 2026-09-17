import { Request, Response } from 'express';
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
import { prisma } from '../prisma';
import { config } from '../config';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { createUserSchema, loginSchema } from '../schemas/user.schema';

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          institution: true,
        },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas.',
        });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas.',
        });
      }

      // Generate token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          institutionId: user.institutionId,
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // Return user data without password
      const { password: _, ...userData } = user;

      return res.json({
        success: true,
        message: 'Login realizado com sucesso.',
        data: {
          user: userData,
          token,
        },
      });
    } catch (error: any) {
      console.error('Login error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao fazer login.',
        error: error.message,
      });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const { name, email, password, role, institutionId } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Usuário já cadastrado com este email.',
        });
      }

      // Check if institution exists
      const institution = await prisma.institution.findUnique({
        where: { id: institutionId },
      });

      if (!institution) {
        return res.status(400).json({
          success: false,
          message: 'Instituição não encontrada.',
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role as any,
          institutionId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          institutionId: true,
          createdAt: true,
          updatedAt: true,
          institution: true,
        },
      });

      return res.json({
        success: true,
        message: 'Usuário cadastrado com sucesso.',
        data: user,
      });
    } catch (error: any) {
      console.error('Registration error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao cadastrar usuário.',
        error: error.message,
      });
    }
  }

  async getCurrentUser(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado.',
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: {
          institution: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          institutionId: true,
          createdAt: true,
          updatedAt: true,
          institution: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado.',
        });
      }

      return res.json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      console.error('Get current user error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar usuário.',
        error: error.message,
      });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      // In JWT, logout is handled client-side by removing the token
      return res.json({
        success: true,
        message: 'Logout realizado com sucesso.',
      });
    } catch (error: any) {
      console.error('Logout error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao fazer logout.',
        error: error.message,
      });
    }
  }
}
