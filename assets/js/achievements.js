// Achievements (badges) computed from local progress state.
// name/desc are {en, fr, la} triples, resolved by the current UI language.
import { getState, totalDone } from './store.js';
import { getLang } from './ui.js';
import { UNITS } from './data/units.js';

const totalLessons = UNITS.reduce((n, u) => n + u.lessons.length, 0);
const L = (en, fr, la) => ({ en, fr, la });

export const ACHIEVEMENTS = [
  { id: 'first-step', icon: '👣', name: L('First step', 'Premier pas', 'ກ້າວທຳອິດ'), desc: L('Complete your first lesson', 'Termine ta première leçon', 'ຮຽນບົດຮຽນທຳອິດສຳເລັດ'), check: s => totalDone() >= 1 },
  { id: 'hello-lao', icon: '🙏', name: L('Sabaidee!', 'Sabaidee !', 'ສະບາຍດີ!'), desc: L('Finish Unit 1', 'Termine l’unité 1', 'ເຮັດໜ່ວຍ 1 ຈົນສໍາເລັດ'), check: s => UNITS[0].lessons.every(l => s.done[l.id]) },
  { id: 'xp50', icon: '⚡', name: L('Warming up', 'Ça chauffe', 'ລະອຸ້ມຂຶ້ນ'), desc: L('Earn 50 XP', 'Gagne 50 XP', 'ສະສົມ 50 XP'), check: s => s.xp >= 50 },
  { id: 'xp200', icon: '🔥', name: L('On fire', 'En feu', 'ມື້ບໍ່ຢຸດ'), desc: L('Earn 200 XP', 'Gagne 200 XP', 'ສະສົມ 200 XP'), check: s => s.xp >= 200 },
  { id: 'xp500', icon: '💎', name: L('Lao scholar', 'Érudit lao', 'ນັກປະລັນລາວ'), desc: L('Earn 500 XP', 'Gagne 500 XP', 'ສະສົມ 500 XP'), check: s => s.xp >= 500 },
  { id: 'xp1000', icon: '🏆', name: L('HianLao master', 'Maître HianLao', 'ຊາວຄອບຄຸມ HianLao'), desc: L('Earn 1,000 XP', 'Gagne 1 000 XP', 'ສະສົມ 1,000 XP'), check: s => s.xp >= 1000 },
  { id: 'streak3', icon: '📅', name: L('3-day streak', 'Série de 3 jours', '3 ວັນຕິດຕໍ່'), desc: L('Practice 3 days in a row', 'Pratique 3 jours d’affilée', 'ຝຶກ 3 ວັນຕິດຕໍ່ກັນ'), check: s => s.streak >= 3 },
  { id: 'streak7', icon: '🗓️', name: L('Week warrior', 'Guerrier de la semaine', 'ນັກຝຶກປະຈຳອາທິດ'), desc: L('Practice 7 days in a row', 'Pratique 7 jours d’affilée', 'ຝຶກ 7 ວັນຕິດຕໍ່ກັນ'), check: s => s.streak >= 7 },
  { id: 'streak30', icon: '🌟', name: L('Unstoppable', 'Implacable', 'ໝັ້ນແທ້ໆ'), desc: L('Practice 30 days in a row', 'Pratique 30 jours d’affilée', 'ຝຶກ 30 ວັນຕິດຕໍ່ກັນ'), check: s => s.streak >= 30 },
  { id: 'lessons10', icon: '📚', name: L('Bookworm', 'Rat de bibliothèque', 'ມັກອ່ານ'), desc: L('Complete 10 lessons', 'Termine 10 leçons', 'ຮຽນຄົບ 10 ບົດຮຽນ'), check: s => totalDone() >= 10 },
  { id: 'lessons-all', icon: '🎓', name: L('Graduated!', 'Diplômé·e !', 'ຈົບການຮຽນແລ້ວ!'), desc: L(`Complete all ${totalLessons} lessons`, `Termine les ${totalLessons} leçons`, `ຮຽນຄົບທຸກ ${totalLessons} ບົດຮຽນ`), check: s => totalDone() >= totalLessons },
];

// Resolve the {en, fr, la} triple for the current locale (English fallback).
export function localizeAch(a) {
  const lang = getLang();
  return { ...a, name: a.name[lang] || a.name.en, desc: a.desc[lang] || a.desc.en };
}

export function unlockedAchievements() {
  const s = getState();
  return ACHIEVEMENTS.filter(a => a.check(s)).map(localizeAch);
}

export function lockedAchievements() {
  const s = getState();
  return ACHIEVEMENTS.filter(a => !a.check(s)).map(localizeAch);
}
