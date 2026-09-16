import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { computeHash } from '../utils/hash.utils';

export class EventController {
  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const { page = 1, pageSize = 10, bagId, tipoEvento, instituicaoId } = req.query;

      const where: any = {};

      if (bagId) {
        where.bagId = bagId as string;
      }

      if (tipoEvento) {
        where.tipoEvento = tipoEvento as string;
      }

      // Filter by user's institution
      if (req.user?.role !== 'ADMIN') {
        where.instituicaoId = req.user?.institutionId;
      } else if (instituicaoId) {
        where.instituicaoId = instituicaoId as string;
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
        take: Number(pageSize),
        skip: (Number(page) - 1) * Number(pageSize),
      });

      const total = await prisma.event.count({ where });

      return res.json({
        success: true,
        data: {
          data: events,
          total,
          page: Number(page),
          pageSize: Number(pageSize),
          totalPages: Math.ceil(total / Number(pageSize)),
        },
      });
    } catch (error: any) {
      console.error('Get all events error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar eventos.',
        error: error.message,
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const event = await prisma.event.findUnique({
        where: { id },
        include: {
          bloodBag: true,
          instituicao: true,
          usuario: true,
        },
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Evento não encontrado.',
        });
      }

      return res.json({
        success: true,
        data: event,
      });
    } catch (error: any) {
      console.error('Get event by ID error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar evento.',
        error: error.message,
      });
    }
  }

  async verify(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const event = await prisma.event.findUnique({
        where: { id },
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Evento não encontrado.',
        });
      }

      // Recompute hash to verify integrity
      const recomputedHash = computeHash({
        bagId: event.bagId,
        eventType: event.tipoEvento,
        institutionId: event.instituicaoId,
        userId: event.usuarioId,
        timestamp: event.timestamp.toISOString(),
        data: event.descricao,
      });

      const isVerified = event.hash === recomputedHash;

      return res.json({
        success: true,
        data: {
          verified: isVerified,
          hash: event.hash,
          message: isVerified ? 'Evento íntegro - hash verificado' : 'Hash divergente - possível alteração nos dados',
        },
      });
    } catch (error: any) {
      console.error('Verify event error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar evento.',
        error: error.message,
      });
    }
  }

  async verifyBagHistory(req: Request, res: Response) {
    try {
      const { bagId } = req.params;

      const events = await prisma.event.findMany({
        where: {
          bagId,
        },
        include: {
          bloodBag: true,
          instituicao: true,
          usuario: true,
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      if (!events || events.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Nenhum evento encontrado para esta bolsa.',
        });
      }

      // Verify all events
      const verificationResults = events.map((event) => {
        const recomputedHash = computeHash({
          bagId: event.bagId,
          eventType: event.tipoEvento,
          institutionId: event.instituicaoId,
          userId: event.usuarioId,
          timestamp: event.timestamp.toISOString(),
          data: event.descricao,
        });

        return {
          eventId: event.id,
          verified: event.hash === recomputedHash,
          hash: event.hash,
          recomputedHash,
        };
      });

      const allVerified = verificationResults.every((result) => result.verified);

      return res.json({
        success: true,
        data: {
          verified: allVerified,
          events,
          message: allVerified 
            ? 'Histórico completo verificado - todos os eventos estão íntegros' 
            : 'Atenção: um ou mais eventos apresentam divergência de hash',
          verificationResults,
        },
      });
    } catch (error: any) {
      console.error('Verify bag history error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar histórico da bolsa.',
        error: error.message,
      });
    }
  }
}
