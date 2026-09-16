import { Router } from 'express';
import { TemperatureController } from '../controllers/temperature.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createTemperatureSchema } from '../schemas/temperature.schema';

const router = Router();
const temperatureController = new TemperatureController();

// Get all temperature readings for a bag
router.get('/:bagId', authenticate, temperatureController.getAll.bind(temperatureController));

// Create temperature reading
router.post('/:bagId', authenticate, validateRequest(createTemperatureSchema), temperatureController.create.bind(temperatureController));

// Simulate temperature readings
router.post('/:bagId/simulate', authenticate, temperatureController.simulate.bind(temperatureController));

// Get alerts
router.get('/alerts', authenticate, temperatureController.getAlerts.bind(temperatureController));

// Configure temperature thresholds
router.post('/configure', authenticate, temperatureController.configureThresholds.bind(temperatureController));

export default router;
