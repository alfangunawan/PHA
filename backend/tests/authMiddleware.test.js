"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const auth_middleware_1 = require("../src/middleware/auth.middleware");
process.env.JWT_SECRET = 'test-secret';
const runMiddleware = (authorization) => {
    let statusCode = 200;
    let body;
    let nextCalled = false;
    const req = {
        headers: authorization ? { authorization } : {},
    };
    const res = {
        status(code) {
            statusCode = code;
            return this;
        },
        json(payload) {
            body = payload;
            return this;
        },
    };
    (0, auth_middleware_1.authenticateToken)(req, res, () => {
        nextCalled = true;
    });
    return { statusCode, body, nextCalled };
};
const missingToken = runMiddleware();
strict_1.default.equal(missingToken.statusCode, 401);
strict_1.default.deepEqual(missingToken.body, { error: 'Access token required' });
strict_1.default.equal(missingToken.nextCalled, false);
const invalidToken = runMiddleware('Bearer invalid-token');
strict_1.default.equal(invalidToken.statusCode, 401);
strict_1.default.deepEqual(invalidToken.body, { error: 'Invalid or expired token' });
strict_1.default.equal(invalidToken.nextCalled, false);
console.log('auth middleware checks passed');
