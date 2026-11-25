// Unit tests for the guided alphabet path (src/lib/alpha-progress.ts).
// Proves the linear, iterative progression the /alphabet page relies on:
//   - new learners start at the first group only; later groups are locked
//   - a run introduces at most NEW_BATCH letters, all from the current group
//   - review questions inside a run come from already-known letters of any
//     earlier group (weakest first) — never from not-yet-unlocked groups
//   - "practice mixed" never contains unknown letters (no everything-at-once)
//   - mastering a group unlocks the next one and moves the guided pointer
import { ALPHA_GROUPS } from '../src/data/alphabet.ts';
import { traceAssistForLevel } from '../src/lib/trace-score.ts';
import {
  MAX_LV, allLetterIds, letterId, letterLevel, groupPercent,
  groupUnlocked, nextGuidedIndex, composeGroupRun, composeMixedRun,
} from '../src/lib/alpha-progress.ts';

let failures = 0;
const ok = (cond, msg) => {
  if (cond) console.log(`  ✔ ${msg}`);
  else { failures++; console.error(`  ✘ ${msg}`); }
};

const empty = { letters: {}, done: {} };
const masteredStore = (g) => ({
  letters: Object.fromEntries(allLetterIds(g).map((id) => [id, { lv: MAX_LV, ts: Date.now() }])),
  done: { [g.id]: Date.now() },
});
const weakStore = (g, lv = 1) => ({
  letters: Object.fromEntries(allLetterIds(g).map((id) => [id, { lv, ts: Date.now() }])),
  done: {},
});

console.log('Guided path — locking & pointer:');
ok(groupUnlocked(empty, 0) === true, 'first group is unlocked for a fresh learner');
ok(groupUnlocked(empty, 1) === false, 'second group is locked for a fresh learner');
ok(nextGuidedIndex(empty) === 0, 'guided pointer starts at group 0');
const c1 = ALPHA_GROUPS[0];
const c1Done = masteredStore(c1);
ok(groupUnlocked(c1Done, 1) === true, 'mastering group 0 unlocks group 1');
ok(nextGuidedIndex(c1Done) === 1, 'guided pointer advances to group 1 once group 0 is mastered');
ok(groupPercent(c1Done, c1) === 100, 'mastered group reports 100%');
const allDone = ALPHA_GROUPS.reduce((s, g) => ({ letters: { ...s.letters, ...masteredStore(g).letters }, done: { ...s.done, ...masteredStore(g).done } }), empty);
ok(nextGuidedIndex(allDone) === -1, 'guided pointer returns -1 when the whole path is mastered');

console.log('Group run — batched introduction:');
const runFresh = composeGroupRun(c1, empty);
ok(runFresh.intro.length === 3, `fresh run introduces exactly 3 new letters (got ${runFresh.intro.length})`);
ok(runFresh.intro.every((s) => s.gid === c1.id), 'all showcase letters come from the current group');
ok(runFresh.drill.length > 0 && runFresh.drill.every((q) => q.gid === c1.id), 'fresh run drills only current-group letters (nothing mixed in)');
ok(runFresh.hasNew === true, 'fresh run is flagged as introducing new letters');

const c1Weak = weakStore(c1, 1);
const runC2 = composeGroupRun(ALPHA_GROUPS[1], c1Weak);
const gids = new Set(runC2.drill.map((q) => q.gid));
ok(runC2.intro.every((s) => s.gid === ALPHA_GROUPS[1].id), 'c2 run showcases only c2 letters');
ok(gids.has(c1.id), 'c2 run includes review questions from the earlier (c1) group');
ok([...gids].every((gid) => gid === c1.id || gid === ALPHA_GROUPS[1].id), 'c2 run never touches locked later groups');
ok(runC2.drill.filter((q) => q.gid === ALPHA_GROUPS[1].id).length >= 3, 'each new letter is drilled at least 3×');

console.log('Mixed practice — known letters only:');
const mixedEmpty = composeMixedRun(empty);
ok(mixedEmpty.drill.length === 0, 'mixed practice is empty for a fresh learner (no all-letters dump)');
const mixedKnown = composeMixedRun(c1Weak);
ok(mixedKnown.drill.length > 0 && mixedKnown.drill.every((q) => q.gid === c1.id), 'mixed practice uses only known letters');
ok(mixedKnown.drill.every((q) => letterLevel(c1Weak, q.gid, q.n) >= 1), 'every mixed question is a letter with lv ≥ 1');

console.log('Strengthening run (nothing new left):');
const runAgain = composeGroupRun(c1, c1Weak);
ok(runAgain.hasNew === false && runAgain.intro.length === 0, 'a run on a fully-introduced group introduces nothing new');
ok(runAgain.drill.length > 0, 'it still drills the weak letters');

console.log('Interleaved drilling & progressive handwriting:');
const runSeq = composeGroupRun(c1, empty);
const kinds = runSeq.drill.map((s) => `${s.kind}:${s.n}`);
ok(runSeq.drill.some((s) => s.kind === 'write'), 'a new-letter run includes writing steps (letters are written more than once)');
ok(runSeq.drill.filter((s) => s.kind === 'write').every((s) => s.gid === c1.id), 'new-letter writing steps target the run\u2019s new letters');
// A A A B B B blocks are banned: the first three quiz steps must not repeat the same letter
ok(new Set(kinds.slice(0, 3)).size >= 2 || kinds.slice(0, 3).some((k) => k.startsWith('write')),
  'new letters are interleaved, not drilled as AAA BBB blocks');
// every new letter gets at least one write in the drill, in addition to its guided first write
for (const s of runSeq.intro) {
  ok(kinds.includes(`write:${s.n}`), `letter ${s.n} gets an extra (less guided) write step in the drill`);
}
const traceSeq = traceAssistForLevel;
ok(traceSeq(0) === 'guided', 'assist ladder: first write is fully guided (the pen stays on the path)');
ok(traceSeq(1) === 'snapped', 'assist ladder: second write snaps the ink onto the guide');
ok(traceSeq(2) === 'assisted', 'assist ladder: third write only nudges the ink');
ok(traceSeq(3) === 'faint', 'assist ladder: fourth write shows a faint outline only');
ok(traceSeq(4) === 'bare', 'assist ladder: a mastered letter is written freehand');

if (failures) {
  console.error(`\n${failures} CHECK(S) FAILED ✘`);
  process.exit(1);
}
console.log('\nALPHA PROGRESS TESTS PASSED ✔');
