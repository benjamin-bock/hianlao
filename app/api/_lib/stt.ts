// Azure Speech STT — server-side speech-to-text fallback for the mic
// exercises, used when the browser's own recognition engine cannot run
// (Firefox, Android WebView) or cannot reach its cloud ('network'). Requires
// AZURE_SPEECH_KEY + AZURE_SPEECH_REGION — the same resource /api/tts uses.
// Tests point AZURE_SPEECH_ENDPOINT at a local mock server.
export function sttEnabled(): boolean {
  return Boolean(process.env.AZURE_SPEECH_KEY || process.env.AZURE_STT_KEY)
    && Boolean(process.env.AZURE_SPEECH_REGION);
}

export async function transcribe(
  audio: ArrayBuffer,
  contentType: string,
  lang = 'lo-LA',
): Promise<string> {
  const key = process.env.AZURE_SPEECH_KEY || process.env.AZURE_STT_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  const base = process.env.AZURE_SPEECH_ENDPOINT || `https://${region}.stt.speech.microsoft.com`;
  const r = await fetch(`${base}/speech/recognition/conversation/cognitiveservices/v1?language=${encodeURIComponent(lang)}&format=simple`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key!,
      'Content-Type': contentType,
      'Accept': 'application/json;text/xml',
      'User-Agent': 'hianlao-stt',
    },
    body: audio,
  });
  if (!r.ok) throw new Error(`azure stt error ${r.status}`);
  const j = (await r.json()) as { DisplayText?: string };
  return (j.DisplayText || '').trim();
}
