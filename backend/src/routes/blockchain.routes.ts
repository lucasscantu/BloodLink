import { Router } from 'express';
import { BlockchainController } from '../controllers/blockchain.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const blockchainController = new BlockchainController();

// Get blockchain info
router.get('/info', blockchainController.getInfo.bind(blockchainController));

// Get bag info from blockchain
router.get('/bag/:bagId', blockchainController.getBagInfo.bind(blockchainController));

// Verify bag on blockchain
router.get('/verify/:bagId', blockchainController.verifyBag.bind(blockchainController));

export default router;
