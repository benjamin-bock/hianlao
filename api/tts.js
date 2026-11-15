// Optional native-voice TTS for HianLao vocabulary: synthesizes any vocab id
// that has no pre-generated file in assets/audio/ (e.g. a word added after the
// last audio build). Ids are validated against the dataset, so this is not an
// open synthesis proxy. Requires Azure Speech env vars:
//   AZURE_SPEECH_KEY + AZURE_SPEECH_REGION (voice via TTS_VOICE, optional).
// Results are cached in KV, so each id is synthesized at most once.
import { json, sameOrigin, clientIp } from './_lib/util.js';
import { kv, kvEnabled, rateLimit } from './_lib/kv.js';
import { VOCAB_BY_ID } from '../assets/js/data/vocab.js';

const KEY = process.env.AZURE_SPEECH_KEY || process.env.AZURE_TTS_KEY;
const REGION = process.env.AZURE_SPEECH_REGION;
const VOICE = process.env.TTS_VOICE || 'lo-LA-KeomanyNeural';

export const ttsEnabled = Boolean(KEY && REGION);

function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function synthesize(text) {
  const endpoint = process.env.AZURE_SPEECH_ENDPOINT || `https://${REGION}.tts.speech.microsoft.com`;
  const r = await fetch(`${endpoint}/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': KEY,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'hianlao-tts',
    },
    body: `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='lo-LA'>`
      + `<voice name='${VOICE}'>${escapeXml(text)}</voice></speak>`,
  });
  if (!r.ok) throw new Error(`azure tts error ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

function sendAudio(res, buf) {
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
  res.status(200).end(buf);
}

export default async function handler(req, res) {
  if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'forbidden' });
  const id = String(req.query?.id || '');
  const item = VOCAB_BY_ID[id];
  if (!item) return json(res, 404, { ok: false, error: 'unknown vocab id' });
  if (!ttsEnabled) return json(res, 503, { ok: false, error: 'tts not configured' });

  const cacheKey = `tts:${id}`;
  if (kvEnabled) {
    const b64 = await kv('GET', cacheKey);
    if (b64) return sendAudio(res, Buffer.from(b64, 'base64'));
    if (!(await rateLimit(`tts:${clientIp(req)}`, 30, 60))) return json(res, 429, { ok: false, error: 'too many requests' });
  }
  try {
    const buf = await synthesize(item.lao);
    if (kvEnabled) await kv('SET', cacheKey, buf.toString('base64'));
    return sendAudio(res, buf);
  } catch {
    return json(res, 502, { ok: false, error: 'tts synthesis failed' });
  }
}
