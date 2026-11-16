// Shared data-model types for HianLao content.
// Field names mirror the legacy JS data files 1:1 so tests and the audio
// generator keep working with erasable-only TS (Node type stripping).

export type UiLang = 'en' | 'fr';

export type ExerciseDir = 'lao2en' | 'en2lao';

export interface VocabEntry {
  id: string;
  lao: string;
  romanization: string;
  en: string;
  fr: string;
  cat: string;
  note?: string;
  noteFr?: string;
  /** explicit audio filename override (defaults to <id>.mp3 when in the manifest) */
  audio?: string;
}

/**
 * Exercise union. The legacy data is written with helper factories whose
 * shapes this interface mirrors; runtime validation lives in tests and in
 * `validateUnits()` (units.ts).
 */
export interface Exercise {
  type: 'mc' | 'type' | 'match' | 'listen' | 'tiles' | 'speak';
  /** mc / type / listen */
  dir?: ExerciseDir;
  /** mc / match / listen option (or pair) vocab ids */
  ids?: string[];
  /** mc / listen correct answer id */
  answer?: string;
  /** type / speak vocab id */
  id?: string;
  /** tiles: full Lao sentence */
  lao?: string;
  /** tiles: sentence split into tap-tokens */
  words?: string[];
  /** tiles: karaoke romanization per token (same order as words) */
  wordRoman?: string[];
  /** tiles: English sentence */
  en?: string;
  /** tiles: full-sentence karaoke romanization */
  romanization?: string;
  /** tiles: French sentence */
  enFr?: string;
}

export interface Lesson {
  id: string;
  title: string;
  titleFr: string;
  blurb: string;
  blurbFr: string;
  exercises: Exercise[];
}

export interface Unit {
  id: string;
  num: number;
  icon: string;
  color: string;
  title: string;
  titleFr: string;
  desc: string;
  descFr: string;
  lessons: Lesson[];
}

export interface LessonWithUnit extends Lesson {
  unit: Unit;
}

export type GrammarBlock =
  | { t: 'p' | 'note'; html: string; htmlFr: string }
  | { t: 'ex'; lao: string; romanization: string; en: string; enFr: string }
  | { t: 'table'; head: string[]; headFr: string[]; rows: string[][]; rowsFr: string[][] }
  | { t: 'list'; items: string[]; itemsFr: string[] };

export interface GrammarDoc {
  id: string;
  icon: string;
  title: string;
  titleFr: string;
  blocks: GrammarBlock[];
}

export type CultureBlock = GrammarBlock;

export interface CultureStory {
  id: string;
  icon: string;
  img: string;
  title: string;
  titleFr: string;
  blocks: CultureBlock[];
}
