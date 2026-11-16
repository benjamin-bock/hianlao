// Optional native-voice TTS: synthesizes any vocab id that has no
// pre-generated file in /public/audio/. Ids are validated against the
// dataset, so this is not an open synthesis proxy. Results are cached in KV,
// so each id is synthesized at most once.
import { sameOrigin, clientIp } from '../_lib/util.ts';
import { kv, kvEnabled, rateLimit } from '../_lib/kv.ts';
import { ttsEnabled, synthesize } from '../_lib/tts.ts';
import { VOCAB_BY_ID } from '../../../src/data/vocab.ts';

function sendAudio(buf: Uint8Array): Response {
  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=604800, immutable',
    },
  });
}

export async function GET(req: Request): Promise<Response> {
  if (!sameOrigin(req)) return Response.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const id = new URL(req.url).searchParams.get('id') || '';
  const item = VOCAB_BY_ID[id];
  if (!item) return Response.json({ ok: false, error: 'unknown vocab id' }, { status: 404 });
  if (!ttsEnabled) return Response.json({ ok: false, error: 'tts not configured' }, { status: 503 });

  const cacheKey = `tts:${id}`;
  if (kvEnabled) {
    const b64 = await kv('GET', cacheKey);
    if (b64) return sendAudio(Buffer.from(b64, 'base64'));
    if (!(await rateLimit(`tts:${clientIp(req)}`, 30, 60))) {
      return Response.json({ ok: false, error: 'too many requests' }, { status: 429 });
    }
  }
  try {
    const buf = await synthesize(item.lao);
    if (kvEnabled) await kv('SET', cacheKey, Buffer.from(buf).toString('base64'));
    return sendAudio(buf);
  } catch {
    return Response.json({ ok: false, error: 'tts synthesis failed' }, { status: 502 });
  }
}
