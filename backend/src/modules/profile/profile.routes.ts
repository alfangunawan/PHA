import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { updateProfileSchema } from './profile.schema';
import * as ProfileController from './profile.controller';

const router = Router();

router.get('/', ProfileController.getProfile);
router.put('/', validate(updateProfileSchema), ProfileController.updateProfile);

export default router;
