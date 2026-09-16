import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createUserSchema, updateUserSchema } from '../schemas/user.schema';

const router = Router();
const userController = new UserController();

// Get all users (Admin only)
router.get('/', authenticate, userController.getAll.bind(userController));

// Get user by ID
router.get('/:id', authenticate, userController.getById.bind(userController));

// Create user (Admin only)
router.post('/', authenticate, validateRequest(createUserSchema), userController.create.bind(userController));

// Update user
router.put('/:id', authenticate, validateRequest(updateUserSchema), userController.update.bind(userController));

// Delete user (Admin only)
router.delete('/:id', authenticate, userController.delete.bind(userController));

// Get users by institution
router.get('/by-institution/:institutionId', authenticate, userController.getByInstitution.bind(userController));

export default router;
