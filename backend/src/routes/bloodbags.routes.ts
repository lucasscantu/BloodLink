import { Router } from "express";
import { BloodBagController } from "../controllers/BloodBagController";
import { requireAuth, requireRole } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { createBloodBagSchema, rejectBagSchema } from "../schemas";

const router = Router();

router.use(requireAuth);

router.get("/", BloodBagController.list);
router.post("/", requireRole("HEMOCENTRO", "ADMIN"), validateBody(createBloodBagSchema), BloodBagController.create);
router.get("/:id", BloodBagController.getById);
router.get("/:id/history", BloodBagController.history);
router.get("/:id/verify", BloodBagController.verifyIntegrity);

router.post("/:id/approve", requireRole("HEMOCENTRO", "ADMIN"), BloodBagController.approve);
router.post("/:id/reject", requireRole("HEMOCENTRO", "ADMIN"), validateBody(rejectBagSchema), BloodBagController.reject);
router.post("/:id/use", requireRole("HOSPITAL", "ADMIN"), BloodBagController.use);
router.post("/:id/discard", requireRole("HOSPITAL", "HEMOCENTRO", "ADMIN"), validateBody(rejectBagSchema), BloodBagController.discard);

export default router;
