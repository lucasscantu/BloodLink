import { Router } from 'express';
import { DemandController } from '../controllers/demand.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createDemandSchema, updateDemandSchema } from '../schemas/demand.schema';

const router = Router();
const demandController = new DemandController();

// Get all demands
router.get('/', authenticate, demandController.getAll.bind(demandController));

// Get demand by ID
router.get('/:id', authenticate, demandController.getById.bind(demandController));

// Create demand
router.post('/', authenticate, validateRequest(createDemandSchema), demandController.create.bind(demandController));

// Update demand
router.put('/:id', authenticate, validateRequest(updateDemandSchema), demandController.update.bind(demandController));

// Delete demand
router.delete('/:id', authenticate, demandController.delete.bind(demandController));

// Cancel demand
router.post('/:id/cancel', authenticate, demandController.cancel.bind(demandController));

// Get demands by my institution
router.get('/my-institution', authenticate, demandController.getByMyInstitution.bind(demandController));

// Get stats
router.get('/stats', authenticate, demandController.getStats.bind(demandController));

export default router;
