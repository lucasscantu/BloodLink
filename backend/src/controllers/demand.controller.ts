import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { computeHash } from '../utils/hash.utils';
import { BlockchainService } from '../blockchain/BlockchainService';

export class DemandController {
  private blockchainService: BlockchainService;

  constructor() {
    this.blockchainService = new BlockchainService();
  }

  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const { page = 1, pageSize = 10, tipoSanguineo, status, institutionId, urgencia } = req.query;

      const where: any = {};

      if (tipoSanguineo) {
        where.tipoSanguineo = tipoSanguineo as string;
      }

      if (status) {
        where.status = status as string;
      }

      if (urgencia) {
        where.urgencia = urgencia as string;
      }

      // Filter by institution based on user role
      if (req.user?.role !== 'ADMIN') {
        where.institutionId = req.user?.institutionId;
      } else if (institutionId) {
        where.institutionId = institutionId as string;
      }

      const demands = await prisma.demand.findMany({
        where,
        include: {
          institution: true,
          transfers: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: Number(pageSize),
        skip: (Number(page) - 1) * Number(pageSize),
      });

      const total = await prisma.demand.count({ where });

      return res.json({
        success: true,
        data: {
          data: demands,
          total,
          page: Number(page),
          pageSize: Number(pageSize),
          totalPages: Math.ceil(total / Number(pageSize)),
        },
      });
    } catch (error: any) {
      console.error('Get all demands error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar demandas.',
        error: error.message,
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const demand = await prisma.demand.findUnique({
        where: { id },
        include: {
          institution: true,
          transfers: {
            include: {
              bolsa: true,
              deInstituicao: true,
              paraInstituicao: true,
            },
          },
        },
      });

      if (!demand) {
        return res.status(404).json({
          success: false,
          message: 'Demanda não encontrada.',
        });
      }

      return res.json({
        success: true,
        data: demand,
      });
    } catch (error: any) {
      console.error('Get demand by ID error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar demanda.',
        error: error.message,
      });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado.',
        });
      }

      const { tipoSanguineo, quantidade, urgencia, motivo, dataExpiracao } = req.body;

      // Create demand
      const demand = await prisma.demand.create({
        data: {
          institutionId: req.user.institutionId,
          tipoSanguineo,
          quantidade: Number(quantidade),
          urgencia,
          motivo,
          status: 'ABERTA',
          dataCriacao: new Date(),
          dataExpiracao: dataExpiracao ? new Date(dataExpiracao) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days default
        },
        include: {
          institution: true,
        },
      });

      // Register in blockchain
      try {
        await this.blockchainService.registerDemand(
          demand.id,
          demand.tipoSanguineo,
          demand.quantidade,
          demand.urgencia,
          req.user.institutionId
        );
      } catch (blockchainError) {
        console.error('Blockchain demand registration error:', blockchainError);
      }

      // Create event
      await prisma.event.create({
        data: {
          bagId: '', // No bag for demand creation
          tipoEvento: 'DEMANDA_CRIADA',
          descricao: `Demanda criada para ${quantidade} unidades de ${tipoSanguineo}`,
          instituicaoId: req.user.institutionId,
          usuarioId: req.user.userId,
          timestamp: new Date(),
          hash: computeHash({
            demandId: demand.id,
            eventType: 'DEMANDA_CRIADA',
            institutionId: req.user.institutionId,
            userId: req.user.userId,
            timestamp: new Date().toISOString(),
            data: JSON.stringify({ tipoSanguineo, quantidade, urgencia }),
          }),
        },
      });

      return res.json({
        success: true,
        message: 'Demanda criada com sucesso.',
        data: demand,
      });
    } catch (error: any) {
      console.error('Create demand error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar demanda.',
        error: error.message,
      });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if demand exists
      const existingDemand = await prisma.demand.findUnique({
        where: { id },
      });

      if (!existingDemand) {
        return res.status(404).json({
          success: false,
          message: 'Demanda não encontrada.',
        });
      }

      const demand = await prisma.demand.update({
        where: { id },
        data: updateData,
        include: {
          institution: true,
        },
      });

      return res.json({
        success: true,
        message: 'Demanda atualizada com sucesso.',
        data: demand,
      });
    } catch (error: any) {
      console.error('Update demand error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar demanda.',
        error: error.message,
      });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      // Check if demand exists
      const existingDemand = await prisma.demand.findUnique({
        where: { id },
        include: {
          transfers: true,
        },
      });

      if (!existingDemand) {
        return res.status(404).json({
          success: false,
          message: 'Demanda não encontrada.',
        });
      }

      // Check if demand has active transfers
      if (existingDemand.transfers.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível deletar uma demanda com transferências ativas.',
        });
      }

      await prisma.demand.delete({
        where: { id },
      });

      return res.json({
        success: true,
        message: 'Demanda deletada com sucesso.',
      });
    } catch (error: any) {
      console.error('Delete demand error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao deletar demanda.',
        error: error.message,
      });
    }
  }

  async cancel(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado.',
        });
      }

      const demand = await prisma.demand.update({
        where: { id },
        data: {
          status: 'CANCELADA',
          motivo: `${demand.motivo} - Cancelada: ${reason}`,
          dataAtendimento: new Date(),
        },
        include: {
          institution: true,
        },
      });

      // Create event
      await prisma.event.create({
        data: {
          bagId: '',
          tipoEvento: 'DEMANDA_CANCELADA',
          descricao: `Demanda cancelada: ${reason}`,
          instituicaoId: req.user.institutionId,
          usuarioId: req.user.userId,
          timestamp: new Date(),
          hash: computeHash({
            demandId: demand.id,
            eventType: 'DEMANDA_CANCELADA',
            institutionId: req.user.institutionId,
            userId: req.user.userId,
            timestamp: new Date().toISOString(),
            data: reason,
          }),
        },
      });

      return res.json({
        success: true,
        message: 'Demanda cancelada com sucesso.',
        data: demand,
      });
    } catch (error: any) {
      console.error('Cancel demand error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao cancelar demanda.',
        error: error.message,
      });
    }
  }

  async getByMyInstitution(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado.',
        });
      }

      const demands = await prisma.demand.findMany({
        where: {
          institutionId: req.user.institutionId,
        },
        include: {
          institution: true,
          transfers: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.json({
        success: true,
        data: demands,
      });
    } catch (error: any) {
      console.error('Get demands by my institution error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar demandas da instituição.',
        error: error.message,
      });
    }
  }

  async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      const where: any = {};

      // Filter by institution based on user role
      if (req.user?.role !== 'ADMIN') {
        where.institutionId = req.user?.institutionId;
      }

      const total = await prisma.demand.count({ where });

      const byStatus = await prisma.demand.groupBy({
        by: ['status'],
        _count: {
          _all: true,
        },
        where,
      });

      const byType = await prisma.demand.groupBy({
        by: ['tipoSanguineo'],
        _count: {
          _all: true,
        },
        where,
      });

      const urgent = await prisma.demand.count({
        where: {
          ...where,
          urgencia: 'ALTA',
        },
      });

      const open = await prisma.demand.count({
        where: {
          ...where,
          status: 'ABERTA',
        },
      });

      const statusStats: Record<string, number> = {};
      byStatus.forEach((group) => {
        statusStats[group.status] = group._count._all;
      });

      const typeStats: Record<string, number> = {};
      byType.forEach((group) => {
        typeStats[group.tipoSanguineo] = group._count._all;
      });

      return res.json({
        success: true,
        data: {
          total,
          byStatus: statusStats,
          byType: typeStats,
          urgent,
          open,
        },
      });
    } catch (error: any) {
      console.error('Get demand stats error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar estatísticas.',
        error: error.message,
      });
    }
  }
}
