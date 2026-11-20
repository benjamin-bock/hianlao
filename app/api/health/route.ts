import { sameOrigin } from '../_lib/util.ts';
import { kvEnabled } from '../_lib/kv.ts';
import { ttsEnabled } from '../_lib/tts.ts';
import { sttEnabled } from '../_lib/stt.ts';

export async function GET(req: Request): Promise<Response> {
  if (!sameOrigin(req)) return Response.json({ ok: false, error: 'forbidden' }, { status: 403 });
  return Response.json({ ok: true, kv: kvEnabled, tts: ttsEnabled, stt: sttEnabled(), service: 'hianlao-api' });
}
