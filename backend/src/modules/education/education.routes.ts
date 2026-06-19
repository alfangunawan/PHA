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
router.post('/', authenticateToken, requireRole('ADMIN'), validate(createEducationContentSchema), EducationController.create);
router.put('/:id', authenticateToken, requireRole('ADMIN'), validate(updateEducationContentSchema), EducationController.update);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), EducationController.remove);

export default router;
