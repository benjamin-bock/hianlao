// Optional server-side speech recognition: the mic exercises send a short WAV
// here when the browser's engine cannot run or reach its service. Guarded like
// the other endpoints (same-origin, size cap, language whitelist, rate limit) —
// this should not become an open transcription proxy.
import { sameOrigin, clientIp } from '../_lib/util.ts';
import { rateLimit } from '../_lib/kv.ts';
import { sttEnabled, transcribe } from '../_lib/stt.ts';

const MAX_AUDIO_BYTES = 6 * 1024 * 1024;
// Only the locales the exercises actually use.
const LANGS: Record<string, string> = { lo: 'lo-LA', en: 'en-US', fr: 'fr-FR' };

export async function POST(req: Request): Promise<Response> {
  if (!sameOrigin(req)) return Response.json({ ok: false, error: 'forbidden' }, { status: 403 });
  if (!sttEnabled()) return Response.json({ ok: false, error: 'stt not configured' }, { status: 503 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ ok: false, error: 'expected multipart form-data' }, { status: 400 });
  }
  const audio = form.get('audio');
  if (!(audio instanceof File) || audio.size === 0) {
    return Response.json({ ok: false, error: 'missing audio file (field "audio")' }, { status: 400 });
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return Response.json({ ok: false, error: 'audio too large' }, { status: 413 });
  }
  const requested = String(form.get('lang') || 'lo-LA');
  const lang = LANGS[requested.split('-')[0]] || 'lo-LA';

  if (!(await rateLimit(`stt:${clientIp(req)}`, 30, 60))) {
    return Response.json({ ok: false, error: 'too many requests' }, { status: 429 });
  }

  try {
    const text = await transcribe(await audio.arrayBuffer(), audio.type || 'audio/wav', lang);
    return Response.json({ ok: true, text });
  } catch {
    return Response.json({ ok: false, error: 'stt recognition failed' }, { status: 502 });
  }
}
