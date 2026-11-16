import { sameOrigin, clientIp, body, jsonError, SESSION_COOKIE, SESSION_MAX_AGE } from '../../_lib/util.ts';
import { kvEnabled, rateLimit } from '../../_lib/kv.ts';
import { validateUsername, validatePassword, getUser, createUser, createSession, getProgress, saveProgress, mergeProgress } from '../../_lib/auth.ts';

export async function POST(req: Request): Promise<Response> {
  if (!sameOrigin(req)) return jsonError(403, 'forbidden');
  if (!kvEnabled) return jsonError(503, 'backend not configured (KV env vars missing)');
  if (!(await rateLimit(`reg:${clientIp(req)}`, 10, 60))) return jsonError(429, 'too many attempts, try again later');

  const payload = await body(req);
  const { username, password, displayName, localProgress } = payload as {
    username?: unknown; password?: unknown; displayName?: unknown; localProgress?: unknown;
  };
  if (!validateUsername(username)) return jsonError(400, 'username must be 3-20 chars: letters, digits, underscore');
  if (!validatePassword(password)) return jsonError(400, 'password must be at least 8 characters');

  const key = String(username).toLowerCase();
  if (await getUser(key)) return jsonError(409, 'username already taken');

  const user = await createUser(String(username), String(password), typeof displayName === 'string' ? displayName.slice(0, 40) : '');
  const merged = mergeProgress(await getProgress(key), localProgress ?? {});
  const progress = await saveProgress(key, merged);
  const token = await createSession(key);
  const res = Response.json({ ok: true, user, progress });
  res.headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${SESSION_MAX_AGE}`,
  );
  return res;
}
