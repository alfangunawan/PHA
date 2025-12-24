import { Request, Response } from 'express';
import * as AuthService from './auth.service';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await AuthService.registerUser(email, password);
        res.status(201).json({ message: 'User registered successfully', userId: user.id });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const { token, user } = await AuthService.loginUser(email, password);
        res.json({ token, user: { id: user.id, email: user.email } });
    } catch (error: any) {
        res.status(401).json({ error: error.message });
    }
};
