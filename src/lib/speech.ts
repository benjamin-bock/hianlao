// Speech helpers for listening exercises and speech recognition for speaking
// exercises (graceful fallback everywhere). Playback order for a word:
//   1. native audio file: /audio/<id>.mp3 (generated with a neural voice —
//      see scripts/generate-audio.mjs)
//   2. the optional backend /api/tts endpoint (when deployed with
//      AZURE_SPEECH_KEY)
//   3. the browser's Lao TTS voice (lo-LA), if the device has one
//   4. the romanization read by any TTS voice, as a last resort.
'use client';

import { AUDIO_FILES } from '@/data/audio-manifest.ts';
import type { VocabEntry } from '@/data/types.ts';

const AUDIO_DIR = '/audio/';
const blobUrls = new Map<string, string>(); // vocab id -> object URL from the backend TTS
const apiTried = new Set<string>(); // ids already fetched from the backend this session
let backendTTS: boolean | undefined; // undefined = unknown, then boolean after one /api/health probe

export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// Resolve the audio file for a vocab item, if one is known to exist.
// `audio: 'hello.mp3'` on the entry is an explicit override; otherwise the
// generated manifest tells us whether `<id>.mp3` exists (avoids 404 noise).
export function audioUrl(item: { audio?: string; id?: string }): string | null {
  if (item.audio) return AUDIO_DIR + item.audio;
  if (item.id && AUDIO_FILES.has(item.id)) return AUDIO_DIR + item.id + '.mp3';
  return null;
}

export function hasNativeAudio(item: Pick<VocabEntry, 'audio' | 'id'>): boolean { return !!audioUrl(item); }

export function laoVoice(): SpeechSynthesisVoice | null {
  if (!ttsSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith('lo')) || null;
}

export function hasLaoVoice(): boolean { return !!laoVoice(); }

export function speak(text: string, { lang = 'lo-LA', rate = 0.85 }: { lang?: string; rate?: number } = {}): Promise<boolean> {
  if (!ttsSupported()) return Promise.resolve(false);
  return new Promise((resolve) => {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = rate;
      const v = lang.toLowerCase().startsWith('lo') ? laoVoice() : null;
      if (v) u.voice = v;
      u.onend = () => resolve(true);
      u.onerror = () => resolve(false);
      window.speechSynthesis.speak(u);
    } catch {
      resolve(false);
    }
  });
}

// Play an MP3/OGG file. A fresh Audio per play (instant from the HTTP cache /
// service worker), so overlapping replays never clobber each other.
function playFile(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined' || typeof Audio === 'undefined') return resolve(false);
      const a = new Audio(url);
      a.preload = 'auto';
      let done = false;
      const finish = (ok: boolean) => { if (!done) { done = true; resolve(ok); } };
      a.onended = () => finish(true);
      a.onerror = () => finish(false);
      const p = a.play();
      if (p && typeof p.catch === 'function') p.catch(() => finish(false)); // autoplay blocked etc.
    } catch {
      resolve(false);
    }
  });
}

// Probe once per session whether the optional backend can synthesize Lao audio.
async function backendTtsAvailable(): Promise<boolean> {
  if (backendTTS !== undefined) return backendTTS;
  try {
    const r = await fetch('/api/health', { headers: { Accept: 'application/json' } });
    backendTTS = r.ok ? Boolean((await r.json()).tts) : false;
  } catch {
    backendTTS = false;
  }
  return backendTTS;
}

// Speak a vocab item: prefer native audio files, then the backend TTS, then the
// browser. Without any Lao-capable voice we still play the romanization so
// the learner hears something close. Alphabet letters pass a minimal shape
// ({ id: 'alpha-…', lao, romanization }) — anything with these fields speaks.
export async function speakItem(
  item: { id?: string; audio?: string; lao: string; romanization?: string },
  rate = 0.85,
): Promise<boolean> {
  const file = audioUrl(item) || (item.id ? blobUrls.get(item.id) : null);
  if (file && await playFile(file)) return true;

  if (item.id && !blobUrls.has(item.id) && !apiTried.has(item.id) && await backendTtsAvailable()) {
    apiTried.add(item.id);
    try {
      const r = await fetch(`/api/tts?id=${encodeURIComponent(item.id)}`);
      if (r.ok && (r.headers.get('content-type') || '').includes('audio')) {
        const url = URL.createObjectURL(await r.blob());
        if (await playFile(url)) { blobUrls.set(item.id, url); return true; }
      }
    } catch { /* fall through to browser TTS */ }
  }

  if (hasLaoVoice()) return speak(item.lao, { lang: 'lo-LA', rate });
  return item.romanization
    ? speak(item.romanization, { lang: 'en-US', rate: Math.max(rate, 0.9) })
    : Promise.resolve(false);
}

