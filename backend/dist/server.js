"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const profile_routes_1 = __importDefault(require("./modules/profile/profile.routes"));
const chat_routes_1 = __importDefault(require("./modules/chat/chat.routes"));
const auth_middleware_1 = require("./middleware/auth.middleware");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/auth', auth_routes_1.default);
app.use('/profile', auth_middleware_1.authenticateToken, profile_routes_1.default);
app.use('/chat', auth_middleware_1.authenticateToken, chat_routes_1.default);
app.get('/protected', auth_middleware_1.authenticateToken, (req, res) => {
    res.json({ message: 'This is a protected route', user: req.user });
});
app.get('/', (req, res) => {
    res.send('PHA Backend is running');
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
