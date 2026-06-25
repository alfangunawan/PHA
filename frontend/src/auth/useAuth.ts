import client from '../api/client';
import { saveToken, saveUser } from './storage';

export { saveToken, getToken, removeToken, saveUser, getUser, removeUser } from './storage';

export const login = async (email: string, password: string) => {
    const response = await client.post('/auth/login', { email, password });
    await saveToken(response.data.token);
    if (response.data.user) await saveUser(response.data.user);
    return response.data;
};

export const register = async (email: string, password: string, name?: string) => {
    const response = await client.post('/auth/register', { email, password, ...(name && { name }) });
    return response.data;
};
