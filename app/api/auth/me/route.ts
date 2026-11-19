import { sameOrigin, getCookies, jsonError, SESSION_COOKIE } from '../../_lib/util.ts';
import { kvEnabled } from '../../_lib/kv.ts';
import { userFromToken, getUser, getProgress } from '../../_lib/auth.ts';

export async function GET(req: Request): Promise<Response> {
  if (!sameOrigin(req)) return jsonError(403, 'forbidden');
  if (!kvEnabled) return Response.json({ ok: true, user: null, progress: null, kv: false });
  const token = getCookies(req)[SESSION_COOKIE];
  const key = await userFromToken(token);
  if (!key) return Response.json({ ok: true, user: null, progress: null, kv: true });
  const user = await getUser(key);
  if (!user) return Response.json({ ok: true, user: null, progress: null, kv: true });
  const progress = await getProgress(key);
  return Response.json({
    ok: true,
    kv: true,
    user: { username: user.username, displayName: user.displayName, createdAt: user.createdAt },
    progress,
  });
}
