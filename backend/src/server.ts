import dotenv from 'dotenv';
import path from 'path';

// Load env from one level up (since we are in src/) if not in root
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath, quiet: true });

import express from 'express';
import cors from 'cors';
import { validateServerEnv } from './config/env';
import authRoutes from './modules/auth/auth.routes';
import profileRoutes from './modules/profile/profile.routes';
import chatRoutes, { chatbotApiRouter } from './modules/chat/chat.routes';
import breathingRoutes from './modules/breathing/breathing.routes';
import meditationRoutes from './modules/meditation/meditation.routes';
import educationRoutes from './modules/education/education.routes';
import audioRoutes from './modules/audio/audio.routes';
import { authenticateToken, AuthRequest } from './middleware/auth.middleware';

validateServerEnv();

const app = express();
const PORT = process.env.PORT || 3000;

// Must be before cors() — cors() swallows OPTIONS and won't call next()
app.use((req, res, next) => {
  if (req.headers['access-control-request-private-network']) {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  next();
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Existing routes
app.use('/auth', authRoutes);
app.use('/profile', authenticateToken, profileRoutes);
app.use('/chat', authenticateToken, chatRoutes);
app.use('/api/chatbot', authenticateToken, chatbotApiRouter);

// Mindfulness module routes
app.use('/api/breathing', breathingRoutes);
app.use('/api/meditation', meditationRoutes);
app.use('/api/education-contents', educationRoutes);
app.use('/api/audio-contents', audioRoutes);

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'pha-backend',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

app.get('/protected', authenticateToken, (req: AuthRequest, res) => {
    res.json({ message: 'This is a protected route', user: req.user });
});

app.get('/', (req, res) => {
    res.send('PHA Backend is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
