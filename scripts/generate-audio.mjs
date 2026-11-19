#!/usr/bin/env node
// One-time audio generation for HianLao: synthesizes every vocab entry and
// alphabet letter with a native neural Lao voice into public/audio/<id>.mp3
// and rewrites src/data/audio-manifest.ts. The MP3s are committed to the
// repo, so at runtime the site serves plain static files — no keys, no cost,
// offline OK.
//
// Two generation providers:
//   edge (default, zero config)
//     Uses Microsoft Edge's built-in Read-Aloud service via the open-source
//     `edge-tts` tool (auto-installed into a local, git-ignored .tts-venv —
//     needs python3; override with EDGE_TTS_BIN=/path/to/edge-tts).
//     Free and anonymous; it is Edge's own convenience endpoint, not an
//     official public API — one-time generation only, never per-request.
//   azure
//     The official Azure Speech REST API (create a free Speech resource,
//     tier F0 = 500k chars/month). Used automatically when
//     AZURE_SPEECH_KEY + AZURE_SPEECH_REGION are set (or pass --provider).
//     Also what api/tts.js uses on the server at runtime.
//
// Usage (from the repo root):
//   npm run audio                                   # all words, default voice
//   node scripts/generate-audio.mjs --list          # show lo-LA voices
//   node scripts/generate-audio.mjs --only hello,thanks   # (re)generate subset
//   node scripts/generate-audio.mjs --force --voice lo-LA-ChanthavongNeural
//   node scripts/generate-audio.mjs --dry-run       # list, no network calls
//
// The script is resume-safe: existing files are skipped unless --force.
import { mkdirSync, writeFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { spawn, execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VOCAB } from '../src/data/vocab.ts';
import { ALPHA_GROUPS } from '../src/data/alphabet.ts';

// Alphabet letters get ids like `alpha-c1-1` (group id + position) so their
// generated files live beside the vocab ones: public/audio/alpha-c1-1.mp3.
// Consonants are synthesized as the bare glyph (the voice reads its cited
// syllable); vowel letters already sit on the ກ carrier (ກາ = "kaa").
const ALPHA_ITEMS = ALPHA_GROUPS.flatMap((g) =>
  g.letters.map((letter, i) => ({ id: `alpha-${g.id}-${i + 1}`, lao: letter.lao, romanization: letter.roman })),
);

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 && args[i + 1] ? args[i + 1] : def; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const outDir = join(root, 'public/audio');
mkdirSync(outDir, { recursive: true });

function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ---------- provider: edge (default, keyless) ----------

const edgeBin = () => process.platform === 'win32' ? '.tts-venv/Scripts/edge-tts.exe' : '.tts-venv/bin/edge-tts';

async function ensureEdgeEngine() {
  for (const c of [process.env.EDGE_TTS_BIN, join(root, edgeBin())]) {
    if (c && existsSync(c)) return c;
  }
  try {
    execSync('command -v edge-tts', { stdio: 'pipe' });
    return 'edge-tts';
  } catch { /* not on PATH */ }
  console.log('One-time setup: installing edge-tts into a local, git-ignored .tts-venv (needs python3)…');
  execSync(`python3 -m venv .tts-venv && ${edgeBin().replace('/bin/edge-tts', '/bin/pip')} install --quiet edge-tts`, {
    cwd: root, stdio: 'inherit',
  });
  return join(root, edgeBin());
}

async function edgeListVoices(bin) {
  const out = execSync(`"${bin}" --list-voices`, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 });
  const lao = out.split('\n').filter((l) => l.startsWith('lo-LA'));
  console.log(lao.length ? lao.join('\n') : out.split('\n').slice(0, 5).join('\n') + '\n… (no lo-LA voices found)');
}

function edgeSynthesize(bin, text, out) {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, ['--voice', VOICE, '--text', text, '--write-media', out, '--no-progress'], {
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    let err = '';
    p.stderr.on('data', (d) => { err += d; });
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`edge-tts exit ${code}${err ? ': ' + err.split('\n')[0].slice(0, 140) : ''}`))));
  });
}

// ---------- provider: azure (official API) ----------

