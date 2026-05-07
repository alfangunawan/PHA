import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { sendMessageSchema, getSessionMessagesSchema, submitGad7Schema } from './chat.schema';
import * as ChatController from './chat.controller';

const router = Router();

// Send a chat message (through n8n)
router.post('/send', validate(sendMessageSchema), ChatController.sendMessage);

// Stream a chat message via SSE (through n8n, simulated stream)
router.post('/stream', validate(sendMessageSchema), ChatController.streamMessage);

// Conversation history (queries n8n's conversations table)
router.get('/history', ChatController.getHistory);

// Session management
router.get('/sessions', ChatController.getSessions);
router.get('/sessions/:sessionId', validate(getSessionMessagesSchema), ChatController.getSessionMessages);
router.post('/sessions/new', ChatController.createNewSession);

// GAD-7 assessment submission (forwards to n8n pha-gad7-submit webhook)
router.post('/gad7/submit', validate(submitGad7Schema), ChatController.submitGad7);

export default router;
