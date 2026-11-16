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
export function audioUrl(item: Pick<VocabEntry, 'audio' | 'id'>): string | null {
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
// the learner hears something close.
export async function speakItem(item: VocabEntry, rate = 0.85): Promise<boolean> {
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
  return speak(item.romanization, { lang: 'en-US', rate: Math.max(rate, 0.9) });
}

export function canRecognize(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as Record<string, unknown>;
  return 'SpeechRecognition' in w || 'webkitSpeechRecognition' in w;
}

export function recognize({ lang = 'lo-LA', timeoutMs = 8000 }: { lang?: string; timeoutMs?: number } = {}): Promise<string | null> {
  return new Promise((resolve) => {
    if (!canRecognize()) return resolve(null);
    try {
      const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
      const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
      if (!SR) return resolve(null);
      const rec = new SR();
      rec.lang = lang;
      rec.interimResults = false;
      rec.maxAlternatives = 3;
      let done = false;
      const finish = (val: string | null) => { if (!done) { done = true; try { rec.stop(); } catch { /* ignore */ } resolve(val); } };
      rec.onresult = (e) => {
        const alts = Array.from(e.results[0]).map((a) => a.transcript).join(' | ');
        finish(alts);
      };
      rec.onerror = () => finish(null);
      rec.onend = () => finish(null);
      setTimeout(() => finish(null), timeoutMs);
      rec.start();
    } catch {
      resolve(null);
    }
  });
}

// Minimal structural types for the Web Speech API (not in TypeScript's DOM lib).
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

export function normalize(s: string): string {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[.,!?;:"'’“”()[\]…¿¡]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Loose comparison for speech results: accept if the transcript matches the Lao
// script, the romanization, or contains either as a substring.
export function speechMatches(transcript: string | null, item: VocabEntry): boolean {
  if (!transcript) return false;
  const t = normalize(transcript);
  const targets = [normalize(item.lao), normalize(item.romanization)].filter(Boolean);
  return targets.some((target) => t.includes(target) || target.includes(t));
}
