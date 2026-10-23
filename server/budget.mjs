import { randomUUID } from 'node:crypto';

// Reserve conservatively, then settle to provider-reported total token usage.
// One shared rolling ledger covers all IPs, instances and deployment URLs.
export const DAILY_BUDGET_UNITS = 75_000;
export const VISITOR_DAILY_BUDGET_UNITS = 50_000;
export const WINDOW_MS = 86_400_000;
export const BUDGET_SCRIPT = `
local clock = redis.call('TIME')
local now = clock[1] * 1000 + math.floor(clock[2] / 1000)
local window = tonumber(ARGV[1])
local ceiling = tonumber(ARGV[2])
local cost = tonumber(ARGV[3])
redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', now - window)
-- One-time correction of pre-settlement test reservations. The account owner
-- confirmed 8,930 total input/output tokens after this cutoff. Keep that full
-- amount until cutoff + 24h, and retain every later reservation unchanged.
local legacyCutoff = 1792236130000
local legacyBaseline = 8930
local legacy = redis.call('ZRANGEBYSCORE', KEYS[1], '-inf', legacyCutoff)
local legacyUsed = 0
for _, entry in ipairs(legacy) do
  legacyUsed = legacyUsed + tonumber(string.match(entry, '^(%d+):'))
end
if legacyUsed > legacyBaseline then
  for _, entry in ipairs(legacy) do redis.call('ZREM', KEYS[1], entry) end
  redis.call('ZADD', KEYS[1], legacyCutoff, tostring(legacyBaseline) .. ':reconciled-2026-10-17')
end
local entries = redis.call('ZRANGE', KEYS[1], 0, -1)
local used = 0
local visitorUsed = 0
for _, entry in ipairs(entries) do
  local charge = tonumber(string.match(entry, '^(%d+):'))
  used = used + charge
  if string.match(entry, ':([a-f0-9]+)$') == ARGV[5] then
    visitorUsed = visitorUsed + charge
  end
end
if used + cost > ceiling then return 0 end
if visitorUsed + cost > tonumber(ARGV[6]) then return 2 end
redis.call('ZADD', KEYS[1], now, tostring(cost) .. ':' .. ARGV[4] .. ':' .. ARGV[5])
redis.call('PEXPIRE', KEYS[1], window)
return 1
`;

export const SETTLE_SCRIPT = `
local previous = ARGV[1] .. ':' .. ARGV[3] .. ':' .. ARGV[5]
local score = redis.call('ZSCORE', KEYS[1], previous)
if not score then return 0 end
if tonumber(ARGV[2]) > tonumber(ARGV[1]) then return 0 end
redis.call('ZREM', KEYS[1], previous)
redis.call('ZADD', KEYS[1], score, ARGV[2] .. ':' .. ARGV[3] .. ':' .. ARGV[5])
redis.call('PEXPIRE', KEYS[1], ARGV[4])
return 1
`;

async function runBudgetCommand(command, { env, fetchImpl }) {
  const endpoint = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  if (!endpoint || !token) return false;
  try {
    const url = new URL(endpoint);
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.upstash.io') || url.username || url.password || url.search || url.hash) return false;
    const response = await fetchImpl(url.origin, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return false;
    const text = await response.text();
    if (text.length > 4096) return false;
    const data = JSON.parse(text);
    if (data.error || ![0, 1, 2].includes(data.result)) console.warn('Chat budget store reply unavailable');
    return data.error ? null : data.result;
  } catch { console.warn('Chat budget store unavailable'); return false; }
}

export async function reserveChatBudget(units, { env = process.env, fetchImpl = globalThis.fetch, reservationId = randomUUID(), visitorId, onDenied } = {}) {
  if (!Number.isSafeInteger(units) || units < 1 || units > VISITOR_DAILY_BUDGET_UNITS || !/^[a-f0-9-]{36}$/.test(reservationId) || !/^[a-f0-9]{64}$/.test(visitorId ?? '')) return false;
  const result = await runBudgetCommand(['EVAL', BUDGET_SCRIPT, '1', 'pyrolysis:chat:budget:v1', String(WINDOW_MS), String(DAILY_BUDGET_UNITS), String(units), reservationId, visitorId, String(VISITOR_DAILY_BUDGET_UNITS)], { env, fetchImpl });
  if (result !== 1) {
    onDenied?.(result === 2 ? 'visitor' : result === 0 ? 'shared' : 'unavailable');
    console.warn('Chat budget reservation unavailable', result === 2 ? 'visitor daily limit' : 'shared or store limit');
  }
  return result === 1;
}

export async function settleChatBudget(reserved, actual, reservationId, { env = process.env, fetchImpl = globalThis.fetch, visitorId } = {}) {
  if (!Number.isSafeInteger(reserved) || reserved < 1 || reserved > VISITOR_DAILY_BUDGET_UNITS || !Number.isSafeInteger(actual) || actual < 1 || actual > reserved || !/^[a-f0-9-]{36}$/.test(reservationId) || !/^[a-f0-9]{64}$/.test(visitorId ?? '')) return false;
  return (await runBudgetCommand(['EVAL', SETTLE_SCRIPT, '1', 'pyrolysis:chat:budget:v1', String(reserved), String(actual), reservationId, String(WINDOW_MS), visitorId], { env, fetchImpl })) === 1;
}
