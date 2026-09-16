import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { computeHash } from '../utils/hash.utils';

// Temperature thresholds configuration
const TEMPERATURE_MIN = 1.0; // Minimum temperature in Celsius
const TEMPERATURE_MAX = 6.0; // Maximum temperature in Celsius

export class TemperatureController {
  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const { bagId } = req.params;
      const { page = 1, pageSize = 10 } = req.query;

      const readings = await prisma.temperatureReading.findMany({
        where: {
          bagId,
        },
        include: {
          bloodBag: true,
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: Number(pageSize),
        skip: (Number(page) - 1) * Number(pageSize),
      });

      const total = await prisma.temperatureReading.count({
        where: { bagId },
      });

      return res.json({
        success: true,
        data: {
          data: readings,
          total,
          page: Number(page),
          pageSize: Number(pageSize),
          totalPages: Math.ceil(total / Number(pageSize)),
        },
      });
    } catch (error: any) {
      console.error('Get all temperature readings error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar leituras de temperatura.',
        error: error.message,
      });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { bagId } = req.params;
      const { temperature } = req.body;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado.',
        });
      }

      // Check if blood bag exists
      const bloodBag = await prisma.bloodBag.findUnique({
        where: { id: bagId },
      });

      if (!bloodBag) {
        return res.status(404).json({
          success: false,
          message: 'Bolsa de sangue não encontrada.',
        });
      }

      // Check temperature thresholds
      const isAlert = temperature < TEMPERATURE_MIN || temperature > TEMPERATURE_MAX;
      const alertMessage = isAlert
        ? `Temperatura fora da faixa: ${temperature}°C (faixa permitida: ${TEMPERATURE_MIN}°C - ${TEMPERATURE_MAX}°C)`
        : null;

      const reading = await prisma.temperatureReading.create({
        data: {
          bagId,
          temperature: Number(temperature),
          isAlert,
          alertMessage,
        },
        include: {
          bloodBag: true,
        },
      });

      // Update blood bag temperature
      await prisma.bloodBag.update({
        where: { id: bagId },
        data: {
          temperaturaAtual: Number(temperature),
        },
      });

      // Create event if alert
      if (isAlert) {
        await prisma.event.create({
          data: {
            bagId,
            tipoEvento: 'ALERTA_TEMPERATURA',
            descricao: alertMessage || '',
            instituicaoId: req.user.institutionId,
            usuarioId: req.user.userId,
            timestamp: new Date(),
            hash: computeHash({
              bagId,
              eventType: 'ALERTA_TEMPERATURA',
              institutionId: req.user.institutionId,
              userId: req.user.userId,
              timestamp: new Date().toISOString(),
              data: alertMessage,
            }),
          },
        });
      }

      return res.json({
        success: true,
        message: 'Leitura de temperatura registrada com sucesso.',
        data: reading,
      });
    } catch (error: any) {
      console.error('Create temperature reading error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao registrar leitura de temperatura.',
        error: error.message,
      });
    }
  }

  async simulate(req: AuthenticatedRequest, res: Response) {
    try {
      const { bagId } = req.params;
      const { count = 10 } = req.query;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado.',
        });
      }

      // Check if blood bag exists
      const bloodBag = await prisma.bloodBag.findUnique({
        where: { id: bagId },
      });

      if (!bloodBag) {
        return res.status(404).json({
          success: false,
          message: 'Bolsa de sangue não encontrada.',
        });
      }

      const readings: any[] = [];

      for (let i = 0; i < Number(count); i++) {
        // Generate random temperature with some variations
        const baseTemp = 4.0 + Math.random() * 2; // Base between 4-6°C
        const variation = (Math.random() - 0.5) * 2; // Random variation
        const temperature = Math.round((baseTemp + variation) * 10) / 10;

        const isAlert = temperature < TEMPERATURE_MIN || temperature > TEMPERATURE_MAX;
        const alertMessage = isAlert
          ? `Temperatura fora da faixa: ${temperature}°C`
          : null;

        const reading = await prisma.temperatureReading.create({
          data: {
            bagId,
            temperature,
            isAlert,
            alertMessage,
            timestamp: new Date(Date.now() - (Number(count) - i) * 60 * 60 * 1000), // Spread over time
          },
          include: {
            bloodBag: true,
          },
        });

        readings.push(reading);

        // Update blood bag temperature
        await prisma.bloodBag.update({
          where: { id: bagId },
          data: {
            temperaturaAtual: temperature,
          },
        });

        // Create event if alert
        if (isAlert) {
          await prisma.event.create({
            data: {
              bagId,
              tipoEvento: 'ALERTA_TEMPERATURA',
              descricao: alertMessage || '',
              instituicaoId: req.user.institutionId,
              usuarioId: req.user.userId,
              timestamp: new Date(),
              hash: computeHash({
                bagId,
                eventType: 'ALERTA_TEMPERATURA',
                institutionId: req.user.institutionId,
                userId: req.user.userId,
                timestamp: new Date().toISOString(),
                data: alertMessage,
              }),
            },
          });
        }

        // Small delay to avoid database overload
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return res.json({
        success: true,
        message: `${count} leituras de temperatura simuladas com sucesso.`,
        data: readings,
      });
    } catch (error: any) {
      console.error('Simulate temperature readings error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao simular leituras de temperatura.',
        error: error.message,
      });
    }
  }

  async getAlerts(req: AuthenticatedRequest, res: Response) {
    try {
      const alerts = await prisma.temperatureReading.findMany({
        where: {
          isAlert: true,
        },
        include: {
          bloodBag: {
            include: {
              instituicaoAtual: true,
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      return res.json({
        success: true,
        data: alerts,
      });
    } catch (error: any) {
      console.error('Get temperature alerts error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar alertas de temperatura.',
        error: error.message,
      });
    }
  }

  async configureThresholds(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Permissão negada. Somente administradores podem configurar os limites.',
        });
      }

      const { min, max } = req.body;

      // In a real implementation, these would be stored in a configuration table
      // For now, just return the new configuration

      return res.json({
        success: true,
        message: 'Limites de temperatura configurados com sucesso.',
        data: {
          min: Number(min),
          max: Number(max),
        },
      });
    } catch (error: any) {
      console.error('Configure temperature thresholds error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao configurar limites de temperatura.',
        error: error.message,
      });
    }
  }
}
