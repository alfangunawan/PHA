import { PrismaClient, UserProfile } from '@prisma/client';

const prisma = new PrismaClient();

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
