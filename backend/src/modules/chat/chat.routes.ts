import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { sendMessageSchema, getSessionMessagesSchema } from './chat.schema';
import * as ChatController from './chat.controller';

const router = Router();

router.post('/send', validate(sendMessageSchema), ChatController.sendMessage);
router.post('/stream', validate(sendMessageSchema), ChatController.streamMessage);
router.get('/history', ChatController.getHistory);
router.get('/sessions', ChatController.getSessions);
router.get('/sessions/:sessionId', validate(getSessionMessagesSchema), ChatController.getSessionMessages);
router.post('/sessions/new', ChatController.createNewSession);

export default router;
