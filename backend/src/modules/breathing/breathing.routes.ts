import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as BreathingController from './breathing.controller';
import { saveBreathingLogSchema, createTechniqueSchema } from './breathing.schema';

const router = Router();

router.get('/techniques', authenticateToken, BreathingController.getAll);
router.get('/techniques/:id', authenticateToken, BreathingController.getOne);
router.post('/techniques', authenticateToken, requireRole('ADMIN'), validate(createTechniqueSchema), BreathingController.create);
router.put('/techniques/:id', authenticateToken, requireRole('ADMIN'), BreathingController.update);
router.delete('/techniques/:id', authenticateToken, requireRole('ADMIN'), BreathingController.remove);
router.post('/logs', authenticateToken, validate(saveBreathingLogSchema), BreathingController.saveLog);
router.get('/logs', authenticateToken, BreathingController.getHistory);

export default router;
