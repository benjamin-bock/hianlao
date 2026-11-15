# HianLao — ເຣີຢນລາວ 🇱🇦

**HianLao** ("hian Lao" = "learn Lao") is a **free, open-source, Duolingo-style website to learn the Lao language**, built for the **Lao diaspora all around the world** — because Duolingo doesn't teach Lao, and the existing Lao-learning sites are locked behind subscriptions.

No accounts. No paywall. No ads. Your progress stays on your device, and the whole site is static files you can host anywhere (it runs on GitHub Pages) or even offline.

## ✨ What's inside

- **🎯 Learning path** — 13 units / 39 bite-size lessons with Duolingo-style exercises: multiple choice, typing, matching pairs, **listening** (🔊 text-to-speech), **word tiles**, and **speaking practice** (🎤 microphone) — including Unit 12 with famous Lao **proverbs in context** 💬 and Unit 13 with **everyday dialogues** 🗣️. XP ⚡, hearts ❤️ and daily streaks 🔥 keep you motivated.
- **📖 Grammar bible** — the Lao script, the 6 tones, sentence structure, verb particles, negation, questions, classifiers, politeness, telling time, ordering food, directions… explained simply, always with Lao script + transliteration + English.
- **🧺 Words & phrases** — a searchable dictionary of 200+ words and real-life phrases (greetings, food, family, numbers, travel, colors…) with a listen button on every word.
- **🇱🇦 Culture** — Laos at a glance, festivals (Pi Mai, Boun That Luang, rocket festival), food (larb, tam mak hoong, khao piak sen, sticky rice…), etiquette (the nop, head & feet rules), and the story of the Lao diaspora.
- **🔊 Voice (native-quality audio)** — every word plays a neural Lao MP3 (Microsoft's native `lo-LA` voices, generated once and served as static files — offline-friendly, free, no API at runtime), falling back to `/api/tts` on the Vercel backend, then to the browser's Lao voice, then to the transliteration. Speaking exercises use the Web Speech API where supported. See `assets/audio/README.md`.
- **📱 PWA / mobile app** — the site is already an installable Progressive Web App (manifest + service worker + icons): works offline, "Add to Home Screen" on Android & iOS. See the *Mobile app* section below for store publishing costs.
- **🌙 Dark theme, 🌐 EN/FR/LAO UI, 🎯 daily XP goal, 🔁 spaced-repetition review, 🏆 weekly & all-time leaderboards** — all in the header / Learn page.
- **👤 Accounts & sync** — free username/password accounts on Vercel (serverless `api/` + Upstash KV): progress synced across devices, 🏆 leaderboard, 🏅 achievement badges. Without a backend the site still works fully offline (localStorage).

## 🚀 Run it locally

It's a **no-build static site** (plain HTML/CSS/ES modules) — any static server works:

```bash
git clone https://github.com/benjamin-bock/hianlao.git
cd hianlao
python3 -m http.server 8000
# then open http://localhost:8000
```

(ES modules need HTTP, not `file://` — that's why we use a tiny local server.)

## 📱 Mobile app — cheap/free options

The site is **already a PWA** (`manifest.webmanifest` + `sw.js` + generated PNG icons): installable on Android and iOS via "Add to Home Screen", works offline, dark theme follows the OS. **Cost: 0 €.**

If you want it in the **stores**:

1. **Google Play** — wrap the site with [Capacitor](https://capacitorjs.com/) (free, open-source): `npm i @capacitor/core @capacitor/cli && npx cap add android`, then open Android Studio and build an AAB. Publishing costs **$25 one-time** (Google Play Developer registration). No Mac needed.
2. **Apple App Store** — same Capacitor wrapper (`npx cap add ios`), but building requires a **Mac with Xcode**; publishing costs **$99/year** (Apple Developer Program). Alternative without a Mac: [PWABuilder](https://www.pwabuilder.com/) (free) generates store-ready packages from the PWA URL.
3. Cheapest path overall: ship the PWA now (0 €), add Play via Capacitor when you have users ($25), iOS later ($99/yr, unavoidable Apple fee).

A `capacitor.config.json` skeleton is included for when you want it.

## 🌐 Deployment

The site is a **static site** — it runs anywhere that serves files. Two free options:

**GitHub Pages** — enable *Settings → Pages* on this repo (branch `main`, root `/`, `.nojekyll` is already included). Live at `https://<you>.github.io/hianlao/`.

**Vercel** — zero config: import this repo at [vercel.com/new](https://vercel.com/new) (or run `npx vercel --prod` from the repo root). No build command, no output directory — `vercel.json` only enables clean URLs (`/learn` works alongside `/learn.html`). Every push to `main` auto-deploys; every PR gets a preview URL. The repo must be public, or grant Vercel access to the private repo.

## 👤 Accounts, sync & leaderboard (optional backend)

The site works 100% statically (progress in `localStorage`). On Vercel, it also gets a small serverless backend in `api/` (Node functions + Upstash Redis / Vercel KV) for **free accounts**:

- **Sign up / sign in** with username + password (scrypt-hashed, httpOnly session cookie, rate-limited, same-origin guarded).
- **Progress sync**: XP, streak, completed lessons are saved server-side and merged with the local copy on login (max/union) — your progress follows you across devices.
- **🏆 Leaderboard** and **🏅 achievements** (badges).

**Setup (2 min)**: in the Vercel project → *Storage* → add **Upstash Redis (Vercel KV)** (free tier), then **Connect/Lier le projet** on that database and pick your project — that is what injects the env vars into the functions (`KV_REST_API_URL` / `KV_REST_API_TOKEN`, or the Upstash-native `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`; `api/_lib/kv.js` accepts both). Check them under *Settings → Environment Variables*, then **redeploy** (new env vars only apply to new deployments). Verify with `GET /api/health` → `{"ok":true,"kv":true}`. Without those env vars, the API answers "not configured" and the site silently falls back to localStorage — perfect for GitHub Pages or local dev.

### API endpoints
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/health` | GET | `{ ok, kv }` — backend availability probe |
| `/api/auth/register` | POST | create account (merges `localProgress`), sets session cookie |
| `/api/auth/login` | POST | sign in (merges `localProgress`), sets session cookie |
| `/api/auth/logout` | POST | destroy session |
| `/api/auth/me` | GET | current user + progress (or `null`) |
| `/api/progress` | GET/PUT | read / save `{ xp, done, streak, lastVisit }` (validated against lesson ids) |
| `/api/leaderboard?limit=N` | GET | top learners by XP |

KV data model: `user:<name>` (JSON record), `session:<token>` (30-day TTL), `progress:<name>` (JSON), `lb:xp` (sorted set). No secrets in the repo — env vars only.

**Tests**: `npm test` runs `tests/check-data.mjs` (content integrity) and `tests/api.test.mjs` (spins a loopback mock of the KV REST API and exercises the full register → login → sync → leaderboard → logout flow: 24 assertions).

## 🗂️ Project structure

```
index.html          landing page
learn.html          learning path (units & lessons)
lesson.html?id=…    lesson runner (exercise engine)
words.html          searchable dictionary
grammar.html        grammar bible
culture.html        culture guide
account.html        account / profile page
review.html         spaced-repetition review queue
manifest.webmanifest + sw.js   PWA (offline, installable)
assets/js/ui.js     i18n (EN/FR/LAO) + theme
api/                serverless backend (Vercel functions + KV): auth, progress sync, leaderboard
assets/css/main.css the design
assets/img/*.svg    original illustrations (no external assets)
assets/js/main.js   shared header/footer/nav + helpers
assets/js/store.js  progress in localStorage (XP, streak, hearts, done lessons)
assets/js/speech.js TTS + audio-file player + speech recognition helpers
assets/js/audio-manifest.js generated list of available audio files (npm run audio)
assets/audio/*.mp3  native-quality Lao audio (generate with npm run audio — see assets/audio/README.md)
scripts/generate-audio.mjs one-time native-voice audio generator (keyless; edge-tts or Azure)
.github/workflows/generate-audio.yml regenerate audio in the cloud (Actions tab — opens a PR)
assets/js/lesson.js the exercise engine
assets/js/data/     ALL CONTENT LIVES HERE:
  vocab.js          word/phrase dataset (add words here!)
  units.js          units → lessons → exercises (+ validateUnits())
  grammar.js        grammar sections
  culture.js        culture sections
```

## ✏️ Contribute (please!)

The site is **content-driven**, so non-developers can contribute too. Full guide + roadmap of ideas to pick up (AI coach, quiz, push notifications…): see [CONTRIBUTING.md](CONTRIBUTING.md).

1. **Add a word/phrase**: append an entry to `assets/js/data/vocab.js` — `{ id, lao, tr, en, cat }`.
2. **Add a lesson**: in `assets/js/data/units.js`, add a lesson to a unit using the helpers `mc()`, `typeEx()`, `match()`, `listen()`, `tiles()`, `speak()` with vocab ids.
3. **Add grammar/culture**: add a section to `assets/js/data/grammar.js` or `culture.js`.
4. Run the sanity check (validates that every exercise references existing words):

   ```bash
   node tests/check-data.mjs
   ```

5. Open a pull request 🎉

Roadmap & ideas (weekly quiz, friend leaderboards, streak push, an **AI coach** that explains mistakes, full Lao/French translations of long texts…): see [CONTRIBUTING.md](CONTRIBUTING.md).

## 🧪 Tests

```bash
node tests/check-data.mjs   # data integrity: all ids/tiles valid, all pages' assets exist
```

## 📜 License

[MIT](LICENSE) — free to use, copy, modify and share. If you add recorded audio of native speakers, keep it freely licensed too (CC BY / CC BY-SA) and credit the speakers in `ATTRIBUTION.md`.

---

*Made with ❤️ for <span>ຄນລາວ</span> everywhere — from Vientiane to Minnesota, Paris to Sydney.*
