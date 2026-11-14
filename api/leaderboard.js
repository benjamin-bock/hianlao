import { json, sameOrigin } from './_lib/util.js';
import { kvEnabled } from './_lib/kv.js';
import { leaderboard } from './_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'method not allowed' });
  if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'forbidden' });
  if (!kvEnabled) return json(res, 200, { ok: true, kv: false, entries: [] });
  const limit = Math.min(50, Math.max(1, parseInt(req.query?.limit, 10) || 10));
  return json(res, 200, { ok: true, kv: true, entries: await leaderboard(limit) });
}
