import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const dashboardController = new DashboardController();

// Get dashboard stats
router.get('/stats', authenticate, dashboardController.getStats.bind(dashboardController));

// Get network map
router.get('/network-map', authenticate, dashboardController.getNetworkMap.bind(dashboardController));

// Get recent activity
router.get('/recent-activity', authenticate, dashboardController.getRecentActivity.bind(dashboardController));

export default router;
