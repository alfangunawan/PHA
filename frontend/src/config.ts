import { Platform } from 'react-native';

const API_URL =
  Platform.OS === 'web'
    ? 'http://localhost:3000'
    : (process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.110:3000');

export default {
    API_URL,
};
