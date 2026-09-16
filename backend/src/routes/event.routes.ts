import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const eventController = new EventController();

// Get all events
router.get('/', authenticate, eventController.getAll.bind(eventController));

// Get event by ID
router.get('/:id', authenticate, eventController.getById.bind(eventController));

// Verify event integrity
router.get('/:id/verify', authenticate, eventController.verify.bind(eventController));

// Verify bag history
router.get('/verify-bag/:bagId', authenticate, eventController.verifyBagHistory.bind(eventController));

export default router;
