import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { generateQRCode } from '../utils/qrcode.utils';
import { computeHash } from '../utils/hash.utils';
import { BlockchainService } from '../blockchain/BlockchainService';

export class BloodBagController {
  private blockchainService: BlockchainService;

  constructor() {
    this.blockchainService = new BlockchainService();
  }

  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const { page = 1, pageSize = 10, tipoSanguineo, status, instituicaoId } = req.query;

      const where: any = {};

      if (tipoSanguineo) {
        where.tipoSanguineo = tipoSanguineo as string;
      }

      if (status) {
        where.status = status as string;
      }

      // Filter by institution based on user role
      if (req.user?.role !== 'ADMIN') {
        where.instituicaoAtualId = req.user?.institutionId;
      } else if (instituicaoId) {
        where.instituicaoAtualId = instituicaoId as string;
      }

      const bloodBags = await prisma.bloodBag.findMany({
        where,
        include: {
          instituicaoAtual: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: Number(pageSize),
        skip: (Number(page) - 1) * Number(pageSize),
      });

      const total = await prisma.bloodBag.count({ where });

      return res.json({
        success: true,
        data: {
          data: bloodBags,
          total,
          page: Number(page),
          pageSize: Number(pageSize),
          totalPages: Math.ceil(total / Number(pageSize)),
        },
      });
    } catch (error: any) {
      console.error('Get all blood bags error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar bolsas de sangue.',
        error: error.message,
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const bloodBag = await prisma.bloodBag.findUnique({
        where: { id },
        include: {
          instituicaoAtual: true,
          events: {
            orderBy: {
              timestamp: 'desc',
            },
          },
        },
      });

      if (!bloodBag) {
        return res.status(404).json({
          success: false,
          message: 'Bolsa de sangue não encontrada.',
        });
      }

      return res.json({
        success: true,
        data: bloodBag,
      });
    } catch (error: any) {
      console.error('Get blood bag by ID error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar bolsa de sangue.',
        error: error.message,
      });
    }
  }

  async getByCode(req: Request, res: Response) {
    try {
      const { codigo } = req.params;

      const bloodBag = await prisma.bloodBag.findUnique({
        where: { codigo },
        include: {
          instituicaoAtual: true,
          events: {
            orderBy: {
              timestamp: 'desc',
            },
          },
        },
      });

      if (!bloodBag) {
        return res.status(404).json({
          success: false,
          message: 'Bolsa de sangue não encontrada.',
        });
      }

      return res.json({
        success: true,
        data: bloodBag,
      });
    } catch (error: any) {
      console.error('Get blood bag by code error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar bolsa de sangue.',
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

      const { tipoSanguineo, fatorRh, volume, doadorId, observations } = req.body;

      // Generate unique code
      const year = new Date().getFullYear();
      const count = await prisma.bloodBag.count({
        where: {
          createdAt: {
            gte: new Date(year, 0, 1),
          },
        },
      });

      const codigo = `${tipoSanguineo}-${year}-${String(count + 1).padStart(5, '0')}`;

      // Generate QR Code
      const qrCode = await generateQRCode(codigo);

      // Create blood bag
      const bloodBag = await prisma.bloodBag.create({
        data: {
          codigo,
          tipoSanguineo,
          fatorRh,
          volume: Number(volume) || 450,
          dataColeta: new Date(),
          dataValidade: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000), // 42 days validity
          status: 'COLETADA',
          instituicaoAtualId: req.user.institutionId,
          localizacaoAtual: 'Coleta',
          temperaturaAtual: 4.0,
          qrCode,
          doadorId,
          observations,
        },
        include: {
          instituicaoAtual: true,
        },
      });

      // Register event in blockchain
      try {
        await this.blockchainService.registerBloodBag(
          bloodBag.id,
          bloodBag.codigo,
          bloodBag.tipoSanguineo,
          bloodBag.fatorRh,
          req.user.institutionId
        );
      } catch (blockchainError) {
        console.error('Blockchain registration error:', blockchainError);
      }

      // Create initial event
      await prisma.event.create({
        data: {
          bagId: bloodBag.id,
          tipoEvento: 'COLETA',
          descricao: 'Bolsa de sangue coletada',
          instituicaoId: req.user.institutionId,
          usuarioId: req.user.userId,
          timestamp: new Date(),
          hash: computeHash({
            bagId: bloodBag.id,
            eventType: 'COLETA',
            institutionId: req.user.institutionId,
            userId: req.user.userId,
            timestamp: new Date().toISOString(),
          }),
        },
      });

      return res.json({
        success: true,
        message: 'Bolsa de sangue criada com sucesso.',
        data: bloodBag,
      });
    } catch (error: any) {
      console.error('Create blood bag error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar bolsa de sangue.',
        error: error.message,
      });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const bloodBag = await prisma.bloodBag.update({
        where: { id },
        data: updateData,
        include: {
          instituicaoAtual: true,
        },
      });

      return res.json({
        success: true,
        message: 'Bolsa de sangue atualizada com sucesso.',
        data: bloodBag,
      });
    } catch (error: any) {
      console.error('Update blood bag error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar bolsa de sangue.',
        error: error.message,
      });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.bloodBag.delete({
        where: { id },
      });

      return res.json({
        success: true,
        message: 'Bolsa de sangue deletada com sucesso.',
      });
    } catch (error: any) {
      console.error('Delete blood bag error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao deletar bolsa de sangue.',
        error: error.message,
      });
    }
  }

  async collect(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { temperaturaAtual, localizacaoAtual } = req.body;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado.',
        });
      }

      const bloodBag = await prisma.bloodBag.update({
        where: { id },
        data: {
          status: 'COLETADA',
          temperaturaAtual: temperaturaAtual || 4.0,
          localizacaoAtual: localizacaoAtual || 'Coleta',
        },
        include: {
          instituicaoAtual: true,
        },
      });

      // Create event
      await prisma.event.create({
        data: {
          bagId: bloodBag.id,
          tipoEvento: 'COLETA',
          descricao: 'Bolsa de sangue coletada',
          instituicaoId: req.user.institutionId,
          usuarioId: req.user.userId,
          timestamp: new Date(),
          hash: computeHash({
            bagId: bloodBag.id,
            eventType: 'COLETA',
            institutionId: req.user.institutionId,
            userId: req.user.userId,
            timestamp: new Date().toISOString(),
          }),
        },
      });

      return res.json({
        success: true,
        message: 'Bolsa de sangue coletada com sucesso.',
        data: bloodBag,
      });
    } catch (error: any) {
      console.error('Collect blood bag error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao coletar bolsa de sangue.',
        error: error.message,
      });
    }
  }

  async registerTests(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { resultados } = req.body;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado.',
        });
      }

      const bloodBag = await prisma.bloodBag.update({
        where: { id },
        data: {
          status: 'EM_TESTE',
        },
        include: {
          instituicaoAtual: true,
        },
      });

      // Create event
      await prisma.event.create({
        data: {
          bagId: bloodBag.id,
          tipoEvento: 'TESTE',
          descricao: `Testes realizados: ${JSON.stringify(resultados)}`,
          instituicaoId: req.user.institutionId,
          usuarioId: req.user.userId,
          timestamp: new Date(),
          hash: computeHash({
            bagId: bloodBag.id,
            eventType: 'TESTE',
            institutionId: req.user.institutionId,
            userId: req.user.userId,
            timestamp: new Date().toISOString(),
            data: JSON.stringify(resultados),
          }),
        },
      });

      return res.json({
        success: true,
        message: 'Testes registrados com sucesso.',
        data: bloodBag,
      });
    } catch (error: any) {
      console.error('Register tests error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao registrar testes.',
        error: error.message,
      });
    }
  }

  async approve(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado.',
        });
      }

      const bloodBag = await prisma.bloodBag.update({
        where: { id },
        data: {
          status: 'APROVADA',
        },
        include: {
          instituicaoAtual: true,
        },
      });

      // Register in blockchain
      try {
        await this.blockchainService.approveBloodBag(
          bloodBag.id,
          req.user.institutionId,
          req.user.userId
        );
      } catch (blockchainError) {
        console.error('Blockchain approval error:', blockchainError);
      }

      // Create event
      await prisma.event.create({
        data: {
          bagId: bloodBag.id,
          tipoEvento: 'APROVACAO',
          descricao: 'Bolsa de sangue aprovada',
          instituicaoId: req.user.institutionId,
          usuarioId: req.user.userId,
          timestamp: new Date(),
          hash: computeHash({
            bagId: bloodBag.id,
            eventType: 'APROVACAO',
            institutionId: req.user.institutionId,
            userId: req.user.userId,
            timestamp: new Date().toISOString(),
          }),
        },
      });

      return res.json({
        success: true,
        message: 'Bolsa de sangue aprovada com sucesso.',
        data: bloodBag,
      });
    } catch (error: any) {
      console.error('Approve blood bag error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao aprovar bolsa de sangue.',
        error: error.message,
      });
    }
  }

  async reject(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado.',
        });
      }

      const bloodBag = await prisma.bloodBag.update({
        where: { id },
        data: {
          status: 'REPROVADA',
          observations: reason || bloodBag.observations,
        },
        include: {
          instituicaoAtual: true,
        },
      });

      // Register in blockchain
      try {
        await this.blockchainService.rejectBloodBag(
          bloodBag.id,
          req.user.institutionId,
          req.user.userId,
          reason
        );
      } catch (blockchainError) {
        console.error('Blockchain rejection error:', blockchainError);
      }

      // Create event
      await prisma.event.create({
        data: {
          bagId: bloodBag.id,
          tipoEvento: 'REPROVACAO',
          descricao: `Bolsa de sangue reprovada: ${reason}`,
          instituicaoId: req.user.institutionId,
          usuarioId: req.user.userId,
          timestamp: new Date(),
          hash: computeHash({
            bagId: bloodBag.id,
            eventType: 'REPROVACAO',
            institutionId: req.user.institutionId,
            userId: req.user.userId,
            timestamp: new Date().toISOString(),
            data: reason,
          }),
        },
      });

      return res.json({
        success: true,
        message: 'Bolsa de sangue reprovada com sucesso.',
        data: bloodBag,
      });
    } catch (error: any) {
      console.error('Reject blood bag error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao reprovar bolsa de sangue.',
        error: error.message,
      });
    }
  }

  async store(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { localizacaoAtual, temperaturaAtual } = req.body;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado.',
        });
      }

      const bloodBag = await prisma.bloodBag.update({
        where: { id },
        data: {
          status: 'ARMAZENADA',
          localizacaoAtual,
          temperaturaAtual,
        },
        include: {
          instituicaoAtual: true,
        },
      });

      // Create event
      await prisma.event.create({
        data: {
          bagId: bloodBag.id,
          tipoEvento: 'ARMAZENAMENTO',
          descricao: `Bolsa armazenada em ${localizacaoAtual}`,
          instituicaoId: req.user.institutionId,
          usuarioId: req.user.userId,
          timestamp: new Date(),
          hash: computeHash({
            bagId: bloodBag.id,
            eventType: 'ARMAZENAMENTO',
            institutionId: req.user.institutionId,
            userId: req.user.userId,
            timestamp: new Date().toISOString(),
            data: localizacaoAtual,
          }),
        },
      });

      return res.json({
        success: true,
        message: 'Bolsa armazenada com sucesso.',
        data: bloodBag,
      });
    } catch (error: any) {
      console.error('Store blood bag error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao armazenar bolsa de sangue.',
        error: error.message,
      });
    }
  }

  async reserve(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { demandId } = req.body;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado.',
        });
      }

      const bloodBag = await prisma.bloodBag.update({
        where: { id },
        data: {
          status: 'RESERVADA',
        },
        include: {
          instituicaoAtual: true,
        },
      });

      // Create event
      await prisma.event.create({
        data: {
          bagId: bloodBag.id,
          tipoEvento: 'RESERVA',
          descricao: `Bolsa reservada para demanda ${demandId}`,
          instituicaoId: req.user.institutionId,
          usuarioId: req.user.userId,
          timestamp: new Date(),
          hash: computeHash({
            bagId: bloodBag.id,
            eventType: 'RESERVA',
            institutionId: req.user.institutionId,
            userId: req.user.userId,
            timestamp: new Date().toISOString(),
            data: demandId,
          }),
        },
      });

      return res.json({
        success: true,
        message: 'Bolsa reservada com sucesso.',
        data: bloodBag,
      });
    } catch (error: any) {
      console.error('Reserve blood bag error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao reservar bolsa de sangue.',
        error: error.message,
      });
    }
  }

  async use(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { pacienteId, motivo } = req.body;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado.',
        });
      }

      const bloodBag = await prisma.bloodBag.update({
        where: { id },
        data: {
          status: 'UTILIZADA',
        },
        include: {
          instituicaoAtual: true,
        },
      });

      // Register in blockchain
      try {
        await this.blockchainService.useBloodBag(
          bloodBag.id,
          req.user.institutionId,
          req.user.userId,
          pacienteId,
          motivo
        );
      } catch (blockchainError) {
        console.error('Blockchain use error:', blockchainError);
      }

      // Create event
      await prisma.event.create({
        data: {
          bagId: bloodBag.id,
          tipoEvento: 'UTILIZACAO',
          descricao: `Bolsa utilizada para paciente ${pacienteId}: ${motivo}`,
          instituicaoId: req.user.institutionId,
          usuarioId: req.user.userId,
          timestamp: new Date(),
          hash: computeHash({
            bagId: bloodBag.id,
            eventType: 'UTILIZACAO',
            institutionId: req.user.institutionId,
            userId: req.user.userId,
            timestamp: new Date().toISOString(),
            data: JSON.stringify({ pacienteId, motivo }),
          }),
        },
      });

      return res.json({
        success: true,
        message: 'Bolsa utilizada com sucesso.',
        data: bloodBag,
      });
    } catch (error: any) {
      console.error('Use blood bag error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao utilizar bolsa de sangue.',
        error: error.message,
      });
    }
  }

  async discard(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado.',
        });
      }

      const bloodBag = await prisma.bloodBag.update({
        where: { id },
        data: {
          status: 'DESCARTADA',
          observations: reason || bloodBag.observations,
        },
        include: {
          instituicaoAtual: true,
        },
      });

      // Register in blockchain
      try {
        await this.blockchainService.discardBloodBag(
          bloodBag.id,
          req.user.institutionId,
          req.user.userId,
          reason
        );
      } catch (blockchainError) {
        console.error('Blockchain discard error:', blockchainError);
      }

      // Create event
      await prisma.event.create({
        data: {
          bagId: bloodBag.id,
          tipoEvento: 'DESCARTE',
          descricao: `Bolsa descartada: ${reason}`,
          instituicaoId: req.user.institutionId,
          usuarioId: req.user.userId,
          timestamp: new Date(),
          hash: computeHash({
            bagId: bloodBag.id,
            eventType: 'DESCARTE',
            institutionId: req.user.institutionId,
            userId: req.user.userId,
            timestamp: new Date().toISOString(),
            data: reason,
          }),
        },
      });

      return res.json({
        success: true,
        message: 'Bolsa descartada com sucesso.',
        data: bloodBag,
      });
    } catch (error: any) {
      console.error('Discard blood bag error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao descartar bolsa de sangue.',
        error: error.message,
      });
    }
  }

  async getHistory(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const events = await prisma.event.findMany({
        where: {
          bagId: id,
        },
        include: {
          bloodBag: true,
          instituicao: true,
          usuario: true,
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      return res.json({
        success: true,
        data: events,
      });
    } catch (error: any) {
      console.error('Get blood bag history error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar histórico da bolsa de sangue.',
        error: error.message,
      });
    }
  }

  async getQRCode(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const bloodBag = await prisma.bloodBag.findUnique({
        where: { id },
      });

      if (!bloodBag) {
        return res.status(404).json({
          success: false,
          message: 'Bolsa de sangue não encontrada.',
        });
      }

      return res.json({
        success: true,
        data: {
          qrCode: bloodBag.qrCode,
        },
      });
    } catch (error: any) {
      console.error('Get QR code error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar QR code.',
        error: error.message,
      });
    }
  }

  async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      const where: any = {};

      // Filter by institution based on user role
      if (req.user?.role !== 'ADMIN') {
        where.instituicaoAtualId = req.user?.institutionId;
      }

      const total = await prisma.bloodBag.count({ where });

      const byType = await prisma.bloodBag.groupBy({
        by: ['tipoSanguineo'],
        _count: {
          _all: true,
        },
        where,
      });

      const byStatus = await prisma.bloodBag.groupBy({
        by: ['status'],
        _count: {
          _all: true,
        },
        where,
      });

      const available = await prisma.bloodBag.count({
        where: {
          ...where,
          status: 'DISPONIVEL',
        },
      });

      const expired = await prisma.bloodBag.count({
        where: {
          ...where,
          dataValidade: {
            lt: new Date(),
          },
        },
      });

      const inTransit = await prisma.bloodBag.count({
        where: {
          ...where,
          status: 'EM_TRANSPORTE',
        },
      });

      const used = await prisma.bloodBag.count({
        where: {
          ...where,
          status: 'UTILIZADA',
        },
      });

      const typeStats: Record<string, number> = {};
      byType.forEach((group) => {
        typeStats[group.tipoSanguineo] = group._count._all;
      });

      const statusStats: Record<string, number> = {};
      byStatus.forEach((group) => {
        statusStats[group.status] = group._count._all;
      });

      return res.json({
        success: true,
        data: {
          total,
          byType: typeStats,
          byStatus: statusStats,
          available,
          expired,
          inTransit,
          used,
        },
      });
    } catch (error: any) {
      console.error('Get blood bag stats error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar estatísticas.',
        error: error.message,
      });
    }
  }

  async searchCompatible(req: AuthenticatedRequest, res: Response) {
    try {
      const { demandId } = req.params;

      // Get demand
      const demand = await prisma.demand.findUnique({
        where: { id: demandId },
      });

      if (!demand) {
        return res.status(404).json({
          success: false,
          message: 'Demanda não encontrada.',
        });
      }

      // Find compatible blood bags
      const bloodBags = await prisma.bloodBag.findMany({
        where: {
          tipoSanguineo: demand.tipoSanguineo,
          status: 'DISPONIVEL',
          dataValidade: {
            gte: new Date(),
          },
        },
        include: {
          instituicaoAtual: true,
        },
      });

      return res.json({
        success: true,
        data: bloodBags,
      });
    } catch (error: any) {
      console.error('Search compatible blood bags error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar bolsas compatíveis.',
        error: error.message,
      });
    }
  }
}
