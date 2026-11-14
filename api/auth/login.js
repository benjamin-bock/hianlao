import { json, body, sameOrigin, clientIp, sessionCookie } from '../_lib/util.js';
import { kvEnabled, rateLimit } from '../_lib/kv.js';
import { validateUsername, validatePassword, getUser, verifyPassword, createSession, getProgress, saveProgress, mergeProgress } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method not allowed' });
  if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'forbidden' });
  if (!kvEnabled) return json(res, 503, { ok: false, error: 'backend not configured (KV env vars missing)' });
  if (!(await rateLimit(`login:${clientIp(req)}`, 20, 60))) return json(res, 429, { ok: false, error: 'too many attempts, try again later' });

  const { username, password, localProgress } = body(req);
  if (!validateUsername(username) || !validatePassword(password)) {
    return json(res, 400, { ok: false, error: 'invalid username or password' });
  }
  const key = String(username).toLowerCase();
  const user = await getUser(key);
  if (!user || !verifyPassword(String(password), user.hash)) {
    return json(res, 401, { ok: false, error: 'wrong username or password' });
  }
  const merged = mergeProgress(await getProgress(key), localProgress || {});
  const progress = await saveProgress(key, merged);
  const token = await createSession(key);
  res.setHeader('Set-Cookie', sessionCookie(token));
  return json(res, 200, {
    ok: true,
    user: { username: user.username, displayName: user.displayName, createdAt: user.createdAt },
    progress,
  });
}
