import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class UserController {
  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      // Only ADMIN can get all users
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Permissão negada.',
        });
      }

      const users = await prisma.user.findMany({
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

      return res.json({
        success: true,
        data: users,
      });
    } catch (error: any) {
      console.error('Get all users error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar usuários.',
        error: error.message,
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
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
      console.error('Get user by ID error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar usuário.',
        error: error.message,
      });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      // Only ADMIN can create users
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Permissão negada.',
        });
      }

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
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);

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
        },
      });

      return res.json({
        success: true,
        message: 'Usuário criado com sucesso.',
        data: user,
      });
    } catch (error: any) {
      console.error('Create user error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar usuário.',
        error: error.message,
      });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado.',
        });
      }

      // If updating password, hash it
      if (updateData.password) {
        const bcrypt = require('bcrypt');
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          institutionId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.json({
        success: true,
        message: 'Usuário atualizado com sucesso.',
        data: user,
      });
    } catch (error: any) {
      console.error('Update user error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar usuário.',
        error: error.message,
      });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      // Only ADMIN can delete users
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Permissão negada.',
        });
      }

      const { id } = req.params;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado.',
        });
      }

      await prisma.user.delete({
        where: { id },
      });

      return res.json({
        success: true,
        message: 'Usuário deletado com sucesso.',
      });
    } catch (error: any) {
      console.error('Delete user error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao deletar usuário.',
        error: error.message,
      });
    }
  }

  async getByInstitution(req: Request, res: Response) {
    try {
      const { institutionId } = req.params;

      const users = await prisma.user.findMany({
        where: { institutionId },
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

      return res.json({
        success: true,
        data: users,
      });
    } catch (error: any) {
      console.error('Get users by institution error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar usuários.',
        error: error.message,
      });
    }
  }
}
