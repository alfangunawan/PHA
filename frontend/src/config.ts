const DEFAULT_API_URL = 'https://api.anxietypha.my.id';
// const DEFAULT_API_URL = 'http://192.168.1.110:3000';
const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/+$/, '');

export default {
    API_URL,
};
