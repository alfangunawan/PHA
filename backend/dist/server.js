"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load env from one level up (since we are in src/) if not in root
const envPath = path_1.default.resolve(__dirname, '../.env');
const result = dotenv_1.default.config({ path: envPath });
console.log('Dotenv result:', result);
console.log('GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY);
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const profile_routes_1 = __importDefault(require("./modules/profile/profile.routes"));
const chat_routes_1 = __importDefault(require("./modules/chat/chat.routes"));
const breathing_routes_1 = __importDefault(require("./modules/breathing/breathing.routes"));
const meditation_routes_1 = __importDefault(require("./modules/meditation/meditation.routes"));
const education_routes_1 = __importDefault(require("./modules/education/education.routes"));
const audio_routes_1 = __importDefault(require("./modules/audio/audio.routes"));
const auth_middleware_1 = require("./middleware/auth.middleware");
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
// Mindfulness module routes
app.use('/api/breathing', breathing_routes_1.default);
app.use('/api/meditation', meditation_routes_1.default);
app.use('/api/education-contents', education_routes_1.default);
app.use('/api/audio-contents', audio_routes_1.default);
app.get('/protected', auth_middleware_1.authenticateToken, (req, res) => {
    res.json({ message: 'This is a protected route', user: req.user });
});
app.get('/', (req, res) => {
    res.send('PHA Backend is running');
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