export function canRecognize(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as Record<string, unknown>;
  return 'SpeechRecognition' in w || 'webkitSpeechRecognition' in w;
}

// What a recognition attempt ended with: a transcript, or the engine's error
// code ('not-allowed' = mic permission blocked, 'service-not-allowed' = engine
// absent (Android WebView), 'network' = cloud recognizer unreachable,
// 'language-not-supported' = e.g. Safari without a Lao dictation language,
// 'no-speech' = nothing said before the engine gave up, 'timeout' = our limit).
export interface RecognizeResult {
  transcript: string | null;
  error: string | null;
}

function recognizeOnce({ lang, timeoutMs }: { lang: string; timeoutMs: number }): Promise<RecognizeResult> {
  return new Promise((resolve) => {
    if (!canRecognize()) return resolve({ transcript: null, error: 'service-not-allowed' });
    try {
      const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
      const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
      if (!SR) return resolve({ transcript: null, error: 'service-not-allowed' });
      const rec = new SR();
      rec.lang = lang;
      rec.interimResults = false;
      rec.maxAlternatives = 3;
      let done = false;
      let transcript: string | null = null;
      let errorCode: string | null = null;
      const finish = () => {
        if (done) return;
        done = true;
        try { rec.stop(); } catch { /* ignore */ }
        resolve({ transcript, error: errorCode });
      };
      rec.onresult = (e) => {
        transcript = Array.from(e.results[0]).map((a) => a.transcript).join(' | ') || null;
        finish();
      };
      rec.onerror = (e) => { errorCode = e.error || 'speech-error'; finish(); };
      rec.onend = finish;
      setTimeout(finish, timeoutMs);
      rec.start();
    } catch (e) {
      resolve({ transcript: null, error: (e as Error)?.name || 'speech-error' });
    }
  });
}

// Speech recognition in one go. If the engine cannot handle the requested
// language at all (Safari, some Android browsers have no Lao voice typing),
// retry once in English so the learner can still say the romanization —
// speechMatches() accepts that path.
export async function recognize({ lang = 'lo-LA', timeoutMs = 10000 } = {}): Promise<RecognizeResult> {
  let res = await recognizeOnce({ lang, timeoutMs });
  // Chrome aborts the first session while the mic warms up ('aborted'), can call
  // 'no-speech' before the learner gets a word out, and sometimes just ends with
  // neither result nor error - so give it exactly one quiet second wind.
  // Permission is already granted, so no new prompt appears.
  if (res.transcript === null && (res.error === 'no-speech' || res.error === 'aborted' || res.error === null)) {
    res = await recognizeOnce({ lang, timeoutMs });
  }
  if (res.transcript || (res.error !== 'language-not-supported' && res.error !== 'language-not-available')) return res;
  const retry = await recognizeOnce({ lang: 'en-US', timeoutMs });
  return retry.transcript ? retry : { ...retry, error: retry.error || res.error };
}

// Minimal structural types for the Web Speech API (not in TypeScript's DOM lib).
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error?: string; message?: string }) => void) | null;
  onend: (() => void) | null;
}

export function normalize(s: string): string {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[\u0ec8-\u0ecb]/g, '') // Lao tone marks: voice typing adds/drops them on near-hits
    .replace(/[.,!?;:"'’“”()[\]…¿¡-]/g, '') // includes '-', so "sa-bai-dii" == "sa bai dii"
    .replace(/\s+/g, ' ')
    .trim();
}

// Levenshtein over a few short strings; transcript and target are single words.
function similarity(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m || !n) return 0;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return 1 - prev[n] / Math.max(m, n);
}

const SIMILAR_ENOUGH = 0.75; // one edit still matches words of ~4+ chars

// Loose comparison for speech results: each engine alternative (recognize()
// joins them with ' | ') is accepted if it matches the Lao script or the
// romanization, or comes close to either - voice typing mishears a tone mark
// or vowel length now and then, though the learner said the word correctly.
export function speechMatches(transcript: string | null, item: VocabEntry): boolean {
  if (!transcript) return false;
  const targets = [normalize(item.lao), normalize(item.romanization)].filter(Boolean);
  const despaced = (s: string) => s.replace(/\s+/g, ''); // targets carry no spaces either
  return transcript.split(' | ').some((alt) => {
    const t = normalize(alt);
    if (!t) return false;
    const forms = [t, despaced(t)];
    return targets.some((target) => forms.some((form) => form.includes(target) || target.includes(form) || similarity(form, target) >= SIMILAR_ENOUGH));
  });
}
