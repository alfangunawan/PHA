import assert from 'node:assert/strict';
import { chatbotApiRouter } from '../src/modules/chat/chat.routes';
import * as ChatController from '../src/modules/chat/chat.controller';
import * as ChatService from '../src/modules/chat/chat.service';
import { prisma } from '../src/config/prisma';

const routeStack = (chatbotApiRouter as any).stack as any[];
const latestGad7Route = routeStack.find(layer => (
    layer.route?.path === '/users/:id/gad7/latest'
    && layer.route?.methods?.get === true
));

assert.ok(latestGad7Route, 'GET /users/:id/gad7/latest route should be registered');

const run = async () => {
    let queryArgs: unknown;
    const originalGad7Result = (prisma as any).gad7Result;
    (prisma as any).gad7Result = {
        findFirst: async (args: unknown) => {
            queryArgs = args;
            return {
                score: 12,
                severity: 'sedang',
                takenAt: new Date('2026-06-25T10:00:00.000Z'),
            };
        },
    };

    const result = await (ChatService as any).getLatestGad7ForUser('user-123');

    assert.deepEqual(queryArgs, {
        where: { userId: 'user-123' },
        orderBy: { takenAt: 'desc' },
        select: {
            score: true,
            severity: true,
            takenAt: true,
        },
    });
    assert.deepEqual(result, {
        score: 12,
        severity: 'sedang',
        takenAt: new Date('2026-06-25T10:00:00.000Z'),
    });

    const originalGetLatest = (ChatService as any).getLatestGad7ForUser;
    let statusCode = 200;
    let body: unknown;
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

    (ChatService as any).getLatestGad7ForUser = async () => null;
    await ChatController.getLatestGad7ForUser({ params: { id: 'missing-user' } } as any, res as any);
    assert.equal(statusCode, 404);
    assert.deepEqual(body, { error: 'GAD-7 result not found' });

    statusCode = 200;
    body = undefined;
    (ChatService as any).getLatestGad7ForUser = async () => ({
        score: 9,
        severity: 'ringan',
        takenAt: new Date('2026-06-25T11:00:00.000Z'),
    });
    await ChatController.getLatestGad7ForUser({ params: { id: 'user-123' } } as any, res as any);
    assert.equal(statusCode, 200);
    assert.deepEqual(body, {
        score: 9,
        severity: 'ringan',
        timestamp: new Date('2026-06-25T11:00:00.000Z'),
    });

    (ChatService as any).getLatestGad7ForUser = originalGetLatest;

    (prisma as any).gad7Result = originalGad7Result;
    await prisma.$disconnect();
};

run()
    .then(() => {
        console.log('chat latest GAD-7 checks passed');
    })
    .catch(async (error) => {
        await prisma.$disconnect();
        throw error;
    });
