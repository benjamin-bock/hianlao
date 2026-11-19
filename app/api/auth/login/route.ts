import { sameOrigin, clientIp, body, jsonError, SESSION_COOKIE, SESSION_MAX_AGE } from '../../_lib/util.ts';
import { kvEnabled, rateLimit } from '../../_lib/kv.ts';
import { validateUsername, validatePassword, getUser, verifyPassword, createSession, getProgress, saveProgress, mergeProgress } from '../../_lib/auth.ts';

export async function POST(req: Request): Promise<Response> {
  if (!sameOrigin(req)) return jsonError(403, 'forbidden');
  if (!kvEnabled) return jsonError(503, 'backend not configured (KV env vars missing)');
  if (!(await rateLimit(`login:${clientIp(req)}`, 20, 60))) return jsonError(429, 'too many attempts, try again later');

  const payload = await body(req);
  const { username, password, localProgress } = payload as {
    username?: unknown; password?: unknown; localProgress?: unknown;
  };
  if (!validateUsername(username) || !validatePassword(password)) {
    return jsonError(400, 'invalid username or password');
  }
  const key = String(username).toLowerCase();
  const user = await getUser(key);
  if (!user || !verifyPassword(String(password), user.hash)) {
    return jsonError(401, 'wrong username or password');
  }
  const merged = mergeProgress(await getProgress(key), localProgress ?? {});
  const progress = await saveProgress(key, merged);
  const token = await createSession(key);
  const res = Response.json({
    ok: true,
    user: { username: user.username, displayName: user.displayName, createdAt: user.createdAt },
    progress,
  });
  res.headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${SESSION_MAX_AGE}`,
  );
  return res;
}
