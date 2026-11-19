// The Lao script, taught the way Duolingo teaches kana: small groups of
// glyphs, each glyph paired with its sound, repeated in both directions
// (shape → sound and sound → shape) until it sticks.
//
// Data model:
//   - Consonants carry their bare initial sound (k, kh, s, …).
//   - Vowel signs are never shown alone (many wrap around the consonant), so
//     every vowel is stored attached to ກ as a carrier: ກາ = "kaa".
//   - `roman` follows the site-wide karaoke convention: lowercase, hyphens
//     between syllables; single sounds have no hyphen.
//
// Needs-native-review:
//   - ກອ is rendered "kor" to keep it distinct from ໂກ "ko" (the close
//     /ɔː/ vs /oː/ pair). "or"-style renderings are common in learner
//     charts, but a native eye should confirm.
//   - ອ is listed with roman "o" (its cited value in learner charts); it is
//     really the vowel carrier with no sound of its own.
//   - The duplicated sounds (ຂ/ຄ, ສ/ຊ, ຖ/ທ, ຜ/ພ, ຝ/ຟ, ຫ/ຮ) are the script's
//     etymological doubles; their notes say so in plain learner language.

export interface AlphaLetter {
  /** the glyph (consonant) or carrier syllable (vowel-set letter) */
  lao: string;
  /** sound / karaoke romanization of the glyph or syllable */
  roman: string;
  /** optional learner hint, shown on the intro card */
  note?: string;
  noteFr?: string;
}

export interface AlphaGroup {
  id: string;
  kind: 'consonants' | 'vowels';
  letters: AlphaLetter[];
}

export const CONSONANT_GROUPS: AlphaGroup[] = [
  {
    id: 'c1', kind: 'consonants',
    letters: [
      { lao: 'ກ', roman: 'k', note: 'Like the g in "go" — no puff of air.', noteFr: 'Comme le g de « go » — sans souffle.' },
      { lao: 'ຂ', roman: 'kh', note: 'A k with a puff of air (aspirated).', noteFr: 'Un k avec un souffle d’air (aspiré).' },
      { lao: 'ຄ', roman: 'kh', note: 'Same sound as ຂ — mostly in loanwords.', noteFr: 'Même son que ຂ — surtout dans les mots d’emprunt.' },
      { lao: 'ງ', roman: 'ng', note: 'Ends of "singing", at the start: n-go.', noteFr: 'Le « ng » de « parking », placé au début d’une syllabe.' },
      { lao: 'ຈ', roman: 'ch', note: 'Like j in "jam" in Vientiane speech.', noteFr: 'Comme le j de « jam » dans la prononciation de Vientiane.' },
    ],
  },
  {
    id: 'c2', kind: 'consonants',
    letters: [
      { lao: 'ສ', roman: 's', note: 'The everyday s.', noteFr: 'Le s du quotidien.' },
      { lao: 'ຊ', roman: 's', note: 'Same sound as ສ — mostly in loanwords.', noteFr: 'Même son que ສ — surtout dans les mots d’emprunt.' },
      { lao: 'ຍ', roman: 'ny', note: 'Like ny in "canyon".', noteFr: 'Comme « gn » dans « montagne ».' },
      { lao: 'ດ', roman: 'd', note: 'Like d in "door".', noteFr: 'Comme le d de « dame ».' },
      { lao: 'ຕ', roman: 't', note: 'A plain t — no puff of air.', noteFr: 'Un t simple — sans souffle.' },
    ],
  },
  {
    id: 'c3', kind: 'consonants',
    letters: [
      { lao: 'ຖ', roman: 'th', note: 'Like the t of "stop", with a light puff.', noteFr: 'Le t de « stop », avec un léger souffle.' },
      { lao: 'ທ', roman: 'th', note: 'Same sound as ຖ — mostly in loanwords.', noteFr: 'Même son que ຖ — surtout dans les mots d’emprunt.' },
      { lao: 'ນ', roman: 'n', note: 'Like n in "no".', noteFr: 'Comme le n de « non ».' },
      { lao: 'ບ', roman: 'b', note: 'Like b in "be".', noteFr: 'Comme le b de « bon ».' },
      { lao: 'ປ', roman: 'p', note: 'A plain p — no puff of air.', noteFr: 'Un p simple — sans souffle.' },
    ],
  },
  {
    id: 'c4', kind: 'consonants',
    letters: [
      { lao: 'ຜ', roman: 'ph', note: 'A p with a puff of air — never like "phone".', noteFr: 'Un p avec un souffle — jamais le f de « photo ».' },
      { lao: 'ຝ', roman: 'f', note: 'Like f in "fan".', noteFr: 'Comme le f de « fan ».' },
      { lao: 'ພ', roman: 'ph', note: 'Same sound as ຜ — mostly in loanwords.', noteFr: 'Même son que ຜ — surtout dans les mots d’emprunt.' },
      { lao: 'ຟ', roman: 'f', note: 'Same sound as ຝ — mostly in loanwords.', noteFr: 'Même son que ຝ — surtout dans les mots d’emprunt.' },
      { lao: 'ມ', roman: 'm', note: 'Like m in "moon".', noteFr: 'Comme le m de « lune ».' },
    ],
  },
  {
    id: 'c5', kind: 'consonants',
    letters: [
      { lao: 'ຢ', roman: 'y', note: 'Like y in "yes".', noteFr: 'Comme le y de « yes ».' },
      { lao: 'ຣ', roman: 'r', note: 'Rare — loans and formal writing; ລ does daily duty.', noteFr: 'Rare — emprunts et écriture formelle ; ລ fait le quotidien.' },
      { lao: 'ລ', roman: 'l', note: 'L and r are both said somewhere between l and r.', noteFr: 'L et r se prononcent entre le l et le r français.' },
      { lao: 'ຫ', roman: 'h', note: 'Like h in "hat".', noteFr: 'Comme le h de « hat ».' },
      { lao: 'ອ', roman: 'o', note: 'The vowel carrier: no sound alone, it holds vowels like ອາ (aa).', noteFr: 'Le porteur de voyelle : muet seul, il soutient les voyelles comme dans ອາ (aa).' },
    ],
  },
  {
    id: 'c6', kind: 'consonants',
    letters: [
      { lao: 'ຮ', roman: 'h', note: 'Same sound as ຫ — the everyday h.', noteFr: 'Même son que ຫ — le h du quotidien.' },
      { lao: 'ວ', roman: 'w', note: 'Like w in "we".', noteFr: 'Comme le w de « ouate ».' },
    ],
  },
];

