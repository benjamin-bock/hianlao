// UI prefs + i18n (EN / FR / LAO) + theme. Language choice reloads the page;
// theme applies instantly via [data-theme] on <html>.
const dict = {
  en: {
    nav_home: 'Home', nav_learn: 'Learn', nav_words: 'Words', nav_grammar: 'Grammar', nav_culture: 'Culture', nav_review: 'Review',
    sign_in: 'Sign in',
    hero_kicker: 'Free · Open-source · For the Lao diaspora 🌏',
    hero_sub: 'HianLao is a Duolingo-style learning site that is 100% free and open-source: lessons, grammar bible, vocabulary with audio, and Lao culture. No subscription, ever.',
    cta_start: "Start lesson 1 — it's free →", cta_continue: 'Continue learning →', cta_culture: 'Explore Lao culture',
    features_title: "What you get",
    feat_lessons: 'Duolingo-style lessons', feat_audio: 'Audio & voice', feat_grammar: 'Grammar bible', feat_words: 'Words & phrases', feat_culture: 'Culture', feat_account: 'Free accounts & sync', feat_free: 'Free & open-source',
    path_title: 'The learning path', open_path: 'Open the path →',
    learn_title: 'Learn Lao', learn_sub: 'lessons completed · progress is saved on this device',
    next_cta: 'Continue', lb_title: '🏆 Leaderboard', lb_all: 'All time', lb_week: 'This week', lb_signin: 'Sign in or create a free account', lb_join: 'to join the leaderboard.', lb_empty: 'No scores yet — be the first!',
    goal_title: '🎯 Daily goal', goal_today: 'XP today',
    review_title: 'Review', review_sub: 'Spaced repetition: lessons due for review', review_due: 'Due now', review_upcoming: 'Upcoming', review_none: 'Nothing due right now — great job keeping up! 🎉', review_start: 'Review now →',
    words_title: 'Words & phrases', words_sub: 'A searchable Lao–English dictionary. Press 🔊 to hear every word.',
    grammar_title: 'Grammar bible 📖', grammar_sub: 'Lao grammar explained simply, with Lao script + transliteration + English.',
    culture_title: 'Lao culture 🇱🇦', culture_sub: 'The stories behind the language: land, festivals, food, etiquette, diaspora.',
    account_title: 'Account', profile_title: 'Profile',
    check: 'CHECK', cont: 'CONTINUE', done_title: 'Lesson complete!', fail_title: 'Out of hearts!', next_lesson: 'Next lesson →', back_path: 'Back to path', replay: '↻ Replay', try_again: '↻ Try again',
  },
  fr: {
    nav_home: 'Accueil', nav_learn: 'Apprendre', nav_words: 'Mots', nav_grammar: 'Grammaire', nav_culture: 'Culture', nav_review: 'Révision',
    sign_in: 'Connexion',
    hero_kicker: 'Gratuit · Open-source · Pour la diaspora lao 🌏',
    hero_sub: "HianLao est un site d'apprentissage du lao façon Duolingo, 100 % gratuit et open-source : leçons, bible de grammaire, vocabulaire avec audio et culture lao. Sans abonnement, jamais.",
    cta_start: "Commencer la leçon 1 — c'est gratuit →", cta_continue: 'Continuer à apprendre →', cta_culture: 'Découvrir la culture lao',
    features_title: 'Ce que tu trouveras',
    feat_lessons: 'Leçons façon Duolingo', feat_audio: 'Audio & voix', feat_grammar: 'Bible de grammaire', feat_words: 'Mots & phrases', feat_culture: 'Culture', feat_account: 'Comptes gratuits & synchro', feat_free: 'Gratuit & open-source',
    path_title: "Le parcours d'apprentissage", open_path: 'Voir le parcours →',
    learn_title: 'Apprendre le lao', learn_sub: 'leçons terminées · progression enregistrée sur cet appareil',
    next_cta: 'Continuer', lb_title: '🏆 Classement', lb_all: 'Depuis toujours', lb_week: 'Cette semaine', lb_signin: 'Connecte-toi ou crée un compte gratuit', lb_join: 'pour rejoindre le classement.', lb_empty: 'Pas encore de scores — sois le premier !',
    goal_title: '🎯 Objectif du jour', goal_today: 'XP aujourd’hui',
    review_title: 'Révision', review_sub: 'Répétition espacée : leçons à revoir', review_due: 'À revoir maintenant', review_upcoming: 'À venir', review_none: 'Rien à revoir pour l’instant — bravo ! 🎉', review_start: 'Réviser →',
    words_title: 'Mots & phrases', words_sub: 'Un dictionnaire lao–anglais cherchable. Appuie sur 🔊 pour entendre chaque mot.',
    grammar_title: 'Bible de grammaire 📖', grammar_sub: 'La grammaire lao expliquée simplement, avec écriture lao + translittération + anglais.',
    culture_title: 'Culture lao 🇱🇦', culture_sub: 'Les histoires derrière la langue : le pays, les festivals, la nourriture, l’étiquette, la diaspora.',
    account_title: 'Compte', profile_title: 'Profil',
    check: 'VÉRIFIER', cont: 'CONTINUER', done_title: 'Leçon terminée !', fail_title: 'Plus de vies !', next_lesson: 'Leçon suivante →', back_path: 'Retour au parcours', replay: '↻ Rejouer', try_again: '↻ Réessayer',
  },
  la: {
    nav_home: 'ບ້ານ', nav_learn: 'ເຣີຢນ', nav_words: 'ຄຳ', nav_grammar: 'ໄວຢາກຣນ໌', nav_culture: 'ວັດນຘຣຣມ', nav_review: 'ທບທວນ',
    sign_in: 'ເຂ້າສູ່ຣະບບ',
    hero_kicker: 'ຟຣີ · Open-source · ສຳຫຣັບຊາວລາວທັ່ວໂລກ 🌏',
    cta_start: 'ເຣິ່ມບທເຣີຢນແຣກ — ຟຣີ →', cta_continue: 'ເຣີຢນຕ່ອ →', cta_culture: 'ສຳຣວຈວັດນຘຣຣມລາວ',
    features_title: 'ສິ່ງທີ່ຄຸນຈະໄດ້ຣັບ',
    feat_lessons: 'ບທເຣີຢນສໄຕລ໌ Duolingo', feat_audio: 'ເສີຢງ & ພູດ', feat_grammar: 'ຕຳຣາໄວຢາກຣນ໌', feat_words: 'ຄຳ & ວລີ', feat_culture: 'ວັດນຘຣຣມ', feat_account: 'ບັຍຊີຟຣີ & ສິງກ໌', feat_free: 'ຟຣີ & open-source',
    learn_title: 'ເຣີຢນພາສາລາວ', next_cta: 'ຕ່ອ', lb_title: '🏆 ກຣະດານຄະແນນ', lb_all: 'ທັ້ງຫມດ', lb_week: 'ສັປດາຫ໌ນີ້',
    goal_title: '🎯 ເປ້າຫມາຢຣາຢວັນ', review_title: 'ທບທວນ', review_none: 'ໄມ່ມີອະໄຣຕ້ອງທບທວນຕອນນີ້ — ເຢີ່ຢມມາກ! 🎉', review_start: 'ທບທວນຕອນນີ້ →',
    words_title: 'ຄຳ & ວລີ', grammar_title: 'ຕຳຣາໄວຢາກຣນ໌ 📖', culture_title: 'ວັດນຘຣຣມລາວ 🇱🇦',
    account_title: 'ບັຍຊີ', profile_title: 'ໂປຣໄຟລ໌',
    check: 'ຕຣວຈສອບ', cont: 'ຕ່ອ', done_title: 'ຈບບທເຣີຢນແລ້ວ!', fail_title: 'ຫັວໃຈຫມດ!', next_lesson: 'ບທຕ່ອໄປ →', back_path: 'ກລັບສູ່ເສ້ນທາງ', replay: '↻ ເລ່ນອີກຄຣັ້ງ', try_again: '↻ ລອງອີກຄຣັ້ງ',
  },
};
let lang = 'en';
try { lang = localStorage.getItem('hianlao-lang') || 'en'; } catch { /* ignore */ }
if (!dict[lang]) lang = 'en';

export const LANGS = { en: 'EN', fr: 'FR', la: 'LA' };

export function t(key) {
  return (dict[lang] && dict[lang][key]) ?? dict.en[key] ?? key;
}
export function getLang() { return lang; }
export function setLang(l) {
  if (!dict[l]) return;
  try { localStorage.setItem('hianlao-lang', l); } catch { /* ignore */ }
  location.reload();
}

// ---- theme ----
export function getTheme() {
  try { return localStorage.getItem('hianlao-theme') || 'light'; } catch { return 'light'; }
}
export function applyTheme() {
  document.documentElement.dataset.theme = getTheme();
}
export function toggleTheme() {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('hianlao-theme', next); } catch { /* ignore */ }
  document.documentElement.dataset.theme = next;
  return next;
}
