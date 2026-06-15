import axios from 'axios';
import { getToken, removeToken, removeUser } from '../auth/useAuth';
import config from '../config';

const client = axios.create({ baseURL: config.API_URL });

client.interceptors.request.use(async (cfg) => {
    const token = await getToken();
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
});

client.interceptors.response.use(
    (res) => res,
    async (error) => {
        if (error.response?.status === 401) {
            await removeToken();
            await removeUser();
        }
        return Promise.reject(error);
    }
);

export default client;
