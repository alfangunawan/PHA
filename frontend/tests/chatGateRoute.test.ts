import assert from 'node:assert/strict';
import { resolveChatRoute } from '../src/chat/chatGateUtils';

// ChatGate routes off the value returned by refreshGad7Status(). These cases
// lock the mapping that fix relies on — especially the null fail-open path,
// since refreshGad7Status() returns null on error.

assert.equal(
    resolveChatRoute({ needsGad7: true, lastTakenAt: null }),
    'Gad7Onboarding',
    'needsGad7 true must route to the GAD-7 form',
);

assert.equal(
    resolveChatRoute({ needsGad7: false, lastTakenAt: '2026-06-27T00:00:00.000Z' }),
    'Chat',
    'needsGad7 false (form already taken) must route straight to chat',
);

assert.equal(
    resolveChatRoute(null),
    'Chat',
    'null status (fetch error) must fail open to chat, never trap user in the form',
);

assert.equal(
    resolveChatRoute(undefined),
    'Chat',
    'undefined status must fail open to chat',
);

console.log('chat gate route checks passed');
