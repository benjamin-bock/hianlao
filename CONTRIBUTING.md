# Contributing to HianLao 🇱🇦

HianLao is a **free, open-source, no-build static site** to learn Lao — plain HTML/CSS/ES
modules, all content lives in `assets/js/data/`. Non-developers can contribute content too!

## Quick start (content — no code needed)

1. **Add a word/phrase**: append an entry to `assets/js/data/vocab.js` — `{ id, lao, tr, en, cat }`
   (`lao` = Lao script, `tr` = transliteration, `en` = English, `cat` = a key of `CATEGORIES`).
2. **Add a lesson**: in `assets/js/data/units.js`, add a lesson to a unit with the helpers
   `mc()`, `typeEx()`, `match()`, `listen()`, `tiles()`, `speak()` referencing vocab ids.
   Give the lesson a `blurb` — it is shown as the context card at the start of the lesson.
3. **Add grammar/culture**: add a section to `assets/js/data/grammar.js` or `assets/js/data/culture.js`.
4. **Validate**: `npm test` (runs `tests/check-data.mjs` — checks ids, Lao script, tile joins —
   and the API tests).
5. Open a pull request 🎉

**Lao script tip**: Lao is easy to mistype (tone marks, vowels). When possible, *copy* existing
strings from the data files instead of retyping them, and check that every character is in the
Lao Unicode block (U+0E80–U+0EFF) — `tests/check-data.mjs` does this for you.

## Roadmap / help wanted

Pick any item, open an issue first if you want to discuss the approach. Ordered by rough value:

| Idea | Effort | Notes |
|---|---|---|
| 🤖 **AI coach — "Explain my mistake"** | high | see design notes below |
| 🏆 **Weekly quiz mode** | medium | a `quiz.html` seeded by ISO week, drawing random exercises from all units |
| 👥 **Friend leaderboards** | medium | needs Upstash KV schema (`friends:<name>`) + new `api/` endpoints; global leaderboard already exists |
| 🔔 **Streak push notifications** | medium/high | PWA push needs VAPID keys + a Vercel cron to send; **won't work on plain GitHub Pages** (static only) |
| 🌐 **Full EN/FR/LAO i18n of long texts** | high (content) | `grammar.js` / `culture.js` paragraphs are English-only today; UI strings are already EN/FR/LAO in `ui.js` |
| 🎙️ **Recorded audio from native speakers** | medium | the pipeline exists (`npm run audio` generates neural Lao MP3s into `assets/audio/`; `api/tts.js` covers new ids on Vercel) — real human recordings are still welcome: drop `<vocab-id>.mp3` there, freely licensed (CC BY / CC BY-SA) and credit speakers in `ATTRIBUTION.md` |
| 🗺️ **Dialect notes** (Luang Prabang, Isan…) | low | a culture/grammar section |
| 💬 **More dialogue units** | low | like unit 13, chaining existing phrases |

### 🤖 AI coach — design notes (for whoever picks this up)

Goal: a "💬 Explain my mistake" button in the lesson feedback banner that explains *why* an
answer was wrong, in the user's UI language (EN/FR/LAO).

Two possible paths:

1. **Fine-tune a Mistral model on La Plateforme / Mistral Studio** (no GPU needed; paid per
   training token, roughly $1–2/M tokens — a few dollars for a small dataset). Generate a JSONL
   dataset from this repo's own data (`vocab.js`, `units.js`, `grammar.js` → "exercise X, correct
   answer Y, learner's answer Z → explain the mistake") plus public Lao text (lo.wikipedia, OPUS —
   check licenses). Fine-tune **Mistral Small** (LoRA), and evaluate on a held-out set of typical
   learner errors (tone marks ่ vs ้, classifiers, word order, negation `mai` vs `bò`, politeness
   particles). Deploy behind a new `api/coach.js` Vercel function that keeps `MISTRAL_API_KEY`
   server-side (never client-side), with rate-limiting and response caching. Fall back to the
   existing static feedback when the API is not configured — same pattern as `api/health.js`, so
   GitHub Pages / offline keeps working fully.
2. **Self-host an open-weights model** (needs GPU budget): **[SEA-LION](https://arxiv.org/abs/2504.05747)**
   (AI Singapore) explicitly trains on Lao and is the best open-weight base for it; alternatively
   fine-tune Mistral open weights yourself with `mistral-finetune`.

**Guardrails**:

- Ground every explanation in the repo's own content — send the relevant vocab entry + grammar
  section along with the prompt — to avoid hallucinated Lao grammar.
- Privacy: the site promises "no accounts, no tracking". Make the coach **opt-in per click**, do
  not store learner text server-side, and disclose the third-party API call in the README.
  La Plateforme is EU-hosted (Paris), which helps with GDPR.
- Cost: cap per-session calls in `api/coach.js`; a short structured prompt on a small model costs
  a fraction of a cent per explanation.

## Code of conduct

Be kind, especially to heritage learners reconnecting with their family's language. All
contributions are MIT-licensed — see [LICENSE](LICENSE).
