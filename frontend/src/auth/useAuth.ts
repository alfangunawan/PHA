import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { Platform } from 'react-native';
import config from '../config';

const TOKEN_KEY = 'auth_token';

// Web fallback using localStorage
const webStorage = {
    getItem: (key: string) => {
        if (typeof window !== 'undefined') {
            return window.localStorage.getItem(key);
        }
        return null;
    },
    setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, value);
        }
    },
    deleteItem: (key: string) => {
        if (typeof window !== 'undefined') {
            window.localStorage.removeItem(key);
        }
    },
};

export const saveToken = async (token: string) => {
    if (Platform.OS === 'web') {
        webStorage.setItem(TOKEN_KEY, token);
    } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
};

export const getToken = async () => {
    if (Platform.OS === 'web') {
        return webStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const removeToken = async () => {
    if (Platform.OS === 'web') {
        webStorage.deleteItem(TOKEN_KEY);
    } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
};

export const api = axios.create({
    baseURL: config.API_URL,
});

api.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    await saveToken(response.data.token);
    return response.data;
};

export const register = async (email: string, password: string) => {
    const response = await api.post('/auth/register', { email, password });
    return response.data;
};
