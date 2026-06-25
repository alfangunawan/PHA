import assert from 'node:assert/strict';
import { isInvalidAuthError } from '../src/api/authError';

assert.equal(
    isInvalidAuthError({ response: { status: 401, data: { error: 'Access token required' } } }),
    true,
    '401 responses should invalidate the local auth session',
);

assert.equal(
    isInvalidAuthError({ response: { status: 403, data: { error: 'Invalid or expired token' } } }),
    true,
    'backend 403 invalid-token responses should invalidate the local auth session',
);

assert.equal(
    isInvalidAuthError({ response: { status: 403, data: { error: 'Forbidden: insufficient role' } } }),
    false,
    'role-based 403 responses should not clear a valid non-admin session',
);

assert.equal(
    isInvalidAuthError('{"error":"Invalid or expired token"}'),
    true,
    'SSE error payloads should invalidate the local auth session',
);

console.log('auth error checks passed');
