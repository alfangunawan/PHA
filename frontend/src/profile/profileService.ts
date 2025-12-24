import { api } from '../auth/useAuth';

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
    const response = await api.get('/profile');
    return response.data;
};

export const updateProfile = async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const response = await api.put('/profile', data);
    return response.data;
};
