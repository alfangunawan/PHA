import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as JournalController from './journal.controller';
import { createJournalSchema, journalIdParamSchema, updateJournalSchema } from './journal.schema';

const router = Router();

router.get('/', authenticateToken, JournalController.getEntries);
router.get('/:id', authenticateToken, validate(journalIdParamSchema), JournalController.getEntry);
router.post('/', authenticateToken, validate(createJournalSchema), JournalController.createEntry);
router.put('/:id', authenticateToken, validate(updateJournalSchema), JournalController.updateEntry);
router.delete('/:id', authenticateToken, validate(journalIdParamSchema), JournalController.deleteEntry);

export default router;
