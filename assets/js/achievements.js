// Achievements (badges) computed from local progress state.
import { getState, totalDone } from './store.js';
import { UNITS } from './data/units.js';

const totalLessons = UNITS.reduce((n, u) => n + u.lessons.length, 0);

export const ACHIEVEMENTS = [
  { id: 'first-step', icon: '👣', name: 'First step', desc: 'Complete your first lesson', check: s => totalDone() >= 1 },
  { id: 'hello-lao', icon: '🙏', name: 'Sabaidee!', desc: 'Finish Unit 1', check: s => UNITS[0].lessons.every(l => s.done[l.id]) },
  { id: 'xp50', icon: '⚡', name: 'Warming up', desc: 'Earn 50 XP', check: s => s.xp >= 50 },
  { id: 'xp200', icon: '🔥', name: 'On fire', desc: 'Earn 200 XP', check: s => s.xp >= 200 },
  { id: 'xp500', icon: '💎', name: 'Lao scholar', desc: 'Earn 500 XP', check: s => s.xp >= 500 },
  { id: 'xp1000', icon: '🏆', name: 'HianLao master', desc: 'Earn 1,000 XP', check: s => s.xp >= 1000 },
  { id: 'streak3', icon: '📅', name: '3-day streak', desc: 'Practice 3 days in a row', check: s => s.streak >= 3 },
  { id: 'streak7', icon: '🗓️', name: 'Week warrior', desc: 'Practice 7 days in a row', check: s => s.streak >= 7 },
  { id: 'streak30', icon: '🌟', name: 'Unstoppable', desc: 'Practice 30 days in a row', check: s => s.streak >= 30 },
  { id: 'lessons10', icon: '📚', name: 'Bookworm', desc: 'Complete 10 lessons', check: s => totalDone() >= 10 },
  { id: 'lessons-all', icon: '🎓', name: 'Graduated!', desc: `Complete all ${totalLessons} lessons`, check: s => totalDone() >= totalLessons },
];

export function unlockedAchievements() {
  const s = getState();
  return ACHIEVEMENTS.filter(a => a.check(s));
}

export function lockedAchievements() {
  const s = getState();
  return ACHIEVEMENTS.filter(a => !a.check(s));
}
