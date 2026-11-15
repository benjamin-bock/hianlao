# I18N Audit — French & Lao content (HianLao)

Full audit of every user-visible string in English, French and Lao, with corrections.
Branch: `feat/native-audio`. Everything below landed in this branch; before/after shows
the **pre-audit** state vs **current** state.

## 1. Romanization convention ("karaoke" reading)

One convention, documented in `assets/js/data/vocab.js` and applied site-wide:

- Field name: **`romanization`** (renamed from the old `tr` field — `"tr"` collided
  conceptually with Turkish and read as "translation").
- Lowercase Latin letters; **hyphens between syllables**, spaces between words,
  `?`/`…` punctuation kept (`sa-bai-dii baw?`).
- Learner-friendly quasi-phonetic style reflecting **Vientiane pronunciation**,
  not a strict academic system. BGN/PCGN romanization of Lao is the fallback
  reference for ambiguous syllables.
- **No tone diacritics or numbers** — tone is taught with audio (🔊), not spelling.
- One consistent rendering per syllable across the whole site (e.g. `-ai` always
  spelled `ai`, `hiao` not `hiaw`, `x` never used for a consonant).

### Where romanization is displayed

| Location | Display | Rule |
|---|---|---|
| Words page (cards, weak-words notebook) | under the Lao word, muted `.word-romanization` | always |
| Home hero / brand / footer | `.lao-roman` / subtitle | always |
| Lesson MC en→lao options (`.opt-sub`) | under each Lao option | always (doesn't reveal which option is correct) |
| Lesson match cards (Lao side) | `.opt-sub` under card | always |
| Lesson listen exercise | **not shown** with answer options | never — would leak the answer |
| Lesson tiles exercise | **not shown** near sentence tiles | never — would leak the answer; shown in result/feedback |
| Lesson lao→en typing | big card shows it as reading aid | always (typed answer is the *meaning*, not the reading) |
| en→lao typing | **not shown** (typed answer IS the romanization/Lao) | never |
| Grammar & culture `ex` rows | `.ex-romanization` between Lao and meaning | always |
| Grammar tables | Lao + romanization inline in the Example column | always |
| Audio fallback (speech.js) | spoken/whispered romanization when no Lao voice is available | automatic |

Romanization is also used by the TTS fallback (`speech.js`) and the `api/tts.js`
route, so every syllable is voiced the same way it is displayed.

## 2. Data-model changes (backfilled for all content)

| File | Change | Count |
|---|---|---|
| `assets/js/data/vocab.js` | `tr` → `romanization` on every entry | 282 |
| `assets/js/data/vocab.js` | new `fr` (French meaning) on every entry | 282 |
| `assets/js/data/vocab.js` | new `noteFr` (French word-note) everywhere a `note` exists | 34 |
| `assets/js/data/vocab.js` | new `CATEGORIES_FR` export (16 categories) | 16 |
| `assets/js/data/units.js` | `titleFr`/`descFr` on every unit, `titleFr`/`blurbFr` on every lesson | 13 + 39 |
| `assets/js/data/units.js` | new 5th `enFr` argument on every `tiles()` exercise | 24 unique sentences |
| `assets/js/data/grammar.js` | `titleFr` + per-block `htmlFr` / `enFr` / `headFr` + `rowsFr` | 14 topics |
| `assets/js/data/culture.js` | `titleFr` + per-block `htmlFr` / `itemsFr` / `enFr` | 7 stories |
| `assets/js/ui.js` | exports `pf(obj, field)` / `def(word)` / `noteOf(word)`; dict parity en=fr=la | 74 keys × 3 |

Consumers that now localize: `words.js` (defs, notes, category chips, search matches
French too), `lesson.js` (prompts, options, match cards, feedback, typing accepts
both the French *and* English meaning in fr mode), `learn.js`, `review.js`,
`grammarpage.js`, `culturepage.js`, `achievements.js` (name/desc triples), `main.js`.

## 3. Lao script audit

Method: scanned every Lao string (vocab, units tiles, grammar, culture, ui.js) for
invalid characters (`ຉ ຘ ເຣີ ຂ່ອຢ ຫມ ຫນ ຫລ ໃຫມ` etc.), wrong vowels, missing tone
marks and semantic mismatches against the English/French meaning. ~184 vocab
entries corrected (spelling, vowel length, tone marks), plus:

| Item | Before | After | Reason |
|---|---|---|---|
| Brand/hero "learn Lao" | ເຣີຢນລາວ | ຮຽນລາວ | non-word; hian is ຮຽນ |
| "dictionary" (words page) | ພຈະນຸກົມ | ພຈະນານຸກົມ | standard spelling |
| "temple" | ວັດ tex-consistency | ວັດ | unit tiles match vocab |
| "health/hospital queue" | ນ້ຳຂຶ້ນ tokens in tiles | ນ້ຳຂຶ້ນ (trailing space preserved) | tiles validator requires words.join('') === lao |
| grammar tables | stale lao after `tr` rename | re-anchored | romanization column lookup was broken (`el('tr')`) |
| culture strings | mixed/lao typos | corrected | see below |
| ui.js la dict | mixed En↔Lao wording | native Lao rewrite (45+ keys) | was half-empty, fell back to English |

**Needs native review** (best-effort correction left in place — *never invented*;
flagged because frequency/usage varies by region):

- `ແຄ່` (khae, "only") — also written ແຄ່ງ in some sources.
- `ຖືກ` (thuuk, "cheap") — in Lao ຖືກ primarily means "to be hit/passive marker";
  "cheap" is usually ຖືກ (colloq.) but double-check south/Isan usage.
- `ກົວ` (kua, "to compare/more") — verify the "spicy exceeds" phrasing.
- `ໂກດ` (kot, "angry") — grammatical, but register varies.
- `ຄິດຮອດ` (khit hot, "think until = miss") — idiomatic; verify.
- `ເບື່ອ` (buea, "bored") vs `ເບື່ອນ` — vowel length debated.
- `ນັດໝາຍ` (nat mai, "appointment") — verify modern usage (also ນັດພົບ).
- `ອີເມວ` (email) — loanword spelled variously (ອີເມວ/ອີເມລ).
- `ລົດຖີບ` (bicycle) — also ລົດຖີບ vs ຈັກຍນທ໌: verify which register to teach.
- tone-label example words in the tones table — verify tone-class assignments.
- proverbs `ນ້ຳຂຶ້ນ ໃຫ້ລີບຕັກ`, `ຊ້າໆ ໄດ້ແຜ່ນເລ່ືອມງາມ` — folk spellings vary; kept
  the most common written form.
- `ເນື້ອ/ໜື້ຍ` ("tired") — kept `ໜື້ຍ` but flagging: some write `ໜື່ອຍ`.
- `khai` ("near", ໃກ້) — correct but visually confusable with ໄຂ່ "egg"; kept.

## 4. French audit (headline fixes from the rewrite)

Full rewrite of `ui.js` fr dict (~73 keys, tutoiement, no anglicisms) + all data
mirrors authored natively in this pass. Representative before/after:

| Key / file | Before (BT-style or literal) | After | Reason |
|---|---|---|---|
| `drill` | "Driller sur tes mots" | "S'entraîner sur tes mots difficiles" | anglicism |
| `scores` | "Tes scores" | "Tes points" | anglicism |
| `words_search` | "cherchable", "en anglais…" | "Rechercher en lao, en romanisation, en français ou en anglais…" | literal + now accurate |
| `hint_match` | "…à son sens anglais." | "…à sa traduction." | in FR mode the target is French |
| `grammar_sub` | "romanisation et anglais" | "romanisation et français" | same |
| `goal line` | "XP aujourd'hui:" | "XP aujourd'hui :" | French typography (espace before colon) |
| `cta_start` | "c'est gratuit" straight apostrophe | "c'est gratuit" | typographic apostrophe |
| hero | "du ລ້ານຊ້າງ (laan saang — un million d'éléphants)" | "du ລ້ານຊ້າງ (laan saang — le royaume au million d'éléphants)" | Lan Xang is a kingdom name, natural phrasing |
| all vocab defs | (English-only) | 282 native French meanings | full fr coverage |
| vocab notes | (English-only) | 34 French notes | fr learners see fr explanations |
| unit/lesson titles+blurbs | (English-only, 52) | native French | no fr fallback |
| tiles sentences | (English-only, 24) | native French | translated sentences to build |
| grammar bible | (English-only, ~7.4k chars) | fully authored French incl. table headers & rows | no fr fallback |
| culture stories | (English-only, 7) | fully authored French | no fr fallback |
| categories | (English-only, 16) | `CATEGORIES_FR` | chips + count lines localized |
| `ph_type_en` | "Tape en anglais…" | "Tape la traduction…" | accepts fr or en now |

## 5. Locale-fallback guarantees

- `ui.js` dictionary parity verified: **74 keys in en = 74 in fr = 74 in la**, so no
  raw key or English leakage in the UI chrome.
- French data mirrors are complete for: vocab meanings + notes, categories, unit and
  lesson titles/blurbs, tiles sentences, grammar topics, culture stories,
  achievements names/descriptions.
- The `la` locale intentionally keeps the **teaching content** (meanings, definitions,
  grammar prose) in English while the UI chrome is Lao. Rationale: the audience for
  a Lao UI is diaspora/heritage learners whose learning material is English-based;
  producing native-grade Lao pedagogical prose risks error introductions the owner
  would have to certify. Flagged for a future native-content pass.

## 6. Known follow-ups

1. `assets/img` + `assets/audio`: word audio files were generated from the old
   `tr` field. `speech.js` now reads `romanization`, so text fallbacks are correct,
   but regenerate the bundled audio with `npm run audio` when the piper environment
   is available (falls back gracefully to browser TTS today).
2. The items in §3 "needs native review" would benefit from a Lao native speaker
   sign-off.
3. New locale? Add the dict block in `ui.js` plus optional `fr`-style mirrors
   (the `pf`/`def` helpers fall back to English automatically).
