import { User } from '@prisma/client';
import { prisma } from '../../config/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../../config/env';

const SALT_ROUNDS = 10;

export const registerUser = async (email: string, password: string, name?: string): Promise<User> => {
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
                    displayName: name || email.split('@')[0],
                },
            },
        },
    });

    return user;
};

export const loginUser = async (email: string, password: string): Promise<{ token: string; user: User & { profile: { displayName: string } | null } }> => {
    const user = await prisma.user.findUnique({
        where: { email },
        include: { profile: { select: { displayName: true } } },
    });

    if (!user) {
        throw new Error('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
        throw new Error('Wrong password');
    }

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, getJwtSecret(), {
        expiresIn: '7d',
    });

    return { token, user };
};
