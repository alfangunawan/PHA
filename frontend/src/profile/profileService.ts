import client from '../api/client';

export interface UserProfile {
    id: string;
    userId: string;
    displayName: string;
    age?: number;
    gender?: string;
    language: string;
    bio?: string;
}

export const getProfile = async (): Promise<UserProfile> => {
    const response = await client.get('/profile');
    return response.data;
};

export const updateProfile = async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const response = await client.put('/profile', data);
    return response.data;
};
