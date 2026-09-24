import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { DemandController } from "../controllers/DemandController";
import { TransferController } from "../controllers/TransferController";
import { InstitutionController } from "../controllers/InstitutionController";
import { UserController } from "../controllers/UserController";
import {
  AuditController,
  BlockchainController,
  DashboardController,
  TemperatureController,
} from "../controllers/MiscControllers";
import {
  acceptDemandSchema,
  createDemandSchema,
  createInstitutionSchema,
  createUserSchema,
  offerDemandSchema,
  temperatureReadingSchema,
} from "../schemas";

// ---------------- Demands ----------------
export const demandsRouter = Router();
demandsRouter.use(requireAuth);
demandsRouter.get("/", DemandController.list);
demandsRouter.post("/", requireRole("HOSPITAL", "ADMIN"), validateBody(createDemandSchema), DemandController.create);
demandsRouter.get("/:id", DemandController.getById);
demandsRouter.post("/:id/offer", requireRole("HEMOCENTRO", "HOSPITAL", "ADMIN"), validateBody(offerDemandSchema), DemandController.offer);
demandsRouter.post("/:id/accept", requireRole("HOSPITAL", "ADMIN"), validateBody(acceptDemandSchema), DemandController.accept);

// ---------------- Transfers ----------------
export const transfersRouter = Router();
transfersRouter.use(requireAuth);
transfersRouter.get("/", TransferController.list);
transfersRouter.post("/:id/receive", requireRole("HOSPITAL", "HEMOCENTRO", "ADMIN"), TransferController.receive);
transfersRouter.post("/:id/reject", requireRole("HOSPITAL", "HEMOCENTRO", "ADMIN"), TransferController.reject);

// ---------------- Institutions ----------------
export const institutionsRouter = Router();
institutionsRouter.use(requireAuth);
institutionsRouter.get("/", InstitutionController.list);
institutionsRouter.post("/", requireRole("ADMIN"), validateBody(createInstitutionSchema), InstitutionController.create);
institutionsRouter.get("/:id", InstitutionController.getById);

// ---------------- Users ----------------
export const usersRouter = Router();
usersRouter.use(requireAuth, requireRole("ADMIN"));
usersRouter.get("/", UserController.list);
usersRouter.post("/", validateBody(createUserSchema), UserController.create);

// ---------------- Dashboard ----------------
export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);
dashboardRouter.get("/", DashboardController.summary);

// ---------------- Audit ----------------
export const auditRouter = Router();
auditRouter.use(requireAuth, requireRole("ADMIN", "AUDITOR"));
auditRouter.get("/", AuditController.list);
auditRouter.get("/logs", AuditController.logs);

// ---------------- Blockchain ----------------
export const blockchainRouter = Router();
blockchainRouter.use(requireAuth);
blockchainRouter.get("/transactions", BlockchainController.transactions);
blockchainRouter.get("/verify/:id", BlockchainController.verify);
blockchainRouter.get("/network", BlockchainController.networkInfo);

// ---------------- Temperature ----------------
export const temperatureRouter = Router();
temperatureRouter.use(requireAuth);
temperatureRouter.get("/alerts", TemperatureController.alerts);
temperatureRouter.get("/:bagId", TemperatureController.history);
temperatureRouter.post("/:bagId", validateBody(temperatureReadingSchema), TemperatureController.register);
