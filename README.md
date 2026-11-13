# HianLao — ເຣີຢນລາວ 🇱🇦

**HianLao** ("hian Lao" = "learn Lao") is a **free, open-source, Duolingo-style website to learn the Lao language**, built for the **Lao diaspora all around the world** — because Duolingo doesn't teach Lao, and the existing Lao-learning sites are locked behind subscriptions.

No accounts. No paywall. No ads. Your progress stays on your device, and the whole site is static files you can host anywhere (it runs on GitHub Pages) or even offline.

## ✨ What's inside

- **🎯 Learning path** — 8 units / 24 bite-size lessons with Duolingo-style exercises: multiple choice, typing, matching pairs, **listening** (🔊 text-to-speech), **word tiles**, and **speaking practice** (🎤 microphone). XP ⚡, hearts ❤️ and daily streaks 🔥 keep you motivated.
- **📖 Grammar bible** — the Lao script, the 6 tones, sentence structure, verb particles, negation, questions, classifiers, politeness, telling time, ordering food, directions… explained simply, always with Lao script + transliteration + English.
- **🧺 Words & phrases** — a searchable dictionary of 200+ words and real-life phrases (greetings, food, family, numbers, travel, colors…) with a listen button on every word.
- **🇱🇦 Culture** — Laos at a glance, festivals (Pi Mai, Boun That Luang, rocket festival), food (larb, tam mak hoong, khao piak sen, sticky rice…), etiquette (the nop, head & feet rules), and the story of the Lao diaspora.
- **🔊 Voice** — listening exercises use your browser's Lao voice when available (`lo-LA`); speaking exercises use the Web Speech API where supported, with graceful fallbacks.

## 🚀 Run it locally

It's a **no-build static site** (plain HTML/CSS/ES modules) — any static server works:

```bash
git clone https://github.com/benjamin-bock/hianlao.git
cd hianlao
python3 -m http.server 8000
# then open http://localhost:8000
```

(ES modules need HTTP, not `file://` — that's why we use a tiny local server.)

## 🌐 Deployment

The site is deployed with **GitHub Pages** (see *Settings → Pages*), serving this repository directly — free, no build step, no backend. To deploy your own fork: enable Pages on the `main` branch (root) and it's live at `https://<you>.github.io/hianlao/`.

## 🗂️ Project structure

```
index.html          landing page
learn.html          learning path (units & lessons)
lesson.html?id=…    lesson runner (exercise engine)
words.html          searchable dictionary
grammar.html        grammar bible
culture.html        culture guide
assets/css/main.css the design
assets/img/*.svg    original illustrations (no external assets)
assets/js/main.js   shared header/footer/nav + helpers
assets/js/store.js  progress in localStorage (XP, streak, hearts, done lessons)
assets/js/speech.js TTS (lo-LA) + speech recognition helpers
assets/js/lesson.js the exercise engine
assets/js/data/     ALL CONTENT LIVES HERE:
  vocab.js          word/phrase dataset (add words here!)
  units.js          units → lessons → exercises (+ validateUnits())
  grammar.js        grammar sections
  culture.js        culture sections
```

## ✏️ Contribute (please!)

The site is **content-driven**, so non-developers can contribute too:

1. **Add a word/phrase**: append an entry to `assets/js/data/vocab.js` — `{ id, lao, tr, en, cat }`.
2. **Add a lesson**: in `assets/js/data/units.js`, add a lesson to a unit using the helpers `mc()`, `typeEx()`, `match()`, `listen()`, `tiles()`, `speak()` with vocab ids.
3. **Add grammar/culture**: add a section to `assets/js/data/grammar.js` or `culture.js`.
4. Run the sanity check (validates that every exercise references existing words):

   ```bash
   node tests/check-data.mjs
   ```

5. Open a pull request 🎉

Ideas: more units (travel, work, proverbs), example dialogues, a quiz mode, Lao dialect notes (Luang Prabang, Isan), community links, translations of the UI into Lao or French.

## 🧪 Tests

```bash
node tests/check-data.mjs   # data integrity: all ids/tiles valid, all pages' assets exist
```

## 📜 License

[MIT](LICENSE) — free to use, copy, modify and share. If you add recorded audio of native speakers, keep it freely licensed too (CC BY / CC BY-SA) and credit the speakers in `ATTRIBUTION.md`.

---

*Made with ❤️ for <span>ຄນລາວ</span> everywhere — from Vientiane to Minnesota, Paris to Sydney.*
