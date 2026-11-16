# Native-voice audio (`assets/audio/`)

Every word on HianLao can have a real audio file: `assets/audio/<vocab-id>.mp3`
(e.g. `hello.mp3` for the entry with `id: 'hello'` in `assets/js/data/vocab.js`).
The player (`assets/js/speech.js`) plays the file automatically — before the
browser's built-in voice — falling back to Web Speech TTS when a file is
missing, and to the transliteration as a last resort. The generated
`assets/js/audio-manifest.js` keeps track of which files exist.

## Why files instead of TTS?

No browser ships a Lao voice, and Google Translate-style TTS for Lao sounds
robotic. Files in this folder are therefore **generated once with a native
neural Lao voice** — `lo-LA-KeomanyNeural` (female) or
`lo-LA-ChanthavongNeural` (male) — and committed to the repo. At runtime the
site serves plain static MP3s: free, instant, works offline in the PWA.

## Generating

Default provider is **keyless**: it uses Microsoft Edge's Read-Aloud service
through the open-source `edge-tts` tool (auto-installed into a git-ignored
`.tts-venv/`, needs `python3`). No account, no key, no cost — it's Edge's own
convenience endpoint, meant for one-time generation, never per-request.

```bash
npm run audio                 # all words, Keomany (female) voice
npm run audio -- --list       # show lo-LA voices
npm run audio -- --only hello,thanks --force   # regenerate a few
npm run audio -- --force --voice lo-LA-ChanthavongNeural   # male voice
```

Prefer the official API? Set `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` env
vars (free "Speech" resource in the Azure portal, tier F0 = 500k chars/month —
the whole dataset needs ~2k chars) and the script switches to the Azure REST
endpoint automatically, or force it with `--provider azure`.

**No terminal?** The `generate-audio` GitHub Actions workflow does the same in
the cloud: run it from the repo's *Actions* tab, review the PR with the
generated MP3s, and merge.

The script is resume-safe and updates `assets/js/audio-manifest.js` + the
service-worker cache version. New vocab words added later are also covered by
`api/tts.js` (Vercel + Azure env vars synthesize any id on demand, cached in
KV) — running `npm run audio` afterwards folds them into the static set.

## Human recordings

Real recordings from native speakers are even better and very welcome. Drop a
file here as `<vocab-id>.mp3` (it replaces a generated one one-to-one) and make
sure the id is listed in `assets/js/audio-manifest.js` — hand-editing that Set
is fine — or set `audio: '<file>.mp3'` on the vocab entry if you prefer another
filename. Please only add **freely licensed** recordings (CC BY / CC BY-SA /
public domain) and credit the speakers in `ATTRIBUTION.md` at the repo root.
The AI-generated files here are not human recordings; they are code-like build
artifacts, covered by the repo's MIT license.
