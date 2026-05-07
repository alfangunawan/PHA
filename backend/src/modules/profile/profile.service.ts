import { prisma } from '../../config/prisma';
import { UserProfile } from '@prisma/client';

export const getProfile = async (userId: string): Promise<UserProfile | null> => {
    return await prisma.userProfile.findUnique({
        where: { userId },
    });
};

export const updateProfile = async (userId: string, data: Partial<UserProfile>): Promise<UserProfile> => {
    return await prisma.userProfile.update({
        where: { userId },
        data,
    });
};
