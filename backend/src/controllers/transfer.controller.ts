import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { computeHash } from '../utils/hash.utils';
import { BlockchainService } from '../blockchain/BlockchainService';

export class TransferController {
  private blockchainService: BlockchainService;

  constructor() {
    this.blockchainService = new BlockchainService();
  }

  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const { page = 1, pageSize = 10, status, deInstituicaoId, paraInstituicaoId } = req.query;

      const where: any = {};

      if (status) {
        where.status = status as string;
      }

      if (deInstituicaoId) {
        where.deInstituicaoId = deInstituicaoId as string;
      }

      if (paraInstituicaoId) {
        where.paraInstituicaoId = paraInstituicaoId as string;
      }

      // Filter by user's institution
      if (req.user?.role !== 'ADMIN') {
        where = {
          ...where,
          OR: [
            { deInstituicaoId: req.user?.institutionId },
            { paraInstituicaoId: req.user?.institutionId },
          ],
        };
      }

      const transfers = await prisma.transfer.findMany({
        where,
        include: {
          demanda: true,
          bolsa: true,
          deInstituicao: true,
          paraInstituicao: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: Number(pageSize),
        skip: (Number(page) - 1) * Number(pageSize),
      });

      const total = await prisma.transfer.count({ where });

      return res.json({
        success: true,
        data: {
          data: transfers,
          total,
          page: Number(page),
          pageSize: Number(pageSize),
          totalPages: Math.ceil(total / Number(pageSize)),
        },
      });
    } catch (error: any) {
      console.error('Get all transfers error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar transferências.',
        error: error.message,
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const transfer = await prisma.transfer.findUnique({
        where: { id },
        include: {
          demanda: true,
          bolsa: true,
          deInstituicao: true,
          paraInstituicao: true,
        },
      });

      if (!transfer) {
        return res.status(404).json({
          success: false,
          message: 'Transferência não encontrada.',
        });
      }

      return res.json({
        success: true,
        data: transfer,
      });
    } catch (error: any) {
      console.error('Get transfer by ID error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar transferência.',
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

      const { demandaId, bolsaId, quantidade, observacoes } = req.body;

      // Get demand
      const demand = await prisma.demand.findUnique({
        where: { id: demandaId },
      });

      if (!demand) {
        return res.status(404).json({
          success: false,
          message: 'Demanda não encontrada.',
        });
      }

      // Get blood bag
      const bloodBag = await prisma.bloodBag.findUnique({
        where: { id: bolsaId },
      });

      if (!bloodBag) {
        return res.status(404).json({
          success: false,
          message: 'Bolsa de sangue não encontrada.',
        });
      }

      // Check if blood bag is available
      if (bloodBag.status !== 'DISPONIVEL') {
        return res.status(400).json({
          success: false,
          message: 'Bolsa de sangue não está disponível para transferência.',
        });
      }

      // Create transfer
      const transfer = await prisma.transfer.create({
        data: {
          demandaId,
          bolsaId,
          deInstituicaoId: bloodBag.instituicaoAtualId,
          paraInstituicaoId: demand.institutionId,
          quantidade: Number(quantidade) || 1,
          status: 'PENDENTE',
          dataSolicitacao: new Date(),
          observacoes,
        },
        include: {
          demanda: true,
          bolsa: true,
          deInstituicao: true,
          paraInstituicao: true,
        },
      });

      // Update blood bag status to RESERVADA
      await prisma.bloodBag.update({
        where: { id: bolsaId },
        data: {
          status: 'RESERVADA',
        },
      });

      // Register in blockchain
      try {
        await this.blockchainService.transferBloodBag(
          transfer.id,
          bolsaId,
          demandaId,
          transfer.deInstituicaoId,
          transfer.paraInstituicaoId,
          req.user.userId
        );
      } catch (blockchainError) {
        console.error('Blockchain transfer registration error:', blockchainError);
      }

      // Create event
      await prisma.event.create({
        data: {
          bagId: bolsaId,
          tipoEvento: 'TRANSFERENCIA_SOLICITADA',
          descricao: `Transferência solicitada para demanda ${demandaId}`,
          instituicaoId: req.user.institutionId,
          usuarioId: req.user.userId,
          timestamp: new Date(),
          hash: computeHash({
            transferId: transfer.id,
            bagId: bolsaId,
            eventType: 'TRANSFERENCIA_SOLICITADA',
            institutionId: req.user.institutionId,
            userId: req.user.userId,
            timestamp: new Date().toISOString(),
            data: JSON.stringify({ demandaId, quantidade }),
          }),
        },
      });

      return res.json({
        success: true,
        message: 'Transferência criada com sucesso.',
        data: transfer,
      });
    } catch (error: any) {
      console.error('Create transfer error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar transferência.',
        error: error.message,
      });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const transfer = await prisma.transfer.update({
        where: { id },
        data: updateData,
        include: {
          demanda: true,
          bolsa: true,
          deInstituicao: true,
          paraInstituicao: true,
        },
      });

      return res.json({
        success: true,
        message: 'Transferência atualizada com sucesso.',
        data: transfer,
      });
    } catch (error: any) {
      console.error('Update transfer error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar transferência.',
        error: error.message,
      });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      // Get transfer
      const transfer = await prisma.transfer.findUnique({
        where: { id },
        include: {
          bolsa: true,
        },
      });

      if (!transfer) {
        return res.status(404).json({
          success: false,
          message: 'Transferência não encontrada.',
        });
      }

      // Only allow deletion if transfer is PENDENTE
      if (transfer.status !== 'PENDENTE') {
        return res.status(400).json({
          success: false,
          message: 'Não é possível deletar uma transferência que já foi processada.',
        });
      }

      // Update blood bag status back to DISPONIVEL
      await prisma.bloodBag.update({
        where: { id: transfer.bolsaId },
        data: {
          status: 'DISPONIVEL',
        },
      });

      await prisma.transfer.delete({
        where: { id },
      });

      return res.json({
        success: true,
        message: 'Transferência deletada com sucesso.',
      });
    } catch (error: any) {
      console.error('Delete transfer error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao deletar transferência.',
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

      // Get transfer
      const transfer = await prisma.transfer.findUnique({
        where: { id },
        include: {
          bolsa: true,
          demanda: true,
        },
      });

      if (!transfer) {
        return res.status(404).json({
          success: false,
          message: 'Transferência não encontrada.',
        });
      }

      // Check if user is from the source institution
      if (req.user.institutionId !== transfer.deInstituicaoId) {
        return res.status(403).json({
          success: false,
          message: 'Somente a instituição de origem pode aprovar a transferência.',
        });
      }

      // Check if transfer is PENDENTE
      if (transfer.status !== 'PENDENTE') {
        return res.status(400).json({
          success: false,
          message: 'Transferência já foi processada.',
        });
      }

      const updatedTransfer = await prisma.transfer.update({
        where: { id },
        data: {
          status: 'APROVADA',
          dataAprovacao: new Date(),
        },
        include: {
          demanda: true,
          bolsa: true,
          deInstituicao: true,
          paraInstituicao: true,
        },
      });

      // Register in blockchain
      try {
        await this.blockchainService.approveTransfer(
          transfer.id,
          req.user.institutionId,
          req.user.userId
        );
      } catch (blockchainError) {
        console.error('Blockchain transfer approval error:', blockchainError);
      }

      // Create event
      await prisma.event.create({
        data: {
          bagId: transfer.bolsaId,
          tipoEvento: 'TRANSFERENCIA_APROVADA',
          descricao: `Transferência aprovada para ${transfer.paraInstituicaoId}`,
          instituicaoId: req.user.institutionId,
          usuarioId: req.user.userId,
          timestamp: new Date(),
          hash: computeHash({
            transferId: transfer.id,
            bagId: transfer.bolsaId,
            eventType: 'TRANSFERENCIA_APROVADA',
            institutionId: req.user.institutionId,
            userId: req.user.userId,
            timestamp: new Date().toISOString(),
          }),
        },
      });

      return res.json({
        success: true,
        message: 'Transferência aprovada com sucesso.',
        data: updatedTransfer,
      });
    } catch (error: any) {
      console.error('Approve transfer error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao aprovar transferência.',
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

      // Get transfer
      const transfer = await prisma.transfer.findUnique({
        where: { id },
        include: {
          bolsa: true,
        },
      });

      if (!transfer) {
        return res.status(404).json({
          success: false,
          message: 'Transferência não encontrada.',
        });
      }

      // Check if user is from the source institution
      if (req.user.institutionId !== transfer.deInstituicaoId) {
        return res.status(403).json({
          success: false,
          message: 'Somente a instituição de origem pode rejeitar a transferência.',
        });
      }

      // Check if transfer is PENDENTE
      if (transfer.status !== 'PENDENTE') {
        return res.status(400).json({
          success: false,
          message: 'Transferência já foi processada.',
        });
      }

      const updatedTransfer = await prisma.transfer.update({
        where: { id },
        data: {
          status: 'REJEITADA',
          observacoes: `${transfer.observacoes} - Rejeitada: ${reason}`,
        },
        include: {
          demanda: true,
          bolsa: true,
          deInstituicao: true,
          paraInstituicao: true,
        },
      });

      // Update blood bag status back to DISPONIVEL
      await prisma.bloodBag.update({
        where: { id: transfer.bolsaId },
        data: {
          status: 'DISPONIVEL',
        },
      });

      // Register in blockchain
      try {
        await this.blockchainService.rejectTransfer(
          transfer.id,
          req.user.institutionId,
          req.user.userId,
          reason
        );
      } catch (blockchainError) {
        console.error('Blockchain transfer rejection error:', blockchainError);
      }

      // Create event
      await prisma.event.create({
        data: {
          bagId: transfer.bolsaId,
          tipoEvento: 'TRANSFERENCIA_REJEITADA',
          descricao: `Transferência rejeitada: ${reason}`,
          instituicaoId: req.user.institutionId,
          usuarioId: req.user.userId,
          timestamp: new Date(),
          hash: computeHash({
            transferId: transfer.id,
            bagId: transfer.bolsaId,
            eventType: 'TRANSFERENCIA_REJEITADA',
            institutionId: req.user.institutionId,
            userId: req.user.userId,
            timestamp: new Date().toISOString(),
            data: reason,
          }),
        },
      });

      return res.json({
        success: true,
        message: 'Transferência rejeitada com sucesso.',
        data: updatedTransfer,
      });
    } catch (error: any) {
      console.error('Reject transfer error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao rejeitar transferência.',
        error: error.message,
      });
    }
  }

