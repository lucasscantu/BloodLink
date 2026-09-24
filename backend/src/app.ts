import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.routes";
import bloodBagsRoutes from "./routes/bloodbags.routes";
import {
  auditRouter,
  blockchainRouter,
  dashboardRouter,
  demandsRouter,
  institutionsRouter,
  temperatureRouter,
  transfersRouter,
  usersRouter,
} from "./routes/other.routes";
import { errorHandler } from "./middlewares/validate";

/**
 * Monta a aplicação Express sem iniciar o servidor HTTP.
 * Separado de index.ts para que testes de integração (supertest) possam
 * importar `app` diretamente, sem abrir uma porta de rede de verdade.
 */
export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
  app.use(express.json());

  const limiter = rateLimit({ windowMs: 60 * 1000, limit: 300 });
  app.use("/api", limiter);

  app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "bloodlink-backend" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/blood-bags", bloodBagsRoutes);
  app.use("/api/demands", demandsRouter);
  app.use("/api/transfers", transfersRouter);
  app.use("/api/institutions", institutionsRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/audit", auditRouter);
  app.use("/api/blockchain", blockchainRouter);
  app.use("/api/temperature", temperatureRouter);

  app.use(errorHandler);

  return app;
}
