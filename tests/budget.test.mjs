import test from 'node:test';
import assert from 'node:assert/strict';
import { reserveChatBudget, DAILY_BUDGET_UNITS, WINDOW_MS, BUDGET_SCRIPT } from '../server/budget.mjs';
const env = { KV_REST_API_URL: 'https://test-budget.upstash.io', KV_REST_API_TOKEN: 'test-only-budget-token' };

test('reserves once through the shared atomic rolling ledger without visitor text', async () => {
  let command;
  const allowed = await reserveChatBudget(6000, { env, fetchImpl: async (url, init) => {
    assert.equal(url, env.KV_REST_API_URL);
    assert.equal(init.headers.Authorization, `Bearer ${env.KV_REST_API_TOKEN}`);
    command = JSON.parse(init.body);
    return Response.json({ result: 1 });
  } });
  assert.equal(allowed, true);
  assert.deepEqual(command.slice(0, 7), ['EVAL', BUDGET_SCRIPT, '1', 'pyrolysis:chat:budget:v1', String(WINDOW_MS), String(DAILY_BUDGET_UNITS), '6000']);
  assert.match(command[7], /^[a-f0-9-]{36}$/);
});

test('quota denial, missing config and store errors cannot enable a model call', async () => {
  for (const reply of [Response.json({ result: 0 }), Response.json({ error: 'Quota store error' }), new Response('bad JSON'), new Response('unavailable', { status: 500 })]) {
    assert.equal(await reserveChatBudget(6000, { env, fetchImpl: async () => reply }), false);
  }
  assert.equal(await reserveChatBudget(6000, { env: {} }), false);
  assert.equal(await reserveChatBudget(6000, { env, fetchImpl: async () => { throw new Error('offline'); } }), false);
});

test('rejects invalid reservations and untrusted storage endpoints', async () => {
  for (const units of [0, -1, 1.5, NaN, 50001]) assert.equal(await reserveChatBudget(units, { env, fetchImpl: () => assert.fail() }), false);
  for (const url of ['http://test.upstash.io', 'https://attacker.example', 'https://test.upstash.io?redirect=x', 'https://user:password@test.upstash.io']) {
    assert.equal(await reserveChatBudget(6000, { env: { ...env, KV_REST_API_URL: url }, fetchImpl: () => assert.fail() }), false);
  }
});
