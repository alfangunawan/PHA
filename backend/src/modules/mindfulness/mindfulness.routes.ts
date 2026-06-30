import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import * as MindfulnessController from './mindfulness.controller';

const router = Router();

router.get('/recommendations', authenticateToken, MindfulnessController.getRecommendations);
router.get('/dashboard', authenticateToken, MindfulnessController.getDashboard);

export default router;
