const REQUIRED_SERVER_ENV = ['DATABASE_URL', 'JWT_SECRET', 'GEMINI_API_KEY'] as const;

type RequiredServerEnv = (typeof REQUIRED_SERVER_ENV)[number];

export const getRequiredEnv = (name: RequiredServerEnv): string => {
    const value = process.env[name];
    if (!value || value.trim().length === 0) {
        throw new Error(`${name} is required`);
    }
    return value;
};

export const validateServerEnv = () => {
    for (const name of REQUIRED_SERVER_ENV) {
        getRequiredEnv(name);
    }
};

export const getJwtSecret = () => getRequiredEnv('JWT_SECRET');
