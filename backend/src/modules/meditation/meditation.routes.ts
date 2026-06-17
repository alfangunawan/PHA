import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as MeditationController from './meditation.controller';
import { saveMeditationLogSchema, getMeditationSessionsSchema, createSessionSchema } from './meditation.schema';

const router = Router();

router.get('/sessions', authenticateToken, validate(getMeditationSessionsSchema), MeditationController.getSessions);
router.get('/sessions/:id', authenticateToken, MeditationController.getSession);
router.post('/sessions', authenticateToken, requireRole('ADMIN'), validate(createSessionSchema), MeditationController.createSession);
router.put('/sessions/:id', authenticateToken, requireRole('ADMIN'), MeditationController.updateSession2);
router.delete('/sessions/:id', authenticateToken, requireRole('ADMIN'), MeditationController.deleteSession);
router.post('/logs', authenticateToken, validate(saveMeditationLogSchema), MeditationController.saveLog);
router.get('/logs', authenticateToken, MeditationController.getHistory);

export default router;
