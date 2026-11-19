// Minimal Upstash Redis (Vercel KV) REST client — server-side only.
// Env vars (auto-injected when the Upstash storage is connected to Vercel):
//   Vercel KV style:        KV_REST_API_URL, KV_REST_API_TOKEN
//   Upstash-native style:   UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
// When unset, kvEnabled=false and the API runs in "local-only" mode
// (401 for auth, empty leaderboard) so the site keeps working without a backend.
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export const kvEnabled = Boolean(URL_ && TOKEN);

type KvArg = string | number;

export async function kv(...args: KvArg[]): Promise<string | null> {
  if (!kvEnabled) return null;
  const r = await fetch(URL_!, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error(`kv error ${r.status}`);
  const j = (await r.json()) as { error?: string; result?: unknown };
  if (j.error) throw new Error(`kv: ${j.error}`);
  return (j.result ?? null) as string | null;
}

export async function kvPipeline(commands: KvArg[][]): Promise<Array<unknown | null>> {
  if (!kvEnabled) return commands.map(() => null);
  const r = await fetch(`${URL_}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!r.ok) throw new Error(`kv pipeline error ${r.status}`);
  const j = (await r.json()) as Array<{ error?: string; result?: unknown } | null>;
  return (j || []).map((x) => (x && x.error ? null : x?.result ?? null));
}

// Simple fixed-window rate limit: `limit` calls per `windowSec` per key.
export async function rateLimit(key: string, limit = 20, windowSec = 60): Promise<boolean> {
  if (!kvEnabled) return true; // no backend -> nothing to limit against
  const k = `rl:${key}`;
  const [n] = await kvPipeline([['INCR', k], ['EXPIRE', k, String(windowSec), 'NX']]);
  return Number(n) <= limit;
}
