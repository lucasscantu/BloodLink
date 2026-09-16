import { Router } from 'express';
import { InstitutionController } from '../controllers/institution.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createInstitutionSchema, updateInstitutionSchema } from '../schemas/institution.schema';

const router = Router();
const institutionController = new InstitutionController();

// Get all institutions
router.get('/', institutionController.getAll.bind(institutionController));

// Get institution by ID
router.get('/:id', institutionController.getById.bind(institutionController));

// Create institution (Admin only)
router.post('/', authenticate, validateRequest(createInstitutionSchema), institutionController.create.bind(institutionController));

// Update institution (Admin only)
router.put('/:id', authenticate, validateRequest(updateInstitutionSchema), institutionController.update.bind(institutionController));

// Delete institution (Admin only)
router.delete('/:id', authenticate, institutionController.delete.bind(institutionController));

// Get institution stats
router.get('/stats', institutionController.getStats.bind(institutionController));

export default router;
