import { sameOrigin, getCookies, jsonError, SESSION_COOKIE } from '../../_lib/util.ts';
import { destroySession } from '../../_lib/auth.ts';

export async function POST(req: Request): Promise<Response> {
  if (!sameOrigin(req)) return jsonError(403, 'forbidden');
  const token = getCookies(req)[SESSION_COOKIE];
  await destroySession(token);
  const res = Response.json({ ok: true });
  res.headers.append('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`);
  return res;
}
