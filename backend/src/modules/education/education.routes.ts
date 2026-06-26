import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as EducationController from './education.controller';
import {
    getEducationContentsSchema,
    createEducationContentSchema,
    updateEducationContentSchema,
} from './education.schema';

const router = Router();

router.get('/', authenticateToken, validate(getEducationContentsSchema), EducationController.getAll);
router.get('/:id', authenticateToken, EducationController.getOne);
router.post('/:id/complete', authenticateToken, EducationController.complete);
router.post('/', authenticateToken, requireRole('MINDFULNESS_ADMIN', 'ADMIN'), validate(createEducationContentSchema), EducationController.create);
router.put('/:id', authenticateToken, requireRole('MINDFULNESS_ADMIN', 'ADMIN'), validate(updateEducationContentSchema), EducationController.update);
router.delete('/:id', authenticateToken, requireRole('MINDFULNESS_ADMIN', 'ADMIN'), EducationController.remove);

export default router;
