import { json, sameOrigin, getCookies, clearSessionCookie, SESSION_COOKIE } from '../_lib/util.js';
import { destroySession } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method not allowed' });
  if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'forbidden' });
  const token = getCookies(req)[SESSION_COOKIE];
  await destroySession(token);
  res.setHeader('Set-Cookie', clearSessionCookie());
  return json(res, 200, { ok: true });
}