  async startTransport(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { transportadora, veiculo } = req.body;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado.',
        });
      }

      // Get transfer
      const transfer = await prisma.transfer.findUnique({
        where: { id },
        include: {
          bolsa: true,
        },
      });

      if (!transfer) {
        return res.status(404).json({
          success: false,
          message: 'Transferência não encontrada.',
        });
      }

      // Check if transfer is APROVADA
      if (transfer.status !== 'APROVADA') {
        return res.status(400).json({
          success: false,
          message: 'Transferência deve ser aprovada antes de iniciar o transporte.',
        });
      }

      const updatedTransfer = await prisma.transfer.update({
        where: { id },
        data: {
          status: 'EM_TRANSPORTE',
          dataTransporte: new Date(),
          observacoes: `${transfer.observacoes} - Transporte: ${transportadora || ''} ${veiculo || ''}`,
        },
        include: {
          demanda: true,
          bolsa: true,
          deInstituicao: true,
          paraInstituicao: true,
        },
      });

      // Update blood bag status
      await prisma.bloodBag.update({
        where: { id: transfer.bolsaId },
        data: {
          status: 'EM_TRANSPORTE',
        },
      });

      // Register in blockchain
      try {
        await this.blockchainService.startTransport(
          transfer.id,
          req.user.institutionId,
          req.user.userId
        );
      } catch (blockchainError) {
        console.error('Blockchain transport start error:', blockchainError);
      }

      // Create event
      await prisma.event.create({
        data: {
          bagId: transfer.bolsaId,
          tipoEvento: 'TRANSPORTE_INICIADO',
          descricao: `Transporte iniciado: ${transportadora || 'N/A'} - ${veiculo || 'N/A'}`,
          instituicaoId: req.user.institutionId,
          usuarioId: req.user.userId,
          timestamp: new Date(),
          hash: computeHash({
            transferId: transfer.id,
            bagId: transfer.bolsaId,
            eventType: 'TRANSPORTE_INICIADO',
            institutionId: req.user.institutionId,
            userId: req.user.userId,
            timestamp: new Date().toISOString(),
            data: JSON.stringify({ transportadora, veiculo }),
          }),
        },
      });

      return res.json({
        success: true,
        message: 'Transporte iniciado com sucesso.',
        data: updatedTransfer,
      });
    } catch (error: any) {
      console.error('Start transport error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao iniciar transporte.',
        error: error.message,
      });
    }
  }

  async receive(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { temperaturaAtual, localizacaoAtual } = req.body;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado.',
        });
      }

      // Get transfer
      const transfer = await prisma.transfer.findUnique({
        where: { id },
        include: {
          bolsa: true,
          demanda: true,
        },
      });

      if (!transfer) {
        return res.status(404).json({
          success: false,
          message: 'Transferência não encontrada.',
        });
      }

      // Check if user is from the destination institution
      if (req.user.institutionId !== transfer.paraInstituicaoId) {
        return res.status(403).json({
          success: false,
          message: 'Somente a instituição de destino pode receber a transferência.',
        });
      }

      // Check if transfer is EM_TRANSPORTE
      if (transfer.status !== 'EM_TRANSPORTE') {
        return res.status(400).json({
          success: false,
          message: 'Transferência não está em transporte.',
        });
      }

      const updatedTransfer = await prisma.transfer.update({
        where: { id },
        data: {
          status: 'ENTREGUE',
          dataRecebimento: new Date(),
        },
        include: {
          demanda: true,
          bolsa: true,
          deInstituicao: true,
          paraInstituicao: true,
        },
      });

      // Update blood bag
      await prisma.bloodBag.update({
        where: { id: transfer.bolsaId },
        data: {
          status: 'RECEBIDA',
          instituicaoAtualId: transfer.paraInstituicaoId,
          localizacaoAtual: localizacaoAtual || 'Recepção',
          temperaturaAtual: temperaturaAtual || 4.0,
        },
      });

      // Update demand status if all transfers are completed
      const demandTransfers = await prisma.transfer.count({
        where: {
          demandaId: transfer.demandaId,
          status: 'ENTREGUE',
        },
      });

      const totalTransfers = await prisma.transfer.count({
        where: {
          demandaId: transfer.demandaId,
        },
      });

      if (demandTransfers === totalTransfers) {
        await prisma.demand.update({
          where: { id: transfer.demandaId },
          data: {
            status: 'ATENDIDA',
            dataAtendimento: new Date(),
          },
        });
      }

      // Register in blockchain
      try {
        await this.blockchainService.receiveBloodBag(
          transfer.bolsaId,
          transfer.id,
          req.user.institutionId,
          req.user.userId
        );
      } catch (blockchainError) {
        console.error('Blockchain receive error:', blockchainError);
      }

      // Create event
      await prisma.event.create({
        data: {
          bagId: transfer.bolsaId,
          tipoEvento: 'RECEBIMENTO',
          descricao: `Bolsa recebida na instituição ${transfer.paraInstituicaoId}`,
          instituicaoId: req.user.institutionId,
          usuarioId: req.user.userId,
          timestamp: new Date(),
          hash: computeHash({
            transferId: transfer.id,
            bagId: transfer.bolsaId,
            eventType: 'RECEBIMENTO',
            institutionId: req.user.institutionId,
            userId: req.user.userId,
            timestamp: new Date().toISOString(),
          }),
        },
      });

      return res.json({
        success: true,
        message: 'Transferência recebida com sucesso.',
        data: updatedTransfer,
      });
    } catch (error: any) {
      console.error('Receive transfer error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao receber transferência.',
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

      const transfers = await prisma.transfer.findMany({
        where: {
          OR: [
            { deInstituicaoId: req.user.institutionId },
            { paraInstituicaoId: req.user.institutionId },
          ],
        },
        include: {
          demanda: true,
          bolsa: true,
          deInstituicao: true,
          paraInstituicao: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.json({
        success: true,
        data: transfers,
      });
    } catch (error: any) {
      console.error('Get transfers by my institution error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar transferências da instituição.',
        error: error.message,
      });
    }
  }

  async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      const where: any = {};

      // Filter by user's institution
      if (req.user?.role !== 'ADMIN') {
        where = {
          OR: [
            { deInstituicaoId: req.user?.institutionId },
            { paraInstituicaoId: req.user?.institutionId },
          ],
        };
      }

      const total = await prisma.transfer.count({ where });

      const byStatus = await prisma.transfer.groupBy({
        by: ['status'],
        _count: {
          _all: true,
        },
        where,
      });

      const pending = await prisma.transfer.count({
        where: {
          ...where,
          status: 'PENDENTE',
        },
      });

      const inTransit = await prisma.transfer.count({
        where: {
          ...where,
          status: 'EM_TRANSPORTE',
        },
      });

      const completed = await prisma.transfer.count({
        where: {
          ...where,
          status: 'ENTREGUE',
        },
      });

      const statusStats: Record<string, number> = {};
      byStatus.forEach((group) => {
        statusStats[group.status] = group._count._all;
      });

      return res.json({
        success: true,
        data: {
          total,
          byStatus: statusStats,
          pending,
          inTransit,
          completed,
        },
      });
    } catch (error: any) {
      console.error('Get transfer stats error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar estatísticas.',
        error: error.message,
      });
    }
  }
}
