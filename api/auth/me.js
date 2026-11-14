import { json, sameOrigin, getCookies, SESSION_COOKIE } from '../_lib/util.js';
import { kvEnabled } from '../_lib/kv.js';
import { userFromToken, getUser, getProgress } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'method not allowed' });
  if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'forbidden' });
  if (!kvEnabled) return json(res, 200, { ok: true, user: null, progress: null, kv: false });
  const token = getCookies(req)[SESSION_COOKIE];
  const key = await userFromToken(token);
  if (!key) return json(res, 200, { ok: true, user: null, progress: null, kv: true });
  const user = await getUser(key);
  if (!user) return json(res, 200, { ok: true, user: null, progress: null, kv: true });
  const progress = await getProgress(key);
  return json(res, 200, {
    ok: true,
    kv: true,
    user: { username: user.username, displayName: user.displayName, createdAt: user.createdAt },
    progress,
  });
}
