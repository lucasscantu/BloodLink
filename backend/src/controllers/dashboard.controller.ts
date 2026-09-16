import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class DashboardController {
  async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      const where: any = {};

      // Filter by user's institution
      if (req.user?.role !== 'ADMIN') {
        where.instituicaoAtualId = req.user?.institutionId;
      }

      // Blood bags stats
      const totalBloodBags = await prisma.bloodBag.count({ where });
      const availableBloodBags = await prisma.bloodBag.count({
        where: {
          ...where,
          status: 'DISPONIVEL',
        },
      });
      const inTransitBloodBags = await prisma.bloodBag.count({
        where: {
          ...where,
          status: 'EM_TRANSPORTE',
        },
      });
      const usedBloodBags = await prisma.bloodBag.count({
        where: {
          ...where,
          status: 'UTILIZADA',
        },
      });
      const expiredBloodBags = await prisma.bloodBag.count({
        where: {
          ...where,
          dataValidade: {
            lt: new Date(),
          },
        },
      });

      // Blood bags by type
      const bloodBagsByType = await prisma.bloodBag.groupBy({
        by: ['tipoSanguineo'],
        _count: {
          _all: true,
        },
        where,
      });

      const typeStats: Record<string, number> = {};
      bloodBagsByType.forEach((group) => {
        typeStats[group.tipoSanguineo] = group._count._all;
      });

      // Demands stats
      const demandWhere: any = {};
      if (req.user?.role !== 'ADMIN') {
        demandWhere.institutionId = req.user?.institutionId;
      }

      const openDemands = await prisma.demand.count({
        where: {
          ...demandWhere,
          status: 'ABERTA',
        },
      });
      const urgentDemands = await prisma.demand.count({
        where: {
          ...demandWhere,
          urgencia: 'ALTA',
        },
      });

      // Transfers stats
      const transferWhere: any = {
        OR: [
          { deInstituicaoId: req.user?.institutionId },
          { paraInstituicaoId: req.user?.institutionId },
        ],
      };

      const pendingTransfers = await prisma.transfer.count({
        where: {
          ...(req.user?.role !== 'ADMIN' ? transferWhere : {}),
          status: 'PENDENTE',
        },
      });

      // Temperature alerts
      const temperatureAlerts = await prisma.temperatureReading.count({
        where: {
          isAlert: true,
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      return res.json({
        success: true,
        data: {
          totalBloodBags,
          availableBloodBags,
          inTransitBloodBags,
          usedBloodBags,
          expiredBloodBags,
          openDemands,
          urgentDemands,
          pendingTransfers,
          temperatureAlerts,
          bloodBagsByType: typeStats,
        },
      });
    } catch (error: any) {
      console.error('Get dashboard stats error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar estatísticas do dashboard.',
        error: error.message,
      });
    }
  }

  async getNetworkMap(req: AuthenticatedRequest, res: Response) {
    try {
      const institutions = await prisma.institution.findMany({
        include: {
          bloodBags: {
            where: {
              status: 'DISPONIVEL',
            },
          },
          demands: {
            where: {
              status: 'ABERTA',
            },
          },
          transfers: {
            where: {
              status: 'EM_TRANSPORTE',
            },
          },
          users: true,
        },
      });

      const nodes = institutions.map((institution) => ({
        id: institution.id,
        name: institution.name,
        type: institution.type,
        latitude: institution.latitude,
        longitude: institution.longitude,
        bloodBags: institution.bloodBags.length,
        demands: institution.demands.length,
        transfers: institution.transfers.length,
        users: institution.users.length,
        isActive: institution.isActive,
      }));

      // Get connections (transfers in transit)
      const transfers = await prisma.transfer.findMany({
        where: {
          status: 'EM_TRANSPORTE',
        },
        include: {
          deInstituicao: true,
          paraInstituicao: true,
          bolsa: true,
        },
      });

      const connections = transfers.map((transfer) => ({
        source: transfer.deInstituicaoId,
        target: transfer.paraInstituicaoId,
        transferId: transfer.id,
        bagId: transfer.bolsaId,
        bagCode: transfer.bolsa.codigo,
        bloodType: transfer.bolsa.tipoSanguineo,
      }));

      return res.json({
        success: true,
        data: {
          nodes,
          connections,
        },
      });
    } catch (error: any) {
      console.error('Get network map error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar mapa da rede.',
        error: error.message,
      });
    }
  }

  async getRecentActivity(req: AuthenticatedRequest, res: Response) {
    try {
      const { limit = 10 } = req.query;

      const where: any = {};
      if (req.user?.role !== 'ADMIN') {
        where.instituicaoId = req.user?.institutionId;
      }

      const events = await prisma.event.findMany({
        where,
        include: {
          bloodBag: true,
          instituicao: true,
          usuario: true,
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: Number(limit),
      });

      return res.json({
        success: true,
        data: events,
      });
    } catch (error: any) {
      console.error('Get recent activity error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar atividade recente.',
        error: error.message,
      });
    }
  }
}
