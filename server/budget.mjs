import { randomUUID } from 'node:crypto';

// Units conservatively reserve full UTF-8 request bytes plus capped output.
// One shared rolling ledger covers all IPs, instances and deployment URLs.
export const DAILY_BUDGET_UNITS = 50_000;
export const WINDOW_MS = 86_400_000;
export const BUDGET_SCRIPT = `
local clock = redis.call('TIME')
local now = clock[1] * 1000 + math.floor(clock[2] / 1000)
local window = tonumber(ARGV[1])
local ceiling = tonumber(ARGV[2])
local cost = tonumber(ARGV[3])
redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', now - window)
local entries = redis.call('ZRANGE', KEYS[1], 0, -1)
local used = 0
for _, entry in ipairs(entries) do
  used = used + tonumber(string.match(entry, '^(%d+):'))
end
if used + cost > ceiling then return 0 end
redis.call('ZADD', KEYS[1], now, tostring(cost) .. ':' .. ARGV[4])
redis.call('PEXPIRE', KEYS[1], window)
return 1
`;

export async function reserveChatBudget(units, { env = process.env, fetchImpl = globalThis.fetch } = {}) {
  if (!Number.isSafeInteger(units) || units < 1 || units > DAILY_BUDGET_UNITS) return false;
  const endpoint = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  if (!endpoint || !token) return false;
  try {
    const url = new URL(endpoint);
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.upstash.io') || url.username || url.password || url.search || url.hash) return false;
    const response = await fetchImpl(url.origin, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['EVAL', BUDGET_SCRIPT, '1', 'pyrolysis:chat:budget:v1', String(WINDOW_MS), String(DAILY_BUDGET_UNITS), String(units), randomUUID()]),
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return false;
    const text = await response.text();
    if (text.length > 4096) return false;
    const data = JSON.parse(text);
    return !data.error && data.result === 1;
  } catch { return false; }
}