// Vowel sets, each sign shown on the carrier ກ. Displayed syllables are what
// the learner drills; the vowel sign itself is highlighted by position.
export const VOWEL_GROUPS: AlphaGroup[] = [
  {
    id: 'v1', kind: 'vowels',
    letters: [
      { lao: 'ກະ', roman: 'ka', note: 'Short a, as in "ah!".', noteFr: 'a bref, comme dans « ah ! ».' },
      { lao: 'ກາ', roman: 'kaa', note: 'Long aa, held twice as long.', noteFr: 'aa long, tenu deux fois plus longtemps.' },
      { lao: 'ກິ', roman: 'ki', note: 'Short i, as in "ship".', noteFr: 'i bref, comme dans « ship ».' },
      { lao: 'ກີ', roman: 'kii', note: 'Long ii, as in "see".', noteFr: 'ii long, comme dans « see ».' },
      { lao: 'ກຸ', roman: 'ku', note: 'Short u, as in "book".', noteFr: 'ou bref, comme dans « bouque ».' },
      { lao: 'ກູ', roman: 'kuu', note: 'Long uu, as in "school".', noteFr: 'ou long, comme dans « boue ».' },
    ],
  },
  {
    id: 'v2', kind: 'vowels',
    letters: [
      { lao: 'ເກ', roman: 'ke', note: 'The e sign sits BEFORE its consonant.', noteFr: 'Le signe e se place AVANT la consonne.' },
      { lao: 'ແກ', roman: 'kee', note: 'Double e sign — a long open eh, as in "bare".', noteFr: 'Double signe e — un è long, comme dans « maître ».' },
      { lao: 'ໂກ', roman: 'ko', note: 'The o sign sits BEFORE its consonant.', noteFr: 'Le signe o se place AVANT la consonne.' },
      { lao: 'ກອ', roman: 'kor', note: 'Written with ອ after the consonant; a rounder aw than ໂກ.', noteFr: 'Écrit avec ອ après la consonne ; un « aw » plus rond que ໂກ.' },
      { lao: 'ໄກ', roman: 'kai', note: 'ai — as in ໄກ່ (kai, chicken).', noteFr: 'aï — comme dans ໄກ່ (kai, poulet).' },
      { lao: 'ໃກ', roman: 'kai', note: 'Said the same as ໄກ today; you will meet it inside words.', noteFr: 'Prononcé comme ໄກ aujourd’hui ; présent dans de nombreux mots.' },
    ],
  },
  {
    id: 'v3', kind: 'vowels',
    letters: [
      { lao: 'ກາມ', roman: 'kam', note: 'Syllables can end in m: kam.', noteFr: 'Une syllabe peut finir par m : kam.' },
      { lao: 'ການ', roman: 'kan', note: '…or in n: kan.', noteFr: '…ou par n : kan.' },
      { lao: 'ກອງ', roman: 'kong', note: '…or in ng: kong.', noteFr: '…ou par ng : kong.' },
      { lao: 'ກາຍ', roman: 'kai', note: '…or in y: kai.', noteFr: '…ou par y : kai.' },
      { lao: 'ກາວ', roman: 'kao', note: '…or in w, heard as ao: kao.', noteFr: '…ou par w, entendu « ao » : kao.' },
    ],
  },
];

export const ALPHA_GROUPS: AlphaGroup[] = [...CONSONANT_GROUPS, ...VOWEL_GROUPS];

export function groupById(id: string): AlphaGroup | undefined {
  return ALPHA_GROUPS.find((g) => g.id === id);
}

export const ALL_LETTERS: AlphaLetter[] = ALPHA_GROUPS.flatMap((g) => g.letters);
