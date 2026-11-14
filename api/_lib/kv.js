// Minimal Upstash Redis (Vercel KV) REST client.
// Env vars (set in Vercel project settings, e.g. auto-injected by the Upstash integration):
//   KV_REST_API_URL, KV_REST_API_TOKEN
// When unset, kvEnabled=false and the API runs in "local-only" mode (401 for auth,
// empty leaderboard) so the static site keeps working without any backend.

const URL_ = process.env.KV_REST_API_URL;
const TOKEN = process.env.KV_REST_API_TOKEN;

export const kvEnabled = Boolean(URL_ && TOKEN);

export async function kv(...args) {
  if (!kvEnabled) return null;
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error(`kv error ${r.status}`);
  const j = await r.json();
  if (j.error) throw new Error(`kv: ${j.error}`);
  return j.result ?? null;
}

export async function kvPipeline(commands) {
  if (!kvEnabled) return commands.map(() => null);
  const r = await fetch(`${URL_}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!r.ok) throw new Error(`kv pipeline error ${r.status}`);
  const j = await r.json();
  return (j || []).map(x => (x && x.error ? null : x?.result ?? null));
}

// Simple fixed-window rate limit: `limit` calls per `windowSec` per key.
export async function rateLimit(key, limit = 20, windowSec = 60) {
  if (!kvEnabled) return true; // no backend -> nothing to limit against
  const k = `rl:${key}`;
  const [n] = await kvPipeline([['INCR', k], ['EXPIRE', k, String(windowSec), 'NX']]);
  return Number(n) <= limit;
}
