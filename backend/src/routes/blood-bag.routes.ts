import { Router } from 'express';
import { BloodBagController } from '../controllers/blood-bag.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createBloodBagSchema, updateBloodBagSchema } from '../schemas/blood-bag.schema';

const router = Router();
const bloodBagController = new BloodBagController();

// Get all blood bags
router.get('/', authenticate, bloodBagController.getAll.bind(bloodBagController));

// Get blood bag by ID
router.get('/:id', authenticate, bloodBagController.getById.bind(bloodBagController));

// Get blood bag by code
router.get('/by-code/:codigo', bloodBagController.getByCode.bind(bloodBagController));

// Create blood bag
router.post('/', authenticate, validateRequest(createBloodBagSchema), bloodBagController.create.bind(bloodBagController));

// Update blood bag
router.put('/:id', authenticate, validateRequest(updateBloodBagSchema), bloodBagController.update.bind(bloodBagController));

// Delete blood bag
router.delete('/:id', authenticate, bloodBagController.delete.bind(bloodBagController));

// Collect blood bag
router.post('/:id/collect', authenticate, bloodBagController.collect.bind(bloodBagController));

// Register tests
router.post('/:id/register-tests', authenticate, bloodBagController.registerTests.bind(bloodBagController));

// Approve blood bag
router.post('/:id/approve', authenticate, bloodBagController.approve.bind(bloodBagController));

// Reject blood bag
router.post('/:id/reject', authenticate, bloodBagController.reject.bind(bloodBagController));

// Store blood bag
router.post('/:id/store', authenticate, bloodBagController.store.bind(bloodBagController));

// Reserve blood bag
router.post('/:id/reserve', authenticate, bloodBagController.reserve.bind(bloodBagController));

// Use blood bag
router.post('/:id/use', authenticate, bloodBagController.use.bind(bloodBagController));

// Discard blood bag
router.post('/:id/discard', authenticate, bloodBagController.discard.bind(bloodBagController));

// Get history
router.get('/:id/history', authenticate, bloodBagController.getHistory.bind(bloodBagController));

// Get QR Code
router.get('/:id/qrcode', authenticate, bloodBagController.getQRCode.bind(bloodBagController));

// Get stats
router.get('/stats', authenticate, bloodBagController.getStats.bind(bloodBagController));

// Search compatible bags for demand
router.get('/compatible/:demandId', authenticate, bloodBagController.searchCompatible.bind(bloodBagController));

export default router;
