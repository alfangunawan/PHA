import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import upload from '../../middleware/upload.middleware';
import * as AudioController from './audio.controller';
import { saveAudioLogSchema } from './audio.schema';

const router = Router();

// User routes
router.get('/available', authenticateToken, AudioController.getAll);
router.get('/logs', authenticateToken, AudioController.getHistory);
router.get('/:id', authenticateToken, AudioController.getOne);
router.post('/logs', authenticateToken, validate(saveAudioLogSchema), AudioController.saveLog);

// Admin routes
router.get('/', authenticateToken, requireRole('MINDFULNESS_ADMIN', 'ADMIN'), AudioController.getAll);
router.post('/', authenticateToken, requireRole('MINDFULNESS_ADMIN', 'ADMIN'), upload.single('audio'), AudioController.create);
router.delete('/:id', authenticateToken, requireRole('MINDFULNESS_ADMIN', 'ADMIN'), AudioController.remove);

export default router;
