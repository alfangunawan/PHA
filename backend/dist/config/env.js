"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJwtSecret = exports.validateServerEnv = exports.getRequiredEnv = void 0;
const REQUIRED_SERVER_ENV = ['DATABASE_URL', 'JWT_SECRET', 'GEMINI_API_KEY'];
const getRequiredEnv = (name) => {
    const value = process.env[name];
    if (!value || value.trim().length === 0) {
        throw new Error(`${name} is required`);
    }
    return value;
};
exports.getRequiredEnv = getRequiredEnv;
const validateServerEnv = () => {
    for (const name of REQUIRED_SERVER_ENV) {
        (0, exports.getRequiredEnv)(name);
    }
};
exports.validateServerEnv = validateServerEnv;
const getJwtSecret = () => (0, exports.getRequiredEnv)('JWT_SECRET');
exports.getJwtSecret = getJwtSecret;
