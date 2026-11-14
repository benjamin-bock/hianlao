import { json, body, sameOrigin, clientIp, sessionCookie, getCookies, SESSION_COOKIE } from '../_lib/util.js';
import { kvEnabled, rateLimit } from '../_lib/kv.js';
import { validateUsername, validatePassword, getUser, createUser, createSession, getProgress, saveProgress, mergeProgress } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method not allowed' });
  if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'forbidden' });
  if (!kvEnabled) return json(res, 503, { ok: false, error: 'backend not configured (KV env vars missing)' });
  if (!(await rateLimit(`reg:${clientIp(req)}`, 10, 60))) return json(res, 429, { ok: false, error: 'too many attempts, try again later' });

  const { username, password, displayName, localProgress } = body(req);
  if (!validateUsername(username)) return json(res, 400, { ok: false, error: 'username must be 3-20 chars: letters, digits, underscore' });
  if (!validatePassword(password)) return json(res, 400, { ok: false, error: 'password must be at least 8 characters' });

  const key = String(username).toLowerCase();
  if (await getUser(key)) return json(res, 409, { ok: false, error: 'username already taken' });

  const user = await createUser(String(username), String(password), typeof displayName === 'string' ? displayName.slice(0, 40) : '');
  const merged = mergeProgress(await getProgress(key), localProgress || {});
  const progress = await saveProgress(key, merged);
  const token = await createSession(key);
  res.setHeader('Set-Cookie', sessionCookie(token));
  return json(res, 200, { ok: true, user, progress });
}
