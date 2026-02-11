import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'changeme_in_production';

export const registerUser = async (email: string, password: string): Promise<User> => {
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
        data: {
            email,
            passwordHash,
            profile: {
                create: {
                    displayName: email.split('@')[0],
                },
            },
        },
    });

    return user;
};

export const loginUser = async (email: string, password: string): Promise<{ token: string; user: User }> => {
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
        throw new Error('Invalid credentials');
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: '7d',
    });

    return { token, user };
};
