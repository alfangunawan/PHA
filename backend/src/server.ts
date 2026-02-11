import dotenv from 'dotenv';
import path from 'path';

// Load env from one level up (since we are in src/) if not in root
const envPath = path.resolve(__dirname, '../.env');
const result = dotenv.config({ path: envPath });

console.log('Dotenv result:', result);
console.log('GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY);
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);

import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes';
import profileRoutes from './modules/profile/profile.routes';
import chatRoutes from './modules/chat/chat.routes';
import { authenticateToken, AuthRequest } from './middleware/auth.middleware';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/profile', authenticateToken, profileRoutes);
app.use('/chat', authenticateToken, chatRoutes);

app.get('/protected', authenticateToken, (req: AuthRequest, res) => {
    res.json({ message: 'This is a protected route', user: req.user });
});

app.get('/', (req, res) => {
    res.send('PHA Backend is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
