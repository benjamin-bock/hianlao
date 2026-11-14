import { json, body, sameOrigin, getCookies, clientIp, SESSION_COOKIE } from './_lib/util.js';
import { kvEnabled, rateLimit } from './_lib/kv.js';
import { userFromToken, getProgress, saveProgress, validateProgress } from './_lib/auth.js';

async function authedUser(req) {
  if (!kvEnabled) return null;
  const token = getCookies(req)[SESSION_COOKIE];
  return userFromToken(token);
}

export default async function handler(req, res) {
  if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'forbidden' });
  if (!kvEnabled) return json(res, 503, { ok: false, error: 'backend not configured' });
  if (!(await rateLimit(`prog:${clientIp(req)}`, 60, 60))) return json(res, 429, { ok: false, error: 'too many requests' });
  const key = await authedUser(req);
  if (!key) return json(res, 401, { ok: false, error: 'not signed in' });

  if (req.method === 'GET') {
    return json(res, 200, { ok: true, progress: await getProgress(key) });
  }
  if (req.method === 'PUT') {
    const progress = await saveProgress(key, validateProgress(body(req).progress));
    return json(res, 200, { ok: true, progress });
  }
  return json(res, 405, { ok: false, error: 'method not allowed' });
}
