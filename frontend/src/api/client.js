import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your local machine's IP when running on physical device
const BASE_URL = 'http://192.168.18.60:5000/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle errors gracefully
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('authUser');
    }
    return Promise.reject(error.response?.data || { message: 'Koneksi ke server gagal. Periksa koneksi internet kamu.' });
  }
);

export default apiClient;
