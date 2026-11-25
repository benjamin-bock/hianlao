// i18n singleton + React hook (EN / FR / LAO ui strings, verbatim dict from
// the audited legacy site). Language applies without reload via subscribers;
// choice persists in localStorage. Theme lives in theme.ts.
'use client';

import { useSyncExternalStore } from 'react';

export type Lang = 'en' | 'fr' | 'la';

// Interpolation "vars" replace {x} {y} {z}; variant keys (fb_ok_variants,
// fb_praise) are '|'-separated lists — pick with pickVariant().
export type I18nVars = Record<string, string | number>;

const dict: Record<Lang, Record<string, string>> = {
  en: {
    tap_answer: 'Tap your answer',
    nav_home: 'Home', nav_learn: 'Learn', nav_alphabet: 'Alphabet', nav_words: 'Words', nav_grammar: 'Grammar', nav_culture: 'Culture', nav_review: 'Review',
    alpha_title: 'The Lao alphabet',
    alpha_sub: 'Learn every letter of <span class="lao">ອັກສອນລາວ</span> <span class="lao-roman">ak-son lao</span> the fun way: small groups, shape ↔ sound drills, patient repetition — like the kana in a Japanese course.',
    alpha_known: 'You know {x} of {y} letters — fill every bar to master the script.',
    alpha_count: '{x}/{y}',
    alpha_start: 'Learn', alpha_next: 'Next letter', alpha_again: 'Practice again', alpha_practice_all: 'Practice mixed', alpha_back: 'Back',
    alpha_continue: 'Continue', alpha_new_letter: 'New letter', alpha_lv_aria: 'Mastery {x}/{y}',
    alpha_locked: 'Locked — master the group above first 🔒', alpha_next_group: 'Next group: {x} →', alpha_all_mastered: '🎉 You mastered the whole Lao script!',
    alpha_trace: 'Trace {c} with your finger', alpha_trace_try: 'Not quite — follow the pale outline and try again',
    alpha_trace_start: 'Start from the pulsing circle and follow the curve',
    alpha_trace_finish: 'Follow the full curve all the way to the end',
    alpha_trace_step: 'Stroke {a} of {b}', alpha_trace_arrows: 'Start at the circle and follow the arrows',
    alpha_trace_free_hint: 'Write it on your own — the dashed line helps if you get lost',
    alpha_trace_free: 'Your turn — write it freehand!',
    alpha_trace_ok: 'Nice handwriting!', alpha_trace_clear: 'Clear', alpha_trace_replay: 'Replay', alpha_trace_check: 'Check',
    alpha_done_title: 'Group complete!', alpha_mixed_done_title: 'Practice complete!', alpha_run_done: 'Great work!',
    alpha_mistakes: 'Mistakes: {x}', alpha_xp_earned: '+{x} XP',
    alpha_consonants: 'Consonants',
    alpha_consonants_sub: '27 consonants — several share a sound, and those pairs reappear all over the script. Lao speakers call them <span class="lao">ພະຍັນຊະນະ</span> <span class="lao-roman">pha-yan-cha-na</span>.',
    alpha_vowels: 'Vowels',
    alpha_vowels_sub: 'Shown on the carrier ກ, because vowel signs wrap around their consonant: <span class="lao">ກາ</span> <span class="lao-roman">kaa</span> = “kaa”. Lao speakers call them <span class="lao">ສະຫຼະ</span> <span class="lao-roman">sa-la</span>.',
    alpha_tones_sub: 'Tone marks (່ ້ ໊ ໋) come later — open the grammar guide once these groups feel solid.',
    alpha_g_c1: 'The k family', alpha_g_c2: 'The s family', alpha_g_c3: 'The t family', alpha_g_c4: 'The f family', alpha_g_c5: 'The quiet helpers', alpha_g_c6: 'The last consonants',
    alpha_g_v1: 'Short & long vowels', alpha_g_v2: 'E, O and AI', alpha_g_v3: 'Syllable endings',
    alpha_q_char_sound: 'What sound does {c} make?', alpha_q_sound_char: 'Which letter sounds like “{s}”?',
    alpha_q_syl_roman: 'How do you read {c}?', alpha_q_roman_syl: 'Which one reads “{s}”?',
    feat_alphabet: 'The Lao alphabet', feat_alphabet_desc: 'Learn the script the way the Japanese course teaches kana: small groups, shape ↔ sound drills, patient repetition.',
    sign_in: 'Sign in',
    snd_toggle: 'Sound & haptics on/off',
    hero_kicker: 'Free · Open-source · For the Lao diaspora 🌏',
    home_hero_title: 'Learn Lao, the language<br>of <span class="lao accent">ລ້ານຊ້າງ</span> <span class="lao-roman">(laan saang — a million elephants)</span>',
    hero_sub: 'HianLao (<span class="lao">ຮຽນລາວ</span>, <span class="lao-roman">hian lao</span> — "learn Lao") is a Duolingo-style learning site that is 100% free and open-source: lessons, a grammar bible, vocabulary with audio, and Lao culture. No subscription, ever.',
    cta_start: "Start lesson 1 — it's free →", cta_continue: 'Continue learning →', cta_culture: 'Explore Lao culture',
    features_title: "What you get",
    feat_lessons: 'Duolingo-style lessons', feat_audio: 'Audio & voice', feat_grammar: 'Grammar bible', feat_words: 'Words & phrases', feat_culture: 'Culture', feat_account: 'Free accounts & sync', feat_free: 'Free & open-source',
    feat_lessons_desc: '39 bite-size lessons in 13 units: multiple choice, typing, matching, listening, word tiles and speaking practice. XP, hearts and streaks keep you motivated.',
    feat_audio_desc: 'Press 🔊 on any word to hear it (Lao voice when your device has one), and try the microphone exercises to practice speaking.',
    feat_grammar_desc: 'From the Lao script and its 6 tones to sentence structure, particles, classifiers and questions — explained simply, with Lao examples.',
    feat_words_desc: 'A searchable dictionary of 200+ words and real-life phrases, sorted by theme: greetings, food, family, travel…',
    feat_culture_desc: 'Festivals (Pi Mai!), food, etiquette, the Mekong, and why the diaspora keeps the language alive.',
    feat_account_desc: 'Create a free account to sync XP, streaks and completed lessons across all your devices, and climb the 🏆 leaderboard. No account? No problem — progress stays on your device.',
    feat_free_desc: 'No paywall, no ads. The code is on GitHub under MIT — contribute a lesson or a word!',
    path_title: 'The learning path', open_path: 'Open the path →',
    stat_words: 'words & phrases', stat_lessons: 'bite-size lessons', stat_grammar: 'grammar guides', stat_culture: 'culture stories',
    cta_title: 'Ready to say <span class="lao">ສະບາຍດີ</span> <span class="lao-roman">sa-bai-dii</span>?', cta_sub: 'Your first lesson takes 3 minutes. No sign-up. Just learning.', cta_now: "Start now — it's free ⚡",
    path_preview_sub: '{x} units, from <span class="lao">ສະບາຍດີ</span> <span class="lao-roman">sa-bai-dii</span> to full sentences — and proverbs.',
    learn_title: 'Learn Lao', learn_sub: 'lessons completed · progress is saved on this device',
    next_cta: 'Continue', lb_title: '🏆 Leaderboard', lb_all: 'All time', lb_week: 'This week', lb_signin: 'Sign in or create a free account', lb_join: 'to join the leaderboard.', lb_empty: 'No scores yet — be the first!',
    goal_title: '🎯 Daily goal', goal_today: 'XP today',
    review_title: 'Review', review_sub: 'Spaced repetition: lessons due for review', review_due: 'Due now', review_upcoming: 'Upcoming', review_none: 'Nothing due right now — great job keeping up! 🎉', review_start: 'Review now →',
    rev_practice_title: 'Word drill', rev_practice_sub: '{x} words need work right now', rev_practice_sub_one: '{x} word needs work right now', rev_practice_sub_any: 'Nothing flagged — we will mix in classic words to keep you sharp', rev_practice_start: 'Start drill',
    rev_q_listen: 'What do you hear?', rev_q_meaning: 'What does it mean?', rev_q_recall: 'How do you say it in Lao?', rev_in_lao: 'In Lao',
    rev_done_title: 'Drill complete!',
    words_title: 'Words & phrases', words_sub: 'A searchable Lao–English dictionary. Press 🔊 to hear every word.',
    words_search: 'Search Lao, romanization or English… (e.g. "rice", "khao", ເຂົ້າ)',
    words_all: 'All ({x})', words_count_one: '{x} word', words_count_many: '{x} words', words_in: ' in “{y}”', words_matching: ' matching “{y}”',
    words_empty: 'No words found. Try another search — or add this word on GitHub! ✏️',
    grammar_title: 'Grammar bible 📖', grammar_sub: 'Lao grammar explained simply, with Lao script + romanization + English.', grammar_toc: 'Contents',
    culture_title: 'Lao culture 🇱🇦', culture_sub: 'The stories behind the language: the land, the festivals, the food, the etiquette — and why the diaspora keeps Lao alive. <span class="lao">ວັດທະນະທຳລາວ</span> <span class="lao-roman">wat-ta-na-tham Lao</span>.',
    account_title: 'Account', profile_title: 'Profile',
    cont: 'CONTINUE', done_title: 'Lesson complete!', fail_title: 'Out of hearts!', next_lesson: 'Next lesson →', back_path: 'Back to path', replay: '↻ Replay', try_again: '↻ Try again',
    summary_line: '{title} — {x}/{y} correct ({z}%)',
    summary_lao: 'ເຮັດໄດ້ດີຫຼາຍ! <i class="lao-roman">het dai dii laai!</i>',
    stat_xp: '⚡ XP earned', stat_acc: 'accuracy', stat_total_xp: 'total XP', summary_achievements: '🏅 Achievements',
    fail_sub: 'You got {x}/{y} correct. In Lao we say: <span class="lao">ບໍ່ເປັນຫຍັງ</span> <span class="lao-roman">baw pen nyang</span> — "no worries". Try again!',
    again_note: 'One more time — repetition makes it stick!',
    practice_mistakes: '🔁 Practice mistakes', practice_mode: 'Practice — mistakes on repeat until fixed',
    practice_done_title: 'Mistakes fixed!', practice_done_sub: 'You worked through every miss — that is how memory is built.',
    combo_word: 'in a row',
    weak_title: 'Tricky words', weak_sub: 'Words you missed in lessons — repeat them until they stick.',
    weak_practice: 'Drill my tricky words',
    weak_empty_title: 'No tricky words yet', weak_empty: 'Every word you miss lands here — repeat it until it sticks.',
    drill_title: 'Tricky words drill', drill_blurb: 'One more pass on the words that got away.',
    learn_due_card: 'lessons due for review', learn_due_sub: 'Spaced repetition is how it sticks — repeat them now.',
    review_now: 'Review now',
    learn_weak_card: 'tricky words to repeat', learn_weak_sub: 'You missed these in lessons — a quick drill fixes them.',
    drill_now: 'Drill',
    lb_sub: 'Top learners by XP — sign in to appear here!', lb_offline: 'Backend offline — leaderboard unavailable. The site still works fully as a guest!',
    unit_n: 'Unit {x} — {y}', n_exercises: '{x} exercises', goal_select: 'Daily goal',
    f_username: 'Username', f_password: 'Password', f_pass2: 'Repeat password', f_display_name: 'Display name (optional)',
    tab_register: 'Create account', auth_title: 'Your HianLao account',
    auth_sub: 'Free forever. Syncs your XP, streak and completed lessons across all your devices, and puts you on the leaderboard. Without an account, progress stays in this browser (localStorage).',
    auth_offline: 'Backend not available right now — you can keep learning as a guest (progress stays on this device).',
    auth_pass_mismatch: 'Passwords do not match.', auth_error: 'Something went wrong.',
    ph_username: 'e.g. laogirl_21', ph_pass: 'min. 8 characters', ph_pass2: 'repeat password', ph_optional: 'optional',
    guest_cta: 'Continue as guest →', logout: 'Log out',
    member_since: 'Member since {x} · @{u} · synced to your account ✔', stat_streak: 'day streak', stat_lessons_n: 'lessons',
    lesson_not_found: 'Lesson not found', lesson_not_found_sub: 'No lesson with id "{x}".',
    ex_mc_lao2en: 'What does this mean?', ex_mc_en2lao: 'Which one is…?',
    ex_type_lao2en: 'Translate to English', ex_type_en2lao: 'Answer in Lao',
    ex_match: 'Match the pairs', ex_listen: '🔊 Listen and choose', ex_tiles: 'Build the sentence', ex_speak: '🎤 Say it out loud', ex_generic: 'Exercise',
    prompt_mc_en2lao: 'Select the Lao for: <b>{x}</b>',
    prompt_type_en2lao: 'Tap the Lao for: <b>{x}</b>',
    prompt_listen: 'Press play, then choose what you heard.',
    prompt_tiles: 'Translate: <b>{x}</b>',
    ph_tiles: 'Tap the words in order…',
    hint_match: '{x}/{y} matched — match every Lao word with its English meaning.',
    listen_play: '▶ Press play and listen', listen_novoice: '▶ Your browser has no Lao voice — we will say the romanization: {x}', title_play_audio: 'Play audio',
    speak_tap: '🎤 Tap and speak', speak_listening: 'Listening… say it now 🎤', speak_missed: 'Did not catch that — try again, or press "I said it".',
    speak_denied: 'The microphone is blocked for this site — allow it via the 🎤 icon in the address bar, then tap again.',
    speak_network: 'Speech recognition needs an internet connection — check yours and try again.',
    speak_heard: 'Heard: "{x}"', speak_said: "No mic? I said it ✔", speak_nomic: 'This browser cannot use the microphone. Listen with 🔊, repeat out loud, then tap below.',
    speak_said_loud: 'I said it out loud ✔', speak_hint: 'Speaking practice',
    fb_ok_variants: 'Awesome!|Correct!|ແຊບ! (Sep — tasty! The best Lao compliment)|Well done!', fb_bad: 'Not quite', fb_correct_answer: 'Correct answer: <b>{x}</b>', fb_praise: "Keep it up!|You're on fire 🔥",
    see_result: 'SEE RESULT',
  },
  fr: {
    tap_answer: 'Touche ta réponse',
    nav_home: 'Accueil', nav_learn: 'Apprendre', nav_alphabet: 'Alphabet', nav_words: 'Mots', nav_grammar: 'Grammaire', nav_culture: 'Culture', nav_review: 'Révision',
    alpha_title: 'L’alphabet lao',
    alpha_sub: 'Apprends chaque lettre de l’<span class="lao">ອັກສອນລາວ</span> <span class="lao-roman">ak-son lao</span> (l’écriture lao) en douceur : petits groupes, drills forme ↔ son, répétition patiente — comme les kana du cours de japonais.',
    alpha_known: 'Tu connais {x} lettres sur {y} — remplis chaque barre pour maîtriser l’alphabet.',
    alpha_count: '{x}/{y}',
    alpha_start: 'Apprendre', alpha_next: 'Lettre suivante', alpha_again: 'Réviser', alpha_practice_all: 'Réviser en vrac', alpha_back: 'Retour',
    alpha_continue: 'Continuer', alpha_new_letter: 'Nouvelle lettre', alpha_lv_aria: 'Maîtrise {x}/{y}',
    alpha_locked: "Verrouillé — maîtrise d’abord le groupe au-dessus 🔒", alpha_next_group: "Groupe suivant : {x} →", alpha_all_mastered: "🎉 Tu maîtrises tout l’alphabet lao !",
    alpha_trace: 'Trace {c} avec le doigt', alpha_trace_try: 'Pas tout à fait — suis le contour pâle et réessaie',
    alpha_trace_start: 'Commence au cercle et suis la courbe',
    alpha_trace_finish: 'Suis toute la courbe jusqu’au bout',
    alpha_trace_step: 'Trait {a} sur {b}', alpha_trace_arrows: 'Commence au cercle et suis les flèches',
    alpha_trace_free_hint: 'Écris-la toi-même — la ligne pointillée t’aide si tu te perds',
    alpha_trace_free: 'À toi — écris-la à main levée !',
    alpha_trace_ok: 'Belle écriture !', alpha_trace_clear: 'Effacer', alpha_trace_replay: 'Revoir', alpha_trace_check: 'Vérifier',
    alpha_done_title: 'Groupe terminé !', alpha_mixed_done_title: 'Révision terminée !', alpha_run_done: 'Beau travail !',
    alpha_mistakes: 'Erreurs : {x}', alpha_xp_earned: '+{x} XP',
    alpha_consonants: 'Consonnes',
    alpha_consonants_sub: '27 consonnes — plusieurs partagent le même son, et ces paires reviennent partout dans l’écriture. Les Lao les appellent <span class="lao">ພະຍັນຊະນະ</span> <span class="lao-roman">pha-yan-cha-na</span>.',
    alpha_vowels: 'Voyelles',
    alpha_vowels_sub: 'Montrées sur le porteur ກ, car les signes s’enroulent autour de la consonne : <span class="lao">ກາ</span> <span class="lao-roman">kaa</span> = « kaa ». En lao, on les appelle <span class="lao">ສະຫຼະ</span> <span class="lao-roman">sa-la</span>.',
    alpha_tones_sub: 'Les tons (່ ້ ໊ ໋) viendront plus tard — ouvrez le guide de grammaire quand ces groupes seront solides.',
    alpha_g_c1: 'La famille des k', alpha_g_c2: 'La famille des s', alpha_g_c3: 'La famille des t', alpha_g_c4: 'La famille des f', alpha_g_c5: 'Les aides discrets', alpha_g_c6: 'Les dernières consonnes',
    alpha_g_v1: 'Voyelles brèves et longues', alpha_g_v2: 'E, O et AÏ', alpha_g_v3: 'Fins de syllabes',
    alpha_q_char_sound: 'Quel son fait {c} ?', alpha_q_sound_char: 'Quelle lettre fait le son « {s} » ?',
    alpha_q_syl_roman: 'Comment lit-on {c} ?', alpha_q_roman_syl: 'Lequel se lit « {s} » ?',
    feat_alphabet: 'L’alphabet lao', feat_alphabet_desc: 'Apprends l’écriture comme les kana du cours de japonais : petits groupes, drills forme ↔ son, répétition patiente.',
    sign_in: 'Connexion',
    snd_toggle: 'Son et vibrations on/off',
    hero_kicker: 'Gratuit · Open-source · Pour la diaspora lao 🌏',
    home_hero_title: 'Apprends le lao, la langue<br>du <span class="lao accent">ລ້ານຊ້າງ</span> <span class="lao-roman">(laan saang — le royaume au million d\'éléphants)</span>',
    hero_sub: 'HianLao (<span class="lao">ຮຽນລາວ</span>, <span class="lao-roman">hian lao</span> — « apprends le lao ») est un site d’apprentissage du lao façon Duolingo, 100 % gratuit et open-source : leçons, bible de grammaire, vocabulaire avec audio et culture lao. Sans abonnement, jamais.',
    cta_start: "Commencer la leçon 1 — c'est gratuit →", cta_continue: 'Continuer à apprendre →', cta_culture: 'Découvrir la culture lao',
    features_title: 'Ce que tu y trouveras',
    feat_lessons: 'Leçons façon Duolingo', feat_audio: 'Audio et voix', feat_grammar: 'Bible de grammaire', feat_words: 'Mots et phrases', feat_culture: 'Culture', feat_account: 'Comptes gratuits et synchro', feat_free: 'Gratuit et open-source',
    feat_lessons_desc: '39 leçons courtes en 13 unités : choix multiple, dictée, associations, écoute, mots à remettre dans l’ordre et prononciation au micro. XP, cœurs et séries pour rester motivé.',
    feat_audio_desc: 'Appuie sur 🔊 pour entendre chaque mot (voix lao si ton appareil en a une), puis essaie les exercices au micro pour travailler la prononciation.',
    feat_grammar_desc: 'De l’écriture lao et ses 6 tons jusqu’à l’ordre des mots, les particules, les classificateurs et les questions — expliqué simplement, avec des exemples en lao.',
    feat_words_desc: 'Un dictionnaire de plus de 200 mots et expressions du quotidien, classés par thème : salutations, cuisine, famille, voyage…',
    feat_culture_desc: 'Les fêtes (Pi Mai !), la cuisine, l’étiquette, le Mékong — et pourquoi la diaspora garde la langue vivante.',
    feat_account_desc: 'Crée un compte gratuit pour synchroniser XP, séries et leçons terminées sur tous tes appareils, et grimper au 🏆 classement. Pas de compte ? Pas grave — ta progression reste sur ton appareil.',
    feat_free_desc: 'Pas de paywall, pas de pub. Le code est sur GitHub sous licence MIT — propose une leçon ou un mot !',
    path_title: "Le parcours d'apprentissage", open_path: 'Voir le parcours →',
    stat_words: 'mots et phrases', stat_lessons: 'leçons courtes', stat_grammar: 'guides de grammaire', stat_culture: 'histoires culturelles',
    cta_title: 'Prêt·e à dire <span class="lao">ສະບາຍດີ</span> <span class="lao-roman">sa-bai-dii</span> ?', cta_sub: 'Ta première leçon prend 3 minutes. Sans inscription. Juste l’apprentissage.', cta_now: 'Commencer maintenant — c’est gratuit ⚡',
    path_preview_sub: '{x} unités, de <span class="lao">ສະບາຍດີ</span> <span class="lao-roman">sa-bai-dii</span> jusqu’aux phrases complètes — et aux proverbes.',
    learn_title: 'Apprendre le lao', learn_sub: 'leçons terminées · progression enregistrée sur cet appareil',
    next_cta: 'Continuer', lb_title: '🏆 Classement', lb_all: 'Depuis le début', lb_week: 'Cette semaine', lb_signin: 'Connecte-toi ou crée un compte gratuit', lb_join: 'pour rejoindre le classement.', lb_empty: 'Pas encore de points — sois le premier !',
    goal_title: '🎯 Objectif du jour', goal_today: 'XP aujourd’hui',
    review_title: 'Révision', review_sub: 'Répétition espacée : les leçons à revoir', review_due: 'À revoir maintenant', review_upcoming: 'À venir', review_none: 'Rien à revoir pour l’instant — bravo ! 🎉', review_start: 'Réviser →',
    rev_practice_title: 'Entraînement de mots', rev_practice_sub: '{x} mots à retravailler dès maintenant', rev_practice_sub_one: '{x} mot à retravailler dès maintenant', rev_practice_sub_any: 'Rien de signalé — un mélange de mots classiques pour rester affûté', rev_practice_start: 'Commencer l’entraînement',
    rev_q_listen: 'Qu’entends-tu ?', rev_q_meaning: 'Que signifie ce mot ?', rev_q_recall: 'Comment le dit-on en lao ?', rev_in_lao: 'En lao',
    rev_done_title: 'Entraînement terminé !',
    words_title: 'Mots et phrases', words_sub: 'Un petit dictionnaire lao–français, avec recherche. Appuie sur 🔊 pour écouter chaque mot.',
    words_search: 'Rechercher en lao, en romanisation, en français ou en anglais… (ex. « riz », « khao », ເຂົ້າ)',
    words_all: 'Tous ({x})', words_count_one: '{x} mot', words_count_many: '{x} mots', words_in: ' dans « {y} »', words_matching: ' correspondant à « {y} »',
    words_empty: 'Aucun mot trouvé. Essaie une autre recherche — ou propose ce mot sur GitHub ! ✏️',
    grammar_title: 'Bible de grammaire 📖', grammar_sub: 'La grammaire du lao expliquée simplement : écriture lao, romanisation et français.', grammar_toc: 'Sommaire',
    culture_title: 'Culture lao 🇱🇦', culture_sub: 'Les histoires derrière la langue : le pays, les fêtes, la cuisine, l’étiquette — et ce qui maintient le lao bien vivant dans la diaspora. <span class="lao">ວັດທະນະທຳລາວ</span> <span class="lao-roman">wat-ta-na-tham Lao</span>.',
    account_title: 'Compte', profile_title: 'Profil',
    cont: 'CONTINUER', done_title: 'Leçon terminée !', fail_title: 'Plus de vies !', next_lesson: 'Leçon suivante →', back_path: 'Retour au parcours', replay: '↻ Refaire', try_again: '↻ Réessayer',
    summary_line: '{title} — {x}/{y} bonnes réponses ({z} %)',
    summary_lao: 'ເຮັດໄດ້ດີຫຼາຍ ! <i class="lao-roman">het dai dii laai !</i>',
    stat_xp: '⚡ XP gagnés', stat_acc: 'réussite', stat_total_xp: 'XP au total', summary_achievements: '🏅 Succès',
    fail_sub: 'Tu as eu {x}/{y} bonnes réponses. En lao, on dit : <span class="lao">ບໍ່ເປັນຫຍັງ</span> <span class="lao-roman">baw pen nyang</span> — « pas grave ». Retente ta chance !',
    again_note: 'Encore une fois — la répétition, c’est ce qui fait retenir !',
    practice_mistakes: '🔁 Rejouer mes erreurs', practice_mode: 'Entraînement — les erreurs reviennent jusqu’à ce qu’elles soient corrigées',
    practice_done_title: 'Toutes les erreurs corrigées !', practice_done_sub: 'Tu as retravaillé chaque erreur — c’est comme ça que la mémoire se construit.',
    combo_word: 'd’affilée',
    weak_title: 'Mots à revoir', weak_sub: 'Les mots manqués en leçon — répète-les jusqu’à ce qu’ils soient bien ancrés.',
    weak_practice: 'Entraîne-toi sur tes mots difficiles',
    weak_empty_title: 'Aucun mot manqué', weak_empty: 'Chaque mot manqué arrive ici — répète-le jusqu’à ce qu’il soit bien ancré.',
    drill_title: 'Entraînement des mots difficiles', drill_blurb: 'Encore une manche sur les mots qui t’ont échappé.',
    learn_due_card: 'leçons à revoir', learn_due_sub: 'La répétition espacée, c’est ce qui fait retenir — refais-les maintenant.',
    review_now: 'Réviser',
    learn_weak_card: 'mots difficiles à retravailler', learn_weak_sub: 'Tu les as manqués en leçon — un petit entraînement et c’est réglé.',
    drill_now: 'S’entraîner',
    lb_sub: 'Les meilleurs apprenants, classés par XP — connecte-toi pour apparaître ici !', lb_offline: 'Serveur hors ligne — le classement est indisponible. Le site reste entièrement utilisable en invité !',
    unit_n: 'Unité {x} — {y}', n_exercises: '{x} exercices', goal_select: 'Objectif du jour',
    f_username: 'Nom d’utilisateur', f_password: 'Mot de passe', f_pass2: 'Répète le mot de passe', f_display_name: 'Nom affiché (facultatif)',
    tab_register: 'Créer un compte', auth_title: 'Ton compte HianLao',
    auth_sub: 'Gratuit pour toujours. Synchronise XP, séries et leçons terminées sur tous tes appareils, et t’inscrit au classement. Sans compte, ta progression reste dans ce navigateur (localStorage).',
    auth_offline: 'Serveur indisponible pour le moment — tu peux continuer en invité (progression conservée sur cet appareil).',
    auth_pass_mismatch: 'Les mots de passe ne correspondent pas.', auth_error: 'Une erreur est survenue.',
    ph_username: 'ex. laogirl_21', ph_pass: '8 caractères minimum', ph_pass2: 'répète le mot de passe', ph_optional: 'facultatif',
    guest_cta: 'Continuer en invité →', logout: 'Se déconnecter',
    member_since: 'Membre depuis {x} · @{u} · synchronisé avec ton compte ✔', stat_streak: 'jours d’affilée', stat_lessons_n: 'leçons',
    lesson_not_found: 'Leçon introuvable', lesson_not_found_sub: 'Aucune leçon avec l’identifiant « {x} ».',
    ex_mc_lao2en: 'Que signifie ce mot ?', ex_mc_en2lao: 'Lequel est-ce ?',
    ex_type_lao2en: 'Traduis en français', ex_type_en2lao: 'Réponds en lao',
    ex_match: 'Relie les paires', ex_listen: '🔊 Écoute et choisis', ex_tiles: 'Reconstruis la phrase', ex_speak: '🎤 Dis-le à voix haute', ex_generic: 'Exercice',
    prompt_mc_en2lao: 'Choisis le lao pour : <b>{x}</b>',
    prompt_type_en2lao: 'Touche le lao pour : <b>{x}</b>',
    prompt_listen: 'Appuie sur lecture, puis choisis ce que tu as entendu.',
    prompt_tiles: 'Traduis : <b>{x}</b>',
    ph_tiles: 'Touche les mots dans l’ordre…',
    hint_match: '{x}/{y} reliées — relie chaque mot lao à sa traduction.',
    listen_play: '▶ Appuie sur lecture et écoute', listen_novoice: '▶ Ton navigateur n’a pas de voix lao — on dira la romanisation : {x}', title_play_audio: 'Lecture audio',
    speak_tap: '🎤 Appuie et parle', speak_listening: 'J’écoute… dis-le maintenant 🎤', speak_missed: 'Rien capté — réessaie, ou appuie sur « Je l’ai dit ».',
    speak_denied: 'Le micro est bloqué pour ce site — autorise-le via l’icône 🎤 dans la barre d’adresse, puis réessaie.',
    speak_network: 'La reconnaissance vocale a besoin d’une connexion internet — vérifie la tienne et réessaie.',
    speak_heard: 'Entendu : « {x} »', speak_said: 'Pas de micro ? Je l’ai dit ✔', speak_nomic: 'Ton navigateur ne peut pas utiliser le micro. Écoute avec 🔊, répète à voix haute, puis appuie ci-dessous.',
    speak_said_loud: 'Je l’ai dit à voix haute ✔', speak_hint: 'Entraînement à la prononciation',
    fb_ok_variants: 'Génial !|C’est exact !|ແຊບ ! (Sep — « délicieux » ! Le plus beau compliment lao)|Bravo !', fb_bad: 'Pas tout à fait…', fb_correct_answer: 'La bonne réponse : <b>{x}</b>', fb_praise: 'Continue comme ça !|Tu cartonnes 🔥',
    see_result: 'VOIR LE RÉSULTAT',
  },
  la: {
    tap_answer: 'ເລືອກຄຳຕອບ',
    nav_home: 'ໜ້າຫຼັກ', nav_learn: 'ຮຽນ', nav_alphabet: 'ອັກສອນ', nav_words: 'ຄຳສັບ', nav_grammar: 'ໄວຍາກອນ', nav_culture: 'ວັດທະນະທຳ', nav_review: 'ທົບທວນ',
    alpha_title: 'ອັກສອນລາວ',
    alpha_sub: 'ຮຽນອັກສອນລາວທຸກຕົວ ດ້ວຍການແບ່ງເປັນກຸ່ມນ້ອຍ ຝຶກຊ້ຳຮູບ ↔ ສຽງ ຄືແບບສອນກັນໃນຫຼັກສູດພາສາຍີ່ປຸ່ນ',
    alpha_known: 'ຮູ້ຕົວອັກສອນແລ້ວ {x} ຈາກ {y} ຕົວ — ຕື່ມແຖບທຸກຕົວໃຫ້ເຕັມ ຈະຊຳນານອັກສອນລາວ',
    alpha_count: '{x}/{y}',
    alpha_start: 'ຮຽນ', alpha_next: 'ຕົວຕໍ່ໄປ', alpha_again: 'ຝຶກຊ້ຳອີກເທື່ອ', alpha_practice_all: 'ຝຶກຊ້ຳປົນກັນ', alpha_back: 'ກັບຄືນ',
    alpha_continue: 'ສືບຕໍ່', alpha_new_letter: 'ຕົວອັກສອນໃໝ່', alpha_lv_aria: 'ຊຳນານ {x}/{y}',
    alpha_locked: "🔒 ຈົບກຸ່ມແລ້ວ!", alpha_next_group: "ຕົວຕໍ່ໄປ {x} →", alpha_all_mastered: "ອັກສອນລາວ — ຈົບກຸ່ມແລ້ວ! 🎉",
    alpha_trace: 'ຂຽນ {c} ຕາມແບບ', alpha_trace_try: 'ຍັງບໍ່ຖືກ — ຂຽນຕາມແບບຈາງໆ ແລ້ວລອງອີກຄັ້ງ',
    alpha_trace_start: 'ເລີ່ມຈາກວົງມົນແລ້ວຂຽນຕາມເສັ້ນໂຄ້ງ',
    alpha_trace_finish: 'ຂຽນຕາມເສັ້ນໂຄ້ງໃຫ້ສຸດປາຍ',
    alpha_trace_step: 'ສາຍທີ {a} ຈາກ {b}', alpha_trace_arrows: 'ເລີ່ມຈາກວົງມົນແລ້ວຂຽນຕາມລູກສອນ',
    alpha_trace_free_hint: 'ຂຽນເອງເລີຍ — ເສັ້ນຂີດຊ່ວຍຖ້າເຮັງວຽນ',
    alpha_trace_free: 'ຮອດເວລາຂອງເຈົ້າແລ້ວ — ຂຽນມັນດ້ວຍມື!',
    alpha_trace_ok: 'ຂຽນໄດ້ສວຍງາມ!', alpha_trace_clear: 'ລຶບ', alpha_trace_replay: 'ເບິ່ງໃໝ່', alpha_trace_check: 'ກວດສອບ',
    alpha_done_title: 'ຈົບກຸ່ມແລ້ວ!', alpha_mixed_done_title: 'ຝຶກຊ້ຳຈົບແລ້ວ!', alpha_run_done: 'ເກັ່ງແລ້ວ!',
    alpha_mistakes: 'ຜິດ {x} ຄັ້ງ', alpha_xp_earned: '+{x} XP',
    alpha_consonants: 'ພະຍັນຊະນະ',
    alpha_consonants_sub: 'ພະຍັນຊະນະ 27 ຕົວ — ບາງຕົວມີສຽງດຽວກັນ ແລະ ຄູ່ນັ້ນພົບຢູ່ທົ່ວໄປໃນຕົວອັກສອນ',
    alpha_vowels: 'ສະຫຼະ',
    alpha_vowels_sub: 'ສະແດງບົນຕົວ ກ ເພາະວ່າສະຫຼະຈະອ້ອມຮອບພະຍັນຊະນະ: <span class="lao">ກາ</span> <span class="lao-roman">kaa</span> = “kaa”',
    alpha_tones_sub: 'ວັນນະຍຸດ (່ ້ ໊ ໋) ຈະມາທີ່ຫຼັງ — ເປີດເບິ່ງໄວຍາກອນເມື່ອຄຸ້ນເຄີຍກຸ່ມເຫຼົ່ານີ້ແລ້ວ',
    alpha_g_c1: 'ພະຍັນຊະນະ ກຸ່ມ 1', alpha_g_c2: 'ພະຍັນຊະນະ ກຸ່ມ 2', alpha_g_c3: 'ພະຍັນຊະນະ ກຸ່ມ 3', alpha_g_c4: 'ພະຍັນຊະນະ ກຸ່ມ 4', alpha_g_c5: 'ພະຍັນຊະນະ ກຸ່ມ 5', alpha_g_c6: 'ພະຍັນຊະນະ ກຸ່ມສຸດທ້າຍ',
    alpha_g_v1: 'ສະຫຼະ ສັ້ນ ແລະ ຍາວ', alpha_g_v2: 'ເ, ໂ ແລະ ໄ', alpha_g_v3: 'ອັກສອນທ້າຍຄຳ',
    alpha_q_char_sound: '{c} ອ່ານວ່າແນວໃດ?', alpha_q_sound_char: 'ຕົວໃດອ່ານວ່າ “{s}”?',
    alpha_q_syl_roman: '{c} ອ່ານວ່າແນວໃດ?', alpha_q_roman_syl: 'ຕົວໃດອ່ານວ່າ “{s}”?',
    feat_alphabet: 'ອັກສອນລາວ', feat_alphabet_desc: 'ຮຽນຕົວອັກສອນແບບດຽວກັບການສອນການະ (kana) ຂອງພາສາຍີ່ປຸ່ນ: ກຸ່ມນ້ອຍ, ຝຶກຮູບ ↔ ສຽງ, ຝຶກຊ້ຳບໍ່ຢຸດຢັ້ງ',
    sign_in: 'ເຂົ້າສູ່ລະບົບ',
    snd_toggle: "ສຽງ on/off",
    hero_kicker: 'ຟຣີ · ເປີດແຫຼ່ງລະຫັດ · ສຳລັບຊາວລາວທົ່ວໂລກ 🌏',
    home_hero_title: 'ຮຽນພາສາລາວ — ພາສາຂອງ <span class="lao accent">ລ້ານຊ້າງ</span> <span class="lao-roman">(laan saang)</span>',
    hero_sub: 'HianLao (<span class="lao">ຮຽນລາວ</span> — <span class="lao-roman">hian lao</span>) ແມ່ນເວັບຮຽນພາສາລາວ ຕາມແບບ Duolingo, ຟຣີ 100% ແລະ ເປີດແຫຼ່ງລະຫັດ. ມີແບບຮຽນ, ຕຳລາໄວຍາກອນ, ຄຳສັບພ້ອມສຽງ ແລະ ວັດທະນະທຳລາວ — ບໍ່ມີຄ່າໃຊ້ຈ່າຍ ຕະຫຼອດໄປ.',
    cta_start: 'ເລີ່ມບົດຮຽນທີ 1 — ຟຣີ →', cta_continue: 'ຮຽນຕໍ່ →', cta_culture: 'ສຳຫຼວດວັດທະນະທຳລາວ',
    features_title: 'ສິ່ງທີ່ທ່ານຈະໄດ້ຮັບ',
    feat_lessons: 'ແບບຮຽນຕາມແບບ Duolingo', feat_audio: 'ສຽງ ແລະ ພູດ', feat_grammar: 'ຕຳລາໄວຍາກອນ', feat_words: 'ຄຳສັບ ແລະ ວາລີ', feat_culture: 'ວັດທະນະທຳ', feat_account: 'ບັນຊີຟຣີ ແລະ ຊິງຂໍ້ມູນ', feat_free: 'ຟຣີ ແລະ ເປີດແຫຼ່ງລະຫັດ',
    feat_lessons_desc: 'ບົດຮຽນສັ້ນ 39 ບົດ ໃນ 13 ໜ່ວຍ: ເລືອກຄຳຕອບ, ພິມ, ຈັບຄູ່, ຟັງ, ຕໍ່ຄຳ ແລະ ຝຶກເວົ້າ. XP, ຫົວໃຈ ແລະ ວັນຝຶກຕໍ່ເນື່ອງ ຊ່ວຍໃຫ້ມີແຮງຈູງໃຈ.',
    feat_audio_desc: 'ກົດ 🔊 ເພື່ອຟັງຄຳສັບແຕ່ລະຄຳ (ມີສຽງລາວ ຖ້າເຄື່ອງຂອງທ່ານຮອງຮັບ), ແຖມໄມໄວ້ໝັ້ນໃຈ. ຝຶກຊ້ຳເລີຍ!',
    feat_grammar_desc: 'ຈາກຕົວອັກສອນລາວ ແລະ ໂທນສຽງ 6 ໂທນ ຈົນເຖິງໂຄງປະໂຫຍກ, ຄຳເວົ້າຫຼິ້ນໆ ແຕ່ຈຳເປັນ.',
    feat_words_desc: 'ພຈະນານຸກົມຄຳສັບ ແລະ ວາລີການໃຊ້ຈິງ 200+ ຄຳ, ຈັດຕາມຫົວຂໍ້: ຄຳທັກທາຍ, ອາຫານ, ຄອບຄົວ, ການເດີນທາງ… ພ້ອມຄຳອ່ານສຽງ ຊອກຫາໄດ້.',
    feat_culture_desc: 'ບຸນປະເພນີ (ບຸນປີໃໝ່!), ອາຫານ, ສັມມາດຕະຖານປະພຶດ, ແມ່ນ້ຳຂອງ ແລະ ເຫດຜົນທີ່ຊາວລາວນອກປະເທດຍັງຮັກພາສາລາວ ຈົນຈະພັກ.',
    feat_account_desc: 'ສ້າງບັນຊີຟຣີ ເພື່ອຊິງ XP, ວັນຝຶກ ແລະ ບົດຮຽນທີ່ຮຽນແລ້ວ ໄປທຸກເຄື່ອງ ພ້ອມທັງໄຂທາຕະລາງຄະແນນ 🏆. ບໍ່ມີບັນຊີກໍ່ບໍ່ເປັນຫຍັງ — ຂໍ້ມູນຢູ່ໃນເຄື່ອງຂອງທ່ານເອງ.',
    feat_free_desc: 'ບໍ່ມີກຳແພງ, ບໍ່ມີໂຄສະນາ. ໂຄດຢູ່ GitHub ພາຍໃຕ້ MIT — ຮ່ວມເຮັດບົດຮຽນ ຫຼື ເພີ່ມຄຳສັບໃໝ່ໄດ້ເລີຍ!',
    path_title: 'ທາງຮຽນ', open_path: 'ເປີດທາງຮຽນ →',
    stat_words: 'ຄຳສັບ ແລະ ວາລີ', stat_lessons: 'ບົດຮຽນສັ້ນ', stat_grammar: 'ບົດໄວຍາກອນ', stat_culture: 'ເລື່ອງວັດທະນະທຳ',
    cta_title: 'ພ້ອມທີ່ຈະພູດ <span class="lao">ສະບາຍດີ</span> <span class="lao-roman">sa-bai-dii</span> ແລ້ວບໍ?', cta_sub: 'ບົດຮຽນທຳອິດໃຊ້ເວລາພຽງ 3 ນາທີ. ບໍ່ຕ້ອງລົງທະບຽນ.', cta_now: 'ເລີ່ມດຽວນີ້ — ຟຣີ ⚡',
    path_preview_sub: '{x} ໜ່ວຍ ຈາກ <span class="lao">ສະບາຍດີ</span> <span class="lao-roman">sa-bai-dii</span> ຈົນເຖິງປະໂຫຍກເຕັມ — ແລະ ສຸພາສິດ.',
    learn_title: 'ຮຽນພາສາລາວ', learn_sub: 'ບົດຮຽນສຳເລັດແລ້ວ · ຄວາມຄືບໜ້າບັນທຶກຢູ່ໃນເຄື່ອງນີ້',
    next_cta: 'ຕໍ່ໄປ', lb_title: '🏆 ຕາຕະລາງຄະແນນ', lb_all: 'ທັງໝົດ', lb_week: 'ອາທິດນີ້', lb_signin: 'ເຂົ້າສູ່ລະບົບ ຫຼື ສ້າງບັນຊີຟຣີ', lb_join: 'ເພື່ອເຂົ້າຮ່ວມຕາຕະລາງຄະແນນ.', lb_empty: 'ຍັງບໍ່ມີຄະແນນ — ທ່ານແມ່ນຄົນທຳອິດ!',
    goal_title: '🎯 ເປົ້າໝາຍປະຈຳວັນ', goal_today: 'XP ມື້ນີ້',
    review_title: 'ທົບທວນ', review_sub: 'ທົບທວນຕາມຊ່ອງເວລາ: ບົດຮຽນທີ່ຕ້ອງທົບທວນ', review_due: 'ຕ້ອງທົບທວນດຽວນີ້', review_upcoming: 'ຈະມາຮອດ', review_none: 'ຕອນນີ້ບໍ່ມີຫຍັງຕ້ອງທົບທວນ — ເຮັດໄດ້ດີຫຼາຍ! 🎉', review_start: 'ທົບທວນດຽວນີ້ →',
    rev_practice_title: 'ຝຶກຄຳສັບ', rev_practice_sub: 'ມີ {x} ຄຳສັບທີ່ຄວນຝຶກຕອນນີ້', rev_practice_sub_one: 'ມີ {x} ຄຳສັບທີ່ຄວນຝຶກຕອນນີ້', rev_practice_sub_any: 'ບໍ່ມີຄຳສັບຕິດຂັດ — ຈະຝຶກຄຳສັບທົ່ວໄປເພື່ອຄວາມຄ່ອງແຄ້ວ', rev_practice_start: 'ເລີ່ມຝຶກ',
    rev_q_listen: 'ເຈົ້າຍິນຫຍັງ?', rev_q_meaning: 'ແປວ່າຫຍັງ?', rev_q_recall: 'ພາສາລາວວ່າແນວໃດ?', rev_in_lao: 'ພາສາລາວ',
    rev_done_title: 'ຝຶກຈົບແລ້ວ!',
    words_title: 'ຄຳສັບ ແລະ ວາລີ', words_sub: 'ພຈະນານຸກົມລາວ–ອັງກິດ ຊອກຫາໄດ້. ກົດ 🔊 ເພື່ອຟັງຄຳສັບແຕ່ລະຄຳ.',
    words_search: 'ຊອກຫາ ຄຳລາວ, ຄຳອ່ານສຽງ ຫຼື ຄຳອັງກິດ… (ເຊັ່ນ "rice", "khao", ເຂົ້າ)',
    words_all: 'ທັງໝົດ ({x})', words_count_one: '{x} ຄຳ', words_count_many: '{x} ຄຳ', words_in: ' ໃນ «{y}»', words_matching: ' ກົງກັບ «{y}»',
    words_empty: 'ບໍ່ພົບຄຳສັບ. ລອງຄຳອື່ນເບິ່ງແດ່ — ຫຼື ເພີ່ມຄຳນີ້ໃສ່ GitHub! ✏️',
    grammar_title: 'ຕຳລາໄວຍາກອນ 📖', grammar_sub: 'ໄວຍາກອນລາວ ອະທິບາຍງ່າຍໆ ພ້ອມຕົວລາວ + ຄຳອ່ານສຽງ + ຄຳແປອັງກິດ.', grammar_toc: 'ສາລະບານ',
    culture_title: 'ວັດທະນະທຳລາວ 🇱🇦', culture_sub: 'ເລື່ອງທີ່ຢູ່ເບື້ອງຫຼັງພາສາ: ແຜ່ນດິນ, ບຸນປະເພນີ, ອາຫານ, ມາລະຍາດ — ແລະ ເຫດຜົນທີ່ຊາວລາວນອກປະເທດຍັງເວົ້າລາວກັນ. <span class="lao">ວັດທະນະທຳລາວ</span> <span class="lao-roman">wat-ta-na-tham Lao</span>.',
    account_title: 'ບັນຊີ', profile_title: 'ໂປຣໄຟລ໌',
    cont: 'ຕໍ່ໄປ', done_title: 'ສຳເລັດບົດຮຽນແລ້ວ!', fail_title: 'ໝົດຫົວໃຈແລ້ວ!', next_lesson: 'ບົດຮຽນຕໍ່ໄປ →', back_path: 'ກັບຄືນໄປໜ້າທາງຮຽນ', replay: '↻ ຫຼິ້ນຄືນ', try_again: '↻ ລອງຄືນ',
    summary_line: '{title} — ຖືກ {x}/{y} ຂໍ້ ({z}%)',
    summary_lao: 'ເຮັດໄດ້ດີຫຼາຍ! <i class="lao-roman">het dai dii laai!</i>',
    stat_xp: '⚡ ໄດ້ XP', stat_acc: 'ຄວາມແມ່ນຍຳ', stat_total_xp: 'XP ລວມ', summary_achievements: '🏅 ໄປໝາຍຄວາມສຳເລັດ',
    fail_sub: 'ຖືກຕ້ອງ {x}/{y} ຂໍ້ — ບໍ່ເປັນຫຍັງ, ລອງຄືນໃໝ່! <span class="lao-roman">baw pen nyang</span>',
    again_note: 'ອີກເທື່ອໜຶ່ງ — ການຝຶກຊ້ຳແມ່ນທາງພາໄປສູ່ການຈື່ໜັງ!',
    practice_mistakes: '🔁 ຝຶກຂໍ້ຜິດຄືນ', practice_mode: 'ໝູດຝຶກຊ້ຳ — ຂໍ້ຜິດຈະກັບມາຈົນກວ່າຈະຖືກຕ້ອງ',
    practice_done_title: 'ແກ້ໄຂຂໍ້ຜິດຄົບແລ້ວ!', practice_done_sub: 'ທ່ານຝຶກຊ້ຳທຸກຂໍ້ຜິດແລ້ວ — ນີ້ຊິເປັນເສັ້ນທາງສ້າງຄວາມຈືຈຳ.',
    combo_word: 'ຕິດຕໍ່ກັນ',
    weak_title: 'ຄຳສັບຕິດຂັດ', weak_sub: 'ຄຳທີ່ຕອບຜິດໃນບົດຮຽນ — ຝຶກຊ້ຳຈົນກວ່າຈະຈື່ໜັງ.',
    weak_practice: 'ຝຶກຄຳສັບຕິດຂັດຂອງທ່ານ',
    weak_empty_title: 'ຍັງບໍ່ມີຄຳຕິດຂັດ', weak_empty: 'ຄຳທີ່ຕອບຜິດຈະມາໜັງນີ້ — ຝຶກຊ້ຳຈົນກວ່າຈະຈື່ໜັງ.',
    drill_title: 'ຝຶກຄຳສັບຕິດຂັດ', drill_blurb: 'ຝຶກຊ້ຳອີກຄັ້ງກັບຄຳສັບທີ່ພາດໄປ.',
    learn_due_card: 'ບົດຮຽນທີ່ຕ້ອງທົບທວນ', learn_due_sub: 'ຝຶກຊ້ຳຊ່ວຍໃຫ້ຈື່ໜັງ — ທົບທວນດຽວນີ້.',
    review_now: 'ທົບທວນດຽວນີ້',
    learn_weak_card: 'ຄຳຕິດຂັດທີ່ຕ້ອງຝຶກ', learn_weak_sub: 'ທ່ານຕອບຜິດຄຳເຫຼົ່ານີ້ໃນບົດຮຽນ — ຝຶກຊ້ຳແດ່ກໍ່ນຶກໄດ້.',
    drill_now: 'ຝຶກຊ້ຳ',
    lb_sub: 'ຜູ້ຮຽນດີເດັ່ນ ຕາມ XP — ເຂົ້າສູ່ລະບົບ ເພື່ອທີ່ຈະປາກົດຢູ່ນີ້!', lb_offline: 'ເຊີບເວີອອບລາຍ — ບໍ່ເປີດຕາຕະລາງຄະແນນ. ຍັງຮຽນໄດ້ຕາມປົກກະຕິ ໃນນາມແຂກ!',
    unit_n: 'ໜ່ວຍ {x} — {y}', n_exercises: 'ແບບຝຶກ {x} ຂໍ້', goal_select: 'ເປົ້າໝາຍປະຈຳວັນ',
    f_username: 'ຊື່ຜູ້ໃຊ້', f_password: 'ລະຫັດຜ່ານ', f_pass2: 'ພິມລະຫັດຜ່ານອີກຄັ້ງ', f_display_name: 'ຊື່ທີ່ສະແດງ (ບໍ່ບັງຄັບ)',
    tab_register: 'ສ້າງບັນຊີ', auth_title: 'ບັນຊີ HianLao ຂອງທ່ານ',
    auth_sub: 'ຟຣີຕະຫຼອດໄປ. ຊິງ XP, ວັນຝຶກ ແລະ ບົດຮຽນທີ່ຮຽນແລ້ວ ໄປທຸກເຄື່ອງ ພ້ອມຂຶ້ນຕາຕະລາງຄະແນນ. ຖ້າບໍ່ມີບັນຊີ ຂໍ້ມູນຈະບັນທຶກຢູ່ໃນບາວເຊີນີ້.',
    auth_offline: 'ເຊີບເວີບໍ່ເປີດຕອນນີ້ — ຮຽນຕໍ່ໃນນາມແຂກໄດ້ (ຂໍ້ມູນຢູ່ໃນເຄື່ອງນີ້).',
    auth_pass_mismatch: 'ລະຫັດຜ່ານບໍ່ກົງກັນ.', auth_error: 'ມີບາງຢ່າງຜິດພາດ.',
    ph_username: 'ເຊັ່ນ laogirl_21', ph_pass: 'ຢ່າງໜ້ອຍ 8 ຕົວອັກສອນ', ph_pass2: 'ພິມລະຫັດຜ່ານອີກຄັ້ງ', ph_optional: 'ບໍ່ບັງຄັບ',
    guest_cta: 'ຮຽນຕໍ່ໃນນາມແຂກ →', logout: 'ອອກຈາກລະບົບ',
    member_since: 'ເປັນສະມາຊິກຕັ້ງແຕ່ {x} · @{u} · ຊິງກັບບັນຊີແລ້ວ ✔', stat_streak: 'ວັນຕິດຕໍ່ກັນ', stat_lessons_n: 'ບົດຮຽນ',
    lesson_not_found: 'ບໍ່ພົບບົດຮຽນ', lesson_not_found_sub: 'ບໍ່ມີບົດຮຽນ id "{x}".',
    ex_mc_lao2en: 'ຄຳນີ້ ໝາຍວ່າຫຍັງ?', ex_mc_en2lao: 'ອັນໃດແມ່ນ…?',
    ex_type_lao2en: 'ແປເປັນພາສາອັງກິດ', ex_type_en2lao: 'ຕອບເປັນພາສາລາວ',
    ex_match: 'ຈັບຄູ່ຄຳ', ex_listen: '🔊 ຟັງ ແລ້ວເລືອກ', ex_tiles: 'ຕໍ່ປະໂຫຍກ', ex_speak: '🎤 ພູດອອກສຽງ', ex_generic: 'ແບບຝຶກ',
    prompt_mc_en2lao: 'ເລືອກຄຳລາວຂອງ: <b>{x}</b>',
    prompt_type_en2lao: 'ກົດຄຳລາວຂອງ: <b>{x}</b>',
    prompt_listen: 'ກົດຫຼິ້ນ ແລ້ວເລືອກສິ່ງທີ່ຟັງໄດ້.',
    prompt_tiles: 'ແປ: <b>{x}</b>',
    ph_tiles: 'ກົດຄຳຕາມລຳດັບ…',
    hint_match: 'ຈັບຄູ່ໄດ້ {x}/{y} — ຈັບຄຳລາວທຸກຄຳກັບຄວາມໝາຍຂອງມັນ.',
    listen_play: '▶ ກົດຫຼິ້ນ ແລ້ວຟັງ', listen_novoice: '▶ ບາວເຊີນີ້ບໍ່ມີສຽງລາວ — ຈະພູດຄຳອ່ານສຽງໃຫ້ຟັງ: {x}', title_play_audio: 'ຫຼິ້ນສຽງ',
    speak_tap: '🎤 ກົດ ແລ້ວພູດ', speak_listening: 'ກຳລັງຟັງ… ພູດດຽວນີ້ 🎤', speak_missed: 'ບໍ່ໄດ້ຍິນຊັດ — ລອງໃໝ່ ຫຼື ກົດ "ຂ້ອຍພູດແລ້ວ".',
    speak_denied: 'ແຖມໄມຖືກຫ້າມໃນເວັບນີ້ — ອະນຸຍາດຜ່ານໄອຄອນ 🎤 ໃນແຖບຂອງບຣາວເຊີ ແລ້ວກົດໃໝ່.',
    speak_network: 'ການຈຳແນກສຽງ ຕ້ອງມີອິນເຕີເນັດ — ກວດການເຊື່ອມຕໍ່ ແລ້ວລອງໃໝ່.',
    speak_heard: 'ໄດ້ຍິນ: "{x}"', speak_said: 'ບໍ່ມີແຖມໄມ? ຂ້ອຍພູດແລ້ວ ✔', speak_nomic: 'ບາວເຊີນີ້ໃຊ້ແຖມໄມໄດ້ບໍ່. ຟັງດ້ວຍ 🔊, ພູດຕາມ ແລ້ວກົດລຸ່ມນີ້.',
    speak_said_loud: 'ຂ້ອຍພູດອອກສຽງແລ້ວ ✔', speak_hint: 'ຝຶກເວົ້າ',
    fb_ok_variants: 'ເກ່ງຫຼາຍ!|ຖືກຕ້ອງ!|ແຊບ! — ຄຳຊົມເພີຍລາວທີ່ດີທີ່ສຸດ|ເຮັດໄດ້ດີ!', fb_bad: 'ຍັງບໍ່ທັນຖືກ…', fb_correct_answer: 'ຄຳຕອບທີ່ຖືກ: <b>{x}</b>', fb_praise: 'ຕໍ່ໄປແບບນີ້ເລີຍ!|ເຮັດໄດ້ດີຫຼາຍ 🔥',
    see_result: 'ເບິ່ງຜົນລັບ',
  },
};
export const LANGS: Record<Lang, string> = { en: "EN", fr: "FR", la: "LA" };

