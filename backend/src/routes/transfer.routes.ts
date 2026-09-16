import { Router } from 'express';
import { TransferController } from '../controllers/transfer.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createTransferSchema, updateTransferSchema } from '../schemas/transfer.schema';

const router = Router();
const transferController = new TransferController();

// Get all transfers
router.get('/', authenticate, transferController.getAll.bind(transferController));

// Get transfer by ID
router.get('/:id', authenticate, transferController.getById.bind(transferController));

// Create transfer
router.post('/', authenticate, validateRequest(createTransferSchema), transferController.create.bind(transferController));

// Update transfer
router.put('/:id', authenticate, validateRequest(updateTransferSchema), transferController.update.bind(transferController));

// Delete transfer
router.delete('/:id', authenticate, transferController.delete.bind(transferController));

// Approve transfer
router.post('/:id/approve', authenticate, transferController.approve.bind(transferController));

// Reject transfer
router.post('/:id/reject', authenticate, transferController.reject.bind(transferController));

// Start transport
router.post('/:id/start-transport', authenticate, transferController.startTransport.bind(transferController));

// Receive transfer
router.post('/:id/receive', authenticate, transferController.receive.bind(transferController));

// Get transfers by my institution
router.get('/my-institution', authenticate, transferController.getByMyInstitution.bind(transferController));

// Get stats
router.get('/stats', authenticate, transferController.getStats.bind(transferController));

export default router;
