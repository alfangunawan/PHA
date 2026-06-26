const DEFAULT_API_URL = 'https://api.anxietypha.my.id';
const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/+$/, '');

export default {
    API_URL,
};
