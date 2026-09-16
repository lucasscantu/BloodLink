import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { loginSchema, registerSchema } from '../schemas/user.schema';

const router = Router();
const authController = new AuthController();

// Login
router.post('/login', validateRequest(loginSchema), authController.login.bind(authController));

// Register
router.post('/register', validateRequest(registerSchema), authController.register.bind(authController));

// Get current user
router.get('/me', authController.getCurrentUser.bind(authController));

// Logout
router.post('/logout', authController.logout.bind(authController));

export default router;
