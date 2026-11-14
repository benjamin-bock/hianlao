// Speech helpers: text-to-speech for listening exercises (Lao voice when available)
// and speech recognition for speaking exercises (graceful fallback everywhere).

export function ttsSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

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

// Speak a vocab item: Lao script with a Lao voice if the device has one,
// otherwise the transliteration so the learner still hears something close.
export function speakItem(item, rate = 0.85) {
  if (hasLaoVoice()) return speak(item.lao, { lang: 'lo-LA', rate });
  return speak(item.tr, { lang: 'en-US', rate: 0.9 });
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
  const targets = [normalize(item.lao), normalize(item.tr)].filter(Boolean);
  return targets.some(x => x && (t.includes(x) || x.includes(t)));
}