async function azureListVoices() {
  const endpoint = process.env.AZURE_SPEECH_ENDPOINT || `https://${process.env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com`;
  const r = await fetch(`${endpoint}/cognitiveservices/voices/list`, {
    headers: { 'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY },
  });
  if (!r.ok) throw new Error(`voices list ${r.status}`);
  const text = await r.text();
  for (const m of text.match(/[^<>]*lo-LA-[^<>&'"]*Neural/g) || []) console.log('  ', m);
  if (!text.includes('lo-LA')) console.log('No lo-LA voices found for this key/region.');
}

async function azureSynthesize(text, out) {
  const endpoint = process.env.AZURE_SPEECH_ENDPOINT || `https://${process.env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com`;
  const r = await fetch(`${endpoint}/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'hianlao-audio-generator',
    },
    body: `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='lo-LA'>`
      + `<voice name='${VOICE}'>${escapeXml(text)}</voice></speak>`,
  });
  if (!r.ok) {
    const details = await r.text().catch(() => '');
    throw new Error(`azure tts ${r.status}${details ? ': ' + details.slice(0, 120) : ''}`);
  }
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 800) throw new Error('suspiciously small audio');
  writeFileSync(out, buf);
}

// ---------- orchestration ----------

function writeManifest(ids) {
  const generatedAt = new Date().toISOString();
  const src = `// GENERATED by \`npm run audio\` (scripts/generate-audio.mjs) — do not edit by hand.\n`
    + `// Lists the ids (vocab entries + alphabet letters) that have a native-sounding\n`
    + `// audio file in public/audio/ (origin: Microsoft neural TTS, ${VOICE}).\n`
    + `// Re-run the script after adding words or letters.\n`
    + `export const AUDIO_INFO = {\n  provider: ${JSON.stringify(PROVIDER)},\n  voice: ${JSON.stringify(VOICE)},\n  generatedAt: ${JSON.stringify(generatedAt)},\n};\n`
    + `export const AUDIO_FILES = new Set(${JSON.stringify([...ids].sort(), null, 0).replace(/"/g, "'")});\n`;
  writeFileSync(MANIFEST, src);
  console.log(`\nManifest updated: ${ids.size} audio files → src/data/audio-manifest.ts`);
}

async function main() {
  if (flag('--list')) {
    await (PROVIDER === 'azure' ? azureListVoices() : edgeListVoices(await ensureEdgeEngine()));
    return;
  }

  const only = opt('--only', null);
  const onlySet = only ? new Set(only.split(',').map((s) => s.trim())) : null;
  const force = flag('--force');
  const allItems = [...VOCAB, ...ALPHA_ITEMS];
  const targets = onlySet ? allItems.filter((v) => onlySet.has(v.id)) : allItems;
  const missing = onlySet ? [...onlySet].filter((id) => !targets.find((v) => v.id === id)) : [];
  if (missing.length) {
    console.error(`Unknown vocab id(s): ${missing.join(', ')}`);
    process.exit(1);
  }

  if (flag('--dry-run')) {
    const pending = targets.filter((v) => force || !existsSync(join(outDir, `${v.id}.mp3`)));
    console.log(`Provider: ${PROVIDER} | Voice: ${VOICE} | ${targets.length} vocab entries, ${pending.length} to synthesize (~${Math.ceil(targets.reduce((n, v) => n + v.lao.length, 0) / 1000 * 10) / 10}k chars).`);
    return;
  }

  if (PROVIDER === 'azure' && !(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION)) {
    console.error('Azure provider selected but AZURE_SPEECH_KEY / AZURE_SPEECH_REGION are missing.');
    console.error('Either drop them (see public/audio/README.md) or use the default keyless edge provider: npm run audio');
    process.exit(1);
  }
  const edgeEngine = PROVIDER === 'edge' ? await ensureEdgeEngine() : null;

  let written = 0, skipped = 0, failed = 0;
  for (const v of targets) {
    const file = join(outDir, `${v.id}.mp3`);
    if (!force && existsSync(file) && statSync(file).size > 800) { skipped++; continue; }
    let done = false;
    for (let attempt = 1; attempt <= 3 && !done; attempt++) {
      try {
        if (PROVIDER === 'edge') await edgeSynthesize(edgeEngine, v.lao, file);
        else await azureSynthesize(v.lao, file);
        if (statSync(file).size < 800) throw new Error('empty audio result');
        written++;
        done = true;
      } catch (e) {
        if (attempt === 3) { failed++; console.error(`  ✘ ${v.id}: ${e.message}`); }
        else await sleep(1500 * attempt * attempt);
      }
    }
    if (written && written % 25 === 0) console.log(`  … ${written} new / ${targets.length}`);
    await sleep(300 + Math.floor(Math.random() * 400)); // polite pacing
  }

  // Manifest = every generated id that now has a file (new, skipped, and
  // pre-existing): vocab entries and alphabet letters alike.
  const ids = new Set();
  for (const v of allItems) {
    const f = join(outDir, `${v.id}.mp3`);
    if (existsSync(f) && statSync(f).size > 800) ids.add(v.id);
  }
  const strays = readdirSync(outDir).filter((f) => f.endsWith('.mp3') && !ids.has(f.replace(/\.mp3$/, '')));
  if (strays.length) console.warn(`Note: ${strays.length} file(s) in public/audio/ don't match a vocab id: ${strays.join(', ')}`);
  writeManifest(ids);

  console.log(`Done. Written: ${written}, already present: ${skipped}, failed: ${failed}.`);
  console.log('Review the diff (git status assets/audio), listen to a few files, then commit.');
  if (failed > 0) { console.log('Some files failed — re-running the script resumes where it stopped.'); process.exit(1); }
}

// voice + provider (after flag parsing, before main)
const AZURE_ENV = Boolean(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION);
const PROVIDER = opt('--provider', AZURE_ENV ? 'azure' : 'edge');
const VOICE = opt('--voice', process.env.TTS_VOICE || 'lo-LA-KeomanyNeural'); // female; alternative: lo-LA-ChanthavongNeural (male)
const MANIFEST = join(root, 'src/data/audio-manifest.ts');

await main();
