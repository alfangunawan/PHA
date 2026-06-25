"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatbotApiRouter = void 0;
const express_1 = require("express");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const chat_schema_1 = require("./chat.schema");
const ChatController = __importStar(require("./chat.controller"));
const router = (0, express_1.Router)();
exports.chatbotApiRouter = (0, express_1.Router)();
// Send a chat message (through n8n)
router.post('/send', (0, validate_middleware_1.validate)(chat_schema_1.sendMessageSchema), ChatController.sendMessage);
// Stream a chat message via SSE (through n8n, simulated stream)
router.post('/stream', (0, validate_middleware_1.validate)(chat_schema_1.sendMessageSchema), ChatController.streamMessage);
// Conversation history (queries n8n's conversations table)
router.get('/history', ChatController.getHistory);
// Session management
router.get('/sessions', ChatController.getSessions);
router.get('/sessions/:sessionId', (0, validate_middleware_1.validate)(chat_schema_1.getSessionMessagesSchema), ChatController.getSessionMessages);
router.post('/sessions/new', ChatController.createNewSession);
// GAD-7 assessment submission (forwards to n8n pha-gad7-submit webhook)
router.post('/gad7/submit', (0, validate_middleware_1.validate)(chat_schema_1.submitGad7Schema), ChatController.submitGad7);
// Read-only GAD-7 result API
exports.chatbotApiRouter.get('/users/:id/gad7/latest', (0, validate_middleware_1.validate)(chat_schema_1.getLatestGad7Schema), ChatController.getLatestGad7ForUser);
exports.default = router;
