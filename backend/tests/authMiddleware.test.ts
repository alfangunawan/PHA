import assert from 'node:assert/strict';
import { authenticateToken } from '../src/middleware/auth.middleware';

process.env.JWT_SECRET = 'test-secret';

const runMiddleware = (authorization?: string) => {
    let statusCode = 200;
    let body: unknown;
    let nextCalled = false;

    const req = {
        headers: authorization ? { authorization } : {},
    };
    const res = {
        status(code: number) {
            statusCode = code;
            return this;
        },
        json(payload: unknown) {
            body = payload;
            return this;
        },
    };

    authenticateToken(req as any, res as any, () => {
        nextCalled = true;
    });

    return { statusCode, body, nextCalled };
};

const missingToken = runMiddleware();
assert.equal(missingToken.statusCode, 401);
assert.deepEqual(missingToken.body, { error: 'Access token required' });
assert.equal(missingToken.nextCalled, false);

const invalidToken = runMiddleware('Bearer invalid-token');
assert.equal(invalidToken.statusCode, 401);
assert.deepEqual(invalidToken.body, { error: 'Invalid or expired token' });
assert.equal(invalidToken.nextCalled, false);

console.log('auth middleware checks passed');
