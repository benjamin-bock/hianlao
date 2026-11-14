import { json, sameOrigin } from './_lib/util.js';
import { kvEnabled } from './_lib/kv.js';
import { ttsEnabled } from './tts.js';

export default async function handler(req, res) {
  if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'forbidden' });
  return json(res, 200, { ok: true, kv: kvEnabled, tts: ttsEnabled, service: 'hianlao-api' });
}
