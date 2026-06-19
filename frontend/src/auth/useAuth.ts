import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { Platform } from 'react-native';
import config from '../config';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

const webStorage = {
    getItem: (key: string) => {
        if (typeof window !== 'undefined') return window.localStorage.getItem(key);
        return null;
    },
    setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
    },
    deleteItem: (key: string) => {
        if (typeof window !== 'undefined') window.localStorage.removeItem(key);
    },
};

export const saveToken = async (token: string) => {
    if (Platform.OS === 'web') webStorage.setItem(TOKEN_KEY, token);
    else await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getToken = async () => {
    if (Platform.OS === 'web') return webStorage.getItem(TOKEN_KEY);
    return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const removeToken = async () => {
    if (Platform.OS === 'web') webStorage.deleteItem(TOKEN_KEY);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
};

export const saveUser = async (user: object) => {
    const json = JSON.stringify(user);
    if (Platform.OS === 'web') webStorage.setItem(USER_KEY, json);
    else await SecureStore.setItemAsync(USER_KEY, json);
};

export const getUser = async () => {
    let json: string | null;
    if (Platform.OS === 'web') json = webStorage.getItem(USER_KEY);
    else json = await SecureStore.getItemAsync(USER_KEY);
    if (!json) return null;
    try { return JSON.parse(json); } catch { return null; }
};

export const removeUser = async () => {
    if (Platform.OS === 'web') webStorage.deleteItem(USER_KEY);
    else await SecureStore.deleteItemAsync(USER_KEY);
};

export const api = axios.create({ baseURL: config.API_URL });

api.interceptors.request.use(async (cfg) => {
    const token = await getToken();
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
});

export const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    await saveToken(response.data.token);
    if (response.data.user) await saveUser(response.data.user);
    return response.data;
};

export const register = async (email: string, password: string, name?: string) => {
    const response = await api.post('/auth/register', { email, password, ...(name && { name }) });
    return response.data;
};
