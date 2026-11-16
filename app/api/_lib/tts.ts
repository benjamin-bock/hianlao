// Azure Speech TTS — server-side synthesis for vocab ids that have no
// pre-generated file in /public/audio/. Requires AZURE_SPEECH_KEY +
// AZURE_SPEECH_REGION (voice via TTS_VOICE, optional).
const KEY = process.env.AZURE_SPEECH_KEY || process.env.AZURE_TTS_KEY;
const REGION = process.env.AZURE_SPEECH_REGION;
const VOICE = process.env.TTS_VOICE || 'lo-LA-KeomanyNeural';

export const ttsEnabled = Boolean(KEY && REGION);

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function synthesize(text: string): Promise<Uint8Array> {
  const endpoint = process.env.AZURE_SPEECH_ENDPOINT || `https://${REGION}.tts.speech.microsoft.com`;
  const r = await fetch(`${endpoint}/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': KEY!,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'hianlao-tts',
    },
    body:
      `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='lo-LA'>` +
      `<voice name='${VOICE}'>${escapeXml(text)}</voice></speak>`,
  });
  if (!r.ok) throw new Error(`azure tts error ${r.status}`);
  return new Uint8Array(await r.arrayBuffer());
}