// ---- module state + tiny subscription store ----
let lang: Lang = 'en';
try {
  const saved = localStorage.getItem('hianlao-lang') as Lang | null;
  if (saved && dict[saved]) lang = saved;
} catch { /* ignore */ }

const listeners = new Set<() => void>();
function emit() { for (const l of listeners) l(); }
function subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
export function getLang(): Lang { return lang; }

export function setLang(l: Lang) {
  if (!dict[l] || l === lang) return;
  lang = l;
  try { localStorage.setItem('hianlao-lang', l); } catch { /* ignore */ }
  emit();
}

export function t(key: string): string {
  return (dict[lang] && dict[lang][key]) ?? dict.en[key] ?? key;
}

/** "a|b|c" -> random variant, stable within give-up loops. */
export function pickVariant(list: string): string {
  const parts = list.split('|');
  return parts[Math.floor(Math.random() * parts.length)] ?? parts[0] ?? '';
}

// Localized data accessors (French mirrors live beside the English fields as *Fr).
// pf(obj, 'title') -> obj.titleFr in French mode, else obj.title.
export function pf(obj: unknown, field: string): string | undefined {
  if (obj == null) return undefined;
  const rec = obj as Record<string, unknown>;
  if (lang === 'fr') {
    const v = rec[field + 'Fr'];
    if (v != null) return v as string;
  }
  return rec[field] as string | undefined;
}

// def(w) -> meaning of a vocab entry in the current language (fr falls back to en only if empty).
export function def(w: { en: string; fr?: string } | undefined | null): string | undefined {
  if (!w) return undefined;
  if (lang === 'fr' && w.fr != null) return w.fr;
  return w.en;
}

// noteOf(w) -> the word's note in the current language.
export function noteOf(w: { note?: string; noteFr?: string } | undefined | null): string | undefined {
  if (!w) return undefined;
  if (lang === 'fr' && w.noteFr != null) return w.noteFr;
  return w.note;
}

// ---- React binding: re-renders consumers when the language changes ----

export function useI18n() {
  return useSyncExternalStore(subscribe, () => lang, () => 'en' as const);
}

/** Hook accessor bundle used by every client page. */
export function useT() {
  const current = useI18n();
  return {
    lang: current,
    t: (key: string, vars?: I18nVars) => interpolate(t(key), vars),
    tRaw: t,
    pickVariant,
    pf,
    def,
    noteOf,
    setLang,
    langs: LANGS,
  };
}

/** Interpolate {x} {y}… into an i18n string. */
export function interpolate(s: string, vars?: I18nVars): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));
}
