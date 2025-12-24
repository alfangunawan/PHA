import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as AuthController from './auth.controller';
import * as ProfileController from './profile.controller';
import * as ChatController from './chat.controller';
import { authenticateToken, AuthRequest } from './auth.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


app.post('/auth/register', AuthController.register);
app.post('/auth/login', AuthController.login);
app.get('/profile', authenticateToken, ProfileController.getProfile);
app.put('/profile', authenticateToken, ProfileController.updateProfile);
app.post('/chat/send', authenticateToken, ChatController.sendMessage);
app.get('/chat/history', authenticateToken, ChatController.getHistory);

app.get('/protected', authenticateToken, (req: AuthRequest, res) => {
    res.json({ message: 'This is a protected route', user: req.user });
});

app.get('/', (req, res) => {
    res.send('PHA Backend is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
