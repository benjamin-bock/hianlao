import { sameOrigin } from '../_lib/util.ts';
import { kvEnabled } from '../_lib/kv.ts';
import { leaderboard } from '../_lib/auth.ts';

export async function GET(req: Request): Promise<Response> {
  if (new URL(req.url).pathname.startsWith('/api/leaderboard') && req.method !== 'GET') {
    return Response.json({ ok: false, error: 'method not allowed' }, { status: 405 });
  }
  if (!sameOrigin(req)) return Response.json({ ok: false, error: 'forbidden' }, { status: 403 });
  if (!kvEnabled) return Response.json({ ok: true, kv: false, entries: [] });
  const params = new URL(req.url).searchParams;
  const limit = Math.min(50, Math.max(1, parseInt(params.get('limit') || '', 10) || 10));
  const period = params.get('period') === 'week' ? 'week' as const : 'all' as const;
  return Response.json({ ok: true, kv: true, period, entries: await leaderboard(limit, period) });
}
