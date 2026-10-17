import test from 'node:test';
import assert from 'node:assert/strict';
import { reserveChatBudget, DAILY_BUDGET_UNITS, WINDOW_MS, BUDGET_SCRIPT, SETTLE_SCRIPT, settleChatBudget, VISITOR_DAILY_BUDGET_UNITS } from '../server/budget.mjs';
const visitorId = 'a'.repeat(64);
const env = { KV_REST_API_URL: 'https://test-budget.upstash.io', KV_REST_API_TOKEN: 'test-only-budget-token' };

test('reserves once through the shared atomic rolling ledger without visitor text', async () => {
  let command;
  const allowed = await reserveChatBudget(6000, { env, visitorId, fetchImpl: async (url, init) => {
    assert.equal(url, env.KV_REST_API_URL);
    assert.equal(init.headers.Authorization, `Bearer ${env.KV_REST_API_TOKEN}`);
    command = JSON.parse(init.body);
    return Response.json({ result: 1 });
  } });
  assert.equal(allowed, true);
  assert.deepEqual(command.slice(0, 7), ['EVAL', BUDGET_SCRIPT, '1', 'pyrolysis:chat:budget:v1', String(WINDOW_MS), String(DAILY_BUDGET_UNITS), '6000']);
  assert.match(command[7], /^[a-f0-9-]{36}$/);
  assert.equal(command[8], visitorId);
  assert.equal(command[9], String(VISITOR_DAILY_BUDGET_UNITS));
});

test('quota denial, missing config and store errors cannot enable a model call', async () => {
  for (const reply of [Response.json({ result: 0 }), Response.json({ error: 'Quota store error' }), new Response('bad JSON'), new Response('unavailable', { status: 500 })]) {
    assert.equal(await reserveChatBudget(6000, { env, visitorId, fetchImpl: async () => reply }), false);
  }
  assert.equal(await reserveChatBudget(6000, { env: {}, visitorId }), false);
  assert.equal(await reserveChatBudget(6000, { env, visitorId, fetchImpl: async () => { throw new Error('offline'); } }), false);
});

test('rejects invalid reservations and untrusted storage endpoints', async () => {
  for (const units of [0, -1, 1.5, NaN, DAILY_BUDGET_UNITS + 1]) assert.equal(await reserveChatBudget(units, { env, visitorId, fetchImpl: () => assert.fail() }), false);
  for (const url of ['http://test.upstash.io', 'https://attacker.example', 'https://test.upstash.io?redirect=x', 'https://user:password@test.upstash.io']) {
    assert.equal(await reserveChatBudget(6000, { env: { ...env, KV_REST_API_URL: url }, visitorId, fetchImpl: () => assert.fail() }), false);
  }
});


test('settlement can only reduce an existing reservation and keeps its timestamp', async () => {
  const id = '00000000-0000-0000-0000-000000000001';
  let command;
  assert.equal(await settleChatBudget(6000, 1500, id, { env, visitorId, fetchImpl: async (url, init) => {
    command = JSON.parse(init.body);
    return Response.json({ result: 1 });
  } }), true);
  assert.deepEqual(command, ['EVAL', SETTLE_SCRIPT, '1', 'pyrolysis:chat:budget:v1', '6000', '1500', id, String(WINDOW_MS), visitorId]);
  assert.match(SETTLE_SCRIPT, /if not score then return 0 end/);
  assert.match(SETTLE_SCRIPT, /'PEXPIRE'/);
  assert.match(SETTLE_SCRIPT, /'ZADD', KEYS\[1\], score/);
  for (const actual of [0,-1,6001,NaN,1.5]) {
    assert.equal(await settleChatBudget(6000, actual, id, { env, visitorId, fetchImpl: () => assert.fail('Invalid refund must not touch the store') }), false);
  }
  assert.equal(await settleChatBudget(6000, 1500, id, { env, visitorId, fetchImpl: async () => Response.json({ result: 0 }) }), false);
  assert.equal(await settleChatBudget(6000, 1500, id, { env, visitorId, fetchImpl: async () => { throw new Error('offline'); } }), false);
});


test('visitor quota denial and missing identity cannot permit a model request', async () => {
  let denied;
  assert.equal(await reserveChatBudget(6000, { env, visitorId, onDenied: reason => { denied = reason; }, fetchImpl: async () => Response.json({ result: 2 }) }), false);
  assert.equal(denied, 'visitor');
  for (const visitorId of [undefined, '', '192.0.2.10', 'x'.repeat(64)]) {
    assert.equal(await reserveChatBudget(6000, { env, visitorId, fetchImpl: () => assert.fail('Identity must be server verified') }), false);
  }
  assert.equal(VISITOR_DAILY_BUDGET_UNITS, 20000);
  assert.match(BUDGET_SCRIPT, /visitorUsed \+ cost > tonumber\(ARGV\[6\]\)/);
  assert.match(BUDGET_SCRIPT, /if used \+ cost > ceiling then return 0 end/);
});
