# HianLao — ເຣີຢນລາວ 🇱🇦

**HianLao** ("hian Lao" = "learn Lao") is a **free, open-source, Duolingo-style website to learn the Lao language**, built for the **Lao diaspora all around the world** — because Duolingo doesn't teach Lao, and the existing Lao-learning sites are locked behind subscriptions.

No accounts. No paywall. No ads. Your progress stays on your device, and the site runs anywhere Node runs (it deploys to Vercel in one click) or works fully offline as a PWA.

## ✨ What's inside

- **🎯 Learning path** — 13 units / 39 bite-size lessons with Duolingo-style exercises: multiple choice, typing, matching pairs, **listening** (🔊 text-to-speech), **word tiles**, and **speaking practice** (🎤 microphone) — including Unit 12 with famous Lao **proverbs in context** 💬 and Unit 13 with **everyday dialogues** 🗣️. XP ⚡, hearts ❤️ and daily streaks 🔥 keep you motivated.
- **📖 Grammar bible** — the Lao script, the 6 tones, sentence structure, verb particles, negation, questions, classifiers, politeness, telling time, ordering food, directions… explained simply, always with Lao script + transliteration + English.
- **🧺 Words & phrases** — a searchable dictionary of 200+ words and real-life phrases (greetings, food, family, numbers, travel, colors…) with a listen button on every word.
- **🇱🇦 Culture** — Laos at a glance, festivals (Pi Mai, Boun That Luang, rocket festival), food (larb, tam mak hoong, khao piak sen, sticky rice…), etiquette (the nop, head & feet rules), and the story of the Lao diaspora.
- **🔊 Voice (native-quality audio)** — every word plays a neural Lao MP3 (Microsoft's native `lo-LA` voices, generated once and served as static files — offline-friendly, free, no API at runtime), falling back to `/api/tts` on the backend, then to the browser's Lao voice, then to the transliteration. Speaking exercises use the Web Speech API where supported. See `scripts/generate-audio.mjs`.
- **📱 PWA / mobile app** — the site is already an installable Progressive Web App (manifest + service worker + icons): works offline, "Add to Home Screen" on Android & iOS. See the *Mobile app* section below for store publishing costs.
- **🌙 Dark theme, 🌐 EN/FR/LAO UI, 🎯 daily XP goal, 🔁 spaced-repetition review, 🏆 weekly & all-time leaderboards** — all in the header / Learn page.
- **👤 Accounts & sync** — free username/password accounts on Vercel (serverless `api/` + Upstash KV): progress synced across devices, 🏆 leaderboard, 🏅 achievement badges. Without a backend the site still works fully offline (localStorage).

## 🚀 Run it locally

The site is a **Next.js 15 / React 19 / TypeScript (strict) / Tailwind CSS 4** app (App Router):

```bash
git clone https://github.com/benjamin-bock/hianlao.git
cd hianlao
npm install
npm run dev
# then open http://localhost:3000
```

Other scripts: `npm run build` (production build), `npm start` (serve the build), `npm run typecheck`, `npm test`, `npm run audio` (regenerate the TTS MP3s).

## 📱 Mobile app — cheap/free options

The site is **already a PWA** (`manifest.webmanifest` + `sw.js` + generated PNG icons): installable on Android and iOS via "Add to Home Screen", works offline, dark theme follows the OS. **Cost: 0 €.**

If you want it in the **stores**:

1. **Google Play** — wrap the site with [Capacitor](https://capacitorjs.com/) (free, open-source): `npm i @capacitor/core @capacitor/cli && npx cap add android`, then open Android Studio and build an AAB. Publishing costs **$25 one-time** (Google Play Developer registration). No Mac needed.
2. **Apple App Store** — same Capacitor wrapper (`npx cap add ios`), but building requires a **Mac with Xcode**; publishing costs **$99/year** (Apple Developer Program). Alternative without a Mac: [PWABuilder](https://www.pwabuilder.com/) (free) generates store-ready packages from the PWA URL.
3. Cheapest path overall: ship the PWA now (0 €), add Play via Capacitor when you have users ($25), iOS later ($99/yr, unavoidable Apple fee).

A `capacitor.config.json` skeleton from the earlier static-site era is still in the repo — Capacitor now needs a static export (`next export`-style build) to wrap the app; revisit when you target the stores.

## 🌐 Deployment

The app deploys to **Vercel** with zero extra config (Next.js is first-class there): import the repo at [vercel.com/new](https://vercel.com/new) (or run `npx vercel --prod`). Build command `next build`, output detected automatically. Every push to `main` auto-deploys; every PR gets a preview URL. The repo must be public, or grant Vercel access to the private repo. Security headers live in `vercel.json`. It also runs on any Node host (`npm run build && npm start`).

## 👤 Accounts, sync & leaderboard (optional backend)

The site works 100% locally (progress in `localStorage`). It also ships a small backend under `app/api` (Next.js route handlers + Upstash Redis / Vercel KV) for **free accounts**:

- **Sign up / sign in** with username + password (scrypt-hashed, httpOnly session cookie, rate-limited, same-origin guarded).
- **Progress sync**: XP, streak, completed lessons are saved server-side and merged with the local copy on login (max/union) — your progress follows you across devices.
- **🏆 Leaderboard** and **🏅 achievements** (badges).

**Setup (2 min)**: in the Vercel project → *Storage* → add **Upstash Redis (Vercel KV)** (free tier), then **Connect/Lier le projet** on that database and pick your project — that is what injects the env vars into the functions (`KV_REST_API_URL` / `KV_REST_API_TOKEN`, or the Upstash-native `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`; `app/api/_lib/kv.ts` accepts both). Check them under *Settings → Environment Variables*, then **redeploy** (new env vars only apply to new deployments). Verify with `GET /api/health` → `{"ok":true,"kv":true}`. Without those env vars, the API answers "not configured" and the site silently falls back to localStorage — perfect for GitHub Pages or local dev.

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

**Tests**: `npm test` runs `tests/check-data.mjs` (content integrity: PWA assets, SEO files, French fields, romanization coverage) and `tests/api.test.mjs` (spins a loopback mock of the KV REST API and exercises the full register → login → sync → leaderboard → logout flow through the route handlers: 29 assertions).

## 🎨 Design & assets

UI icons come from [Lucide](https://lucide.dev) (`lucide-react`) and FontAwesome via `react-icons` (`FaGithub` in the footer); content-id → icon mappings live in `src/components/Icons.tsx`. Illustrations are [unDraw](https://undraw.co) SVGs, vendored in `public/img/illu/` and recolored to the brand palette (license: `public/img/illu/UNDRAW-LICENSE.txt`). Typefaces are self-hosted at build time via `next/font` (Plus Jakarta Sans + Noto Sans Lao). The logo/PWA icons are generated from `public/img/logo.svg`.

## 🗂️ Project structure

```
app/                    Next.js App Router
  page.tsx              landing page
  learn/                learning path (units & lessons)
  lesson/               lesson runner (exercise engine)
  words/                searchable dictionary
  grammar/              grammar bible
  culture/              culture guide
  account/              account / profile page
  review/               spaced-repetition review queue
  api/                  route handlers: auth, progress sync, leaderboard, tts, health
src/
  components/           React components (site shell + lesson engine)
  data/                 content: vocab, units/lessons, grammar, culture, audio manifest
  lib/                  i18n (EN/FR/LAO), store, speech, fx, achievements
public/
  audio/*.mp3           generated native-voice MP3s (npm run audio)
  img/                  icons & illustrations
  manifest.webmanifest + sw.js   PWA (offline, installable)
tests/                  content-integrity + API flow tests
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
