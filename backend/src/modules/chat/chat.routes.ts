import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { sendMessageSchema, getSessionMessagesSchema, getLatestGad7Schema, submitGad7Schema } from './chat.schema';
import * as ChatController from './chat.controller';

const router = Router();
export const chatbotApiRouter = Router();

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

// GAD-7 status check — returns { needsGad7, lastTakenAt }
router.get('/gad7/status', ChatController.checkGad7Status);

// GAD-7 assessment submission (forwards to n8n pha-gad7-submit webhook)
router.post('/gad7/submit', validate(submitGad7Schema), ChatController.submitGad7);

// Read-only GAD-7 result API
chatbotApiRouter.get('/users/:id/gad7/latest', validate(getLatestGad7Schema), ChatController.getLatestGad7ForUser);

export default router;
