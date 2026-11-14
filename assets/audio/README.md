# Native-speaker audio (roadmap)

Listening exercises currently use the browser's Lao TTS voice (`lo-LA`) when available,
falling back to the transliteration otherwise.

To add **real recordings**: drop files here as `<vocab-id>.mp3` (e.g. `hello.mp3` for the
entry with `id: 'hello'` in `assets/js/data/vocab.js`) and set `audio: 'hello.mp3'` on the
entry — the player prefers the file and falls back to TTS. Please only add **freely
licensed** recordings (CC BY / CC BY-SA / public domain) and credit the speakers in
`ATTRIBUTION.md` at the repo root.
