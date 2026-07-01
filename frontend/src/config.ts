// const DEFAULT_API_URL = 'https://api.anxietypha.my.id';
const DEFAULT_API_URL = 'http://192.168.1.110:3000';
const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/+$/, '');

// UAT testing flag. When true, testing-only affordances (e.g. the GAD-7 retake
// button on Beranda) are shown. Set to false + rebuild for the real release.
const TESTING_MODE = true;

export default {
    API_URL,
    TESTING_MODE,
};
