import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class InstitutionController {
  async getAll(req: Request, res: Response) {
    try {
      const institutions = await prisma.institution.findMany({
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return res.json({
        success: true,
        data: institutions,
      });
    } catch (error: any) {
      console.error('Get all institutions error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar instituições.',
        error: error.message,
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const institution = await prisma.institution.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          bloodBags: {
            where: {
              instituicaoAtualId: id,
            },
          },
        },
      });

      if (!institution) {
        return res.status(404).json({
          success: false,
          message: 'Instituição não encontrada.',
        });
      }

      return res.json({
        success: true,
        data: institution,
      });
    } catch (error: any) {
      console.error('Get institution by ID error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar instituição.',
        error: error.message,
      });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      // Only ADMIN can create institutions
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Permissão negada.',
        });
      }

      const institutionData = req.body;

      // Check if institution with same name already exists
      const existingInstitution = await prisma.institution.findFirst({
        where: {
          name: institutionData.name,
        },
      });

      if (existingInstitution) {
        return res.status(400).json({
          success: false,
          message: 'Já existe uma instituição com este nome.',
        });
      }

      const institution = await prisma.institution.create({
        data: institutionData,
      });

      return res.json({
        success: true,
        message: 'Instituição criada com sucesso.',
        data: institution,
      });
    } catch (error: any) {
      console.error('Create institution error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar instituição.',
        error: error.message,
      });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      // Only ADMIN can update institutions
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Permissão negada.',
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      // Check if institution exists
      const existingInstitution = await prisma.institution.findUnique({
        where: { id },
      });

      if (!existingInstitution) {
        return res.status(404).json({
          success: false,
          message: 'Instituição não encontrada.',
        });
      }

      const institution = await prisma.institution.update({
        where: { id },
        data: updateData,
      });

      return res.json({
        success: true,
        message: 'Instituição atualizada com sucesso.',
        data: institution,
      });
    } catch (error: any) {
      console.error('Update institution error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar instituição.',
        error: error.message,
      });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      // Only ADMIN can delete institutions
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Permissão negada.',
        });
      }

      const { id } = req.params;

      // Check if institution exists
      const existingInstitution = await prisma.institution.findUnique({
        where: { id },
        include: {
          users: true,
          bloodBags: true,
        },
      });

      if (!existingInstitution) {
        return res.status(404).json({
          success: false,
          message: 'Instituição não encontrada.',
        });
      }

      // Check if institution has users or blood bags
      if (existingInstitution.users.length > 0 || existingInstitution.bloodBags.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível deletar uma instituição que possui usuários ou bolsas de sangue.',
        });
      }

      await prisma.institution.delete({
        where: { id },
      });

      return res.json({
        success: true,
        message: 'Instituição deletada com sucesso.',
      });
    } catch (error: any) {
      console.error('Delete institution error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao deletar instituição.',
        error: error.message,
      });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const total = await prisma.institution.count();
      const active = await prisma.institution.count({
        where: { isActive: true },
      });
      const inactive = await prisma.institution.count({
        where: { isActive: false },
      });

      const byType = await prisma.institution.groupBy({
        by: ['type'],
        _count: {
          _all: true,
        },
      });

      const typeStats: Record<string, number> = {};
      byType.forEach((group) => {
        typeStats[group.type] = group._count._all;
      });

      return res.json({
        success: true,
        data: {
          total,
          active,
          inactive,
          byType: typeStats,
        },
      });
    } catch (error: any) {
      console.error('Get institution stats error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar estatísticas.',
        error: error.message,
      });
    }
  }
}
