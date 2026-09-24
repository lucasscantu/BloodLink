import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { validateBody } from "../middlewares/validate";
import { loginSchema } from "../schemas";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.post("/login", validateBody(loginSchema), AuthController.login);
router.get("/me", requireAuth, AuthController.me);

export default router;
