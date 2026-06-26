import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import upload from '../../middleware/upload.middleware';
import * as AudioController from './audio.controller';

const router = Router();

router.get('/available', authenticateToken, AudioController.getAll);
router.post('/:id/complete', authenticateToken, AudioController.complete);
router.get('/', authenticateToken, requireRole('MINDFULNESS_ADMIN', 'ADMIN'), AudioController.getAll);
router.post('/', authenticateToken, requireRole('MINDFULNESS_ADMIN', 'ADMIN'), upload.single('audio'), AudioController.create);
router.delete('/:id', authenticateToken, requireRole('MINDFULNESS_ADMIN', 'ADMIN'), AudioController.remove);

export default router;
