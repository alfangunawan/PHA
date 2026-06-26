import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as GamificationController from './gamification.controller';
import { updateRewardRuleSchema } from './gamification.schema';

const router = Router();
const canManageGamification = requireRole('GAMIFICATION_ADMIN', 'ADMIN');

router.get('/me', authenticateToken, GamificationController.getMe);
router.get('/rules', authenticateToken, canManageGamification, GamificationController.getRules);
router.put('/rules/:activityType', authenticateToken, canManageGamification, validate(updateRewardRuleSchema), GamificationController.updateRule);

export default router;
