import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import institutionRoutes from './routes/institution.routes';
import bloodBagRoutes from './routes/blood-bag.routes';
import demandRoutes from './routes/demand.routes';
import transferRoutes from './routes/transfer.routes';
import eventRoutes from './routes/event.routes';
import blockchainRoutes from './routes/blockchain.routes';
import dashboardRoutes from './routes/dashboard.routes';
import temperatureRoutes from './routes/temperature.routes';

// Import middleware
import errorHandler from './middleware/error.middleware';
import notFoundHandler from './middleware/not-found.middleware';

export function createApp() {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: config.frontend.url,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Logging
  app.use(morgan('dev'));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'hospitalchain-api',
    });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/institutions', institutionRoutes);
  app.use('/api/blood-bags', bloodBagRoutes);
  app.use('/api/demands', demandRoutes);
  app.use('/api/transfers', transferRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/blockchain', blockchainRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/temperature', temperatureRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
}

export type App = ReturnType<typeof createApp>;
