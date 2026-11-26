import { sameOrigin, getCookies, clientIp, body, jsonError, SESSION_COOKIE } from '../_lib/util.ts';
import { kvEnabled, rateLimit } from '../_lib/kv.ts';
import { userFromToken, getProgress, saveProgress, mergeProgress } from '../_lib/auth.ts';

async function authedUser(req: Request): Promise<string | null> {
  if (!kvEnabled) return null;
  const token = getCookies(req)[SESSION_COOKIE];
  return userFromToken(token);
}

export async function GET(req: Request): Promise<Response> {
  if (!sameOrigin(req)) return jsonError(403, 'forbidden');
  if (!kvEnabled) return jsonError(503, 'backend not configured');
  if (!(await rateLimit(`prog:${clientIp(req)}`, 60, 60))) return jsonError(429, 'too many requests');
  const username = await authedUser(req);
  if (!username) return jsonError(401, 'not signed in');
  return Response.json({ ok: true, progress: await getProgress(username) });
}

export async function PUT(req: Request): Promise<Response> {
  if (!sameOrigin(req)) return jsonError(403, 'forbidden');
  if (!kvEnabled) return jsonError(503, 'backend not configured');
  if (!(await rateLimit(`prog:${clientIp(req)}`, 60, 60))) return jsonError(429, 'too many requests');
  const username = await authedUser(req);
  if (!username) return jsonError(401, 'not signed in');
  const payload = await body(req);
  // Merge instead of replace: a device with a stale local copy must never
  // erase newer progress saved from another device.
  const progress = await saveProgress(username, mergeProgress(await getProgress(username), payload.progress));
  return Response.json({ ok: true, progress });
}

export async function DELETE(): Promise<Response> {
  return jsonError(405, 'method not allowed');
}
