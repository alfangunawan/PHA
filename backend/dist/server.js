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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load env from one level up (since we are in src/) if not in root
const envPath = path_1.default.resolve(__dirname, '../.env');
dotenv_1.default.config({ path: envPath, quiet: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const profile_routes_1 = __importDefault(require("./modules/profile/profile.routes"));
const chat_routes_1 = __importStar(require("./modules/chat/chat.routes"));
const breathing_routes_1 = __importDefault(require("./modules/breathing/breathing.routes"));
const meditation_routes_1 = __importDefault(require("./modules/meditation/meditation.routes"));
const education_routes_1 = __importDefault(require("./modules/education/education.routes"));
const audio_routes_1 = __importDefault(require("./modules/audio/audio.routes"));
const journal_routes_1 = __importDefault(require("./modules/journal/journal.routes"));
const gamification_routes_1 = __importDefault(require("./modules/gamification/gamification.routes"));
const games_routes_1 = __importDefault(require("./modules/games/games.routes"));
const auth_middleware_1 = require("./middleware/auth.middleware");
(0, env_1.validateServerEnv)();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Must be before cors() — cors() swallows OPTIONS and won't call next()
app.use((req, res, next) => {
    if (req.headers['access-control-request-private-network']) {
        res.setHeader('Access-Control-Allow-Private-Network', 'true');
    }
    next();
});
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Existing routes
app.use('/auth', auth_routes_1.default);
app.use('/profile', auth_middleware_1.authenticateToken, profile_routes_1.default);
app.use('/chat', auth_middleware_1.authenticateToken, chat_routes_1.default);
app.use('/api/chatbot', auth_middleware_1.authenticateToken, chat_routes_1.chatbotApiRouter);
// Mindfulness module routes
app.use('/api/breathing', breathing_routes_1.default);
app.use('/api/meditation', meditation_routes_1.default);
app.use('/api/education-contents', education_routes_1.default);
app.use('/api/audio-contents', audio_routes_1.default);
app.use('/api/journals', journal_routes_1.default);
app.use('/api/gamification', gamification_routes_1.default);
app.use('/api/games', games_routes_1.default);
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'pha-backend',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});
app.get('/protected', auth_middleware_1.authenticateToken, (req, res) => {
    res.json({ message: 'This is a protected route', user: req.user });
});
app.get('/', (req, res) => {
    res.send('PHA Backend is running');
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
