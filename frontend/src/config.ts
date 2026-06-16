import { Platform } from 'react-native';

const API_URL =
  Platform.OS === 'web'
    ? 'http://localhost:3000'
    : (process.env.EXPO_PUBLIC_API_URL ??
       (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://192.168.18.7:3000'));

export default {
    API_URL,
};
