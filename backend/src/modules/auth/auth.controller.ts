import { Request, Response } from 'express';
import * as AuthService from './auth.service';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;
        const user = await AuthService.registerUser(email, password, name);
        res.status(201).json({ message: 'User registered successfully', userId: user.id });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const { token, user } = await AuthService.loginUser(email, password);
        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (error: any) {
        res.status(401).json({ error: error.message });
    }
};
