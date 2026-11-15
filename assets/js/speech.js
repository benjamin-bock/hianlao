// Speech helpers for listening exercises and speech recognition for speaking
// exercises (graceful fallback everywhere). Playback order for a word:
//   1. native audio file: assets/audio/<id>.mp3 (recorded by a speaker or
//      generated with a neural voice — see assets/audio/README.md)
//   2. the optional backend /api/tts endpoint (when deployed on Vercel with
//      AZURE_SPEECH_KEY — see api/tts.js)
//   3. the browser's Lao TTS voice (lo-LA), if the device has one
//   4. the transliteration read by any TTS voice, as a last resort.
import { AUDIO_FILES } from './audio-manifest.js';

const AUDIO_DIR = 'assets/audio/';
const blobUrls = new Map(); // vocab id -> object URL from the backend TTS
const apiTried = new Set(); // ids already fetched from the backend this session
let backendTTS; // undefined = unknown, then boolean after one /api/health probe

export function ttsSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// Resolve the audio file for a vocab item, if one is known to exist.
// `audio: 'hello.mp3'` on the entry is an explicit override; otherwise the
// generated manifest tells us whether `<id>.mp3` exists (avoids 404 noise).
export function audioUrl(item) {
  if (item.audio) return AUDIO_DIR + item.audio;
  if (item.id && AUDIO_FILES.has(item.id)) return AUDIO_DIR + item.id + '.mp3';
  return null;
}

export function hasNativeAudio(item) { return !!audioUrl(item); }

export function laoVoice() {
  if (!ttsSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  return voices.find(v => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith('lo')) || null;
}

export function hasLaoVoice() { return !!laoVoice(); }

export function speak(text, { lang = 'lo-LA', rate = 0.85 } = {}) {
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
function playFile(url) {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined' || typeof Audio === 'undefined') return resolve(false);
      const a = new Audio(url);
      a.preload = 'auto';
      let done = false;
      const finish = (ok) => { if (!done) { done = true; resolve(ok); } };
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
async function backendTtsAvailable() {
  if (backendTTS !== undefined) return backendTTS;
  try {
    const r = await fetch('api/health', { headers: { Accept: 'application/json' } });
    backendTTS = r.ok ? Boolean((await r.json()).tts) : false;
  } catch {
    backendTTS = false;
  }
  return backendTTS;
}

// Speak a vocab item: prefer native audio files, then the backend TTS, then the
// browser. Without any Lao-capable voice we still play the transliteration so
// the learner hears something close.
export async function speakItem(item, rate = 0.85) {
  const file = audioUrl(item) || (item.id ? blobUrls.get(item.id) : null);
  if (file && await playFile(file)) return true;

  if (item.id && !blobUrls.has(item.id) && !apiTried.has(item.id) && await backendTtsAvailable()) {
    apiTried.add(item.id);
    try {
      const r = await fetch(`api/tts?id=${encodeURIComponent(item.id)}`);
      if (r.ok && (r.headers.get('content-type') || '').includes('audio')) {
        const url = URL.createObjectURL(await r.blob());
        if (await playFile(url)) { blobUrls.set(item.id, url); return true; }
      }
    } catch { /* fall through to browser TTS */ }
  }

  if (hasLaoVoice()) return speak(item.lao, { lang: 'lo-LA', rate });
  return speak(item.romanization, { lang: 'en-US', rate: Math.max(rate, 0.9) });
}

export function canRecognize() {
  return typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

export function recognize({ lang = 'lo-LA', timeoutMs = 8000 } = {}) {
  return new Promise((resolve) => {
    if (!canRecognize()) return resolve(null);
    try {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SR();
      rec.lang = lang;
      rec.interimResults = false;
      rec.maxAlternatives = 3;
      let done = false;
      const finish = (val) => { if (!done) { done = true; try { rec.stop(); } catch { /* ignore */ } resolve(val); } };
      rec.onresult = (e) => {
        const alts = [...e.results[0]].map(a => a.transcript).join(' | ');
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

export function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[.,!?;:"'’“”()\[\]…¿¡]/g, '')
    .replace(/[\u0E00-\u0E7F]/g, c => c) // keep Lao glyphs
    .replace(/\s+/g, ' ')
    .trim();
}

// Loose comparison for speech results: accept if the transcript matches the Lao
// script, the transliteration, or contains either as a substring.
export function speechMatches(transcript, item) {
  if (!transcript) return false;
  const t = normalize(transcript);
  const targets = [normalize(item.lao), normalize(item.romanization)].filter(Boolean);
  return targets.some(x => x && (t.includes(x) || x.includes(t)));
}
