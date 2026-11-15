// HianLao learning path: units -> lessons -> exercises.
// Exercises are data; the engine in lesson.js renders them and shuffles options at runtime.
// Exercise shapes:
//   { type:'mc',     dir:'lao2en'|'en2lao', ids:[4 ids], answer:id }  pick the correct option
//   { type:'type',   dir:'lao2en'|'en2lao', id }                     tap word tiles together to translate (auto-submits when complete)
//   { type:'match',  ids:[5-6 ids] }                                 match Lao <-> English pairs
//   { type:'listen', ids:[4 ids], answer:id }                        hear the Lao word, pick its meaning (speech synthesis)
//   { type:'tiles',  lao, words:[tokens], en, romanization }         arrange word tiles to build the Lao sentence
//   { type:'speak',  id }                                            say it aloud (SpeechRecognition when available)

import { VOCAB_BY_ID as V } from './vocab.js';

const mc     = (answer, distractors, dir = 'lao2en') => ({ type: 'mc', dir, ids: [answer, ...distractors], answer });
const typeEx = (id, dir = 'lao2en') => ({ type: 'type', dir, id });
const match  = (ids) => ({ type: 'match', ids });
const listen = (answer, distractors) => ({ type: 'listen', ids: [answer, ...distractors], answer });
const speak  = (id) => ({ type: 'speak', id });
// Tiles carry a per-token karaoke romanization so the bank is readable before
// the learner knows the alphabet. Token romans come from the vocab table when
// the token exists there, otherwise from this curated particle/compound map
// (Vientiane pronunciation, site romanization convention).
const TILE_ROMAN = {
  'ບໍ': 'baw', 'ຄິດໄລ່': 'khit lai', 'ຄວາບ': 'khuap', 'ຊ້າໆ': 'chaa chaa',
  'ພົບກັນ': 'phop kan', 'ຂໍ': 'kho', 'ອາຫານລາວ': 'a-han Lao', 'ຝົນຕົກ': 'fon tok',
  'ບໍ່ໄປ': 'baw pai', 'ວາງ': 'wang', 'ທີ່': 'thi', 'ຮ້ານກາເຟ': 'haan kafe',
  'ນ້ຳຂຶ້ນ': 'nam khen', 'ລີບ': 'lip', 'ເລ່ືອມ': 'lueam', 'ໃຫ້': 'hai', 'ຕັກ': 'tak',
  'ຢູ່ທີ່ໃດ': 'yuu thi dai', 'ຢູ່ທີ່ນັ້ນ': 'yuu thi nan', 'ມື້ໜ້າ': 'mue-nao',
};
// lao string -> romanization for every single-word vocab entry.
const BY_LAO = new Map(Object.values(V).filter(x => !/\s/.test(x.lao)).map(x => [x.lao, x.romanization]));
const tileRomans = words => words.map(w => { const k = w.trim(); return BY_LAO.get(k) ?? TILE_ROMAN[k] ?? ''; });
const tiles = (lao, words, en, romanization, enFr) => {
  const wordRoman = tileRomans(words);
  // Rebuild the sentence romanization from the per-token romans so it can never
  // drift from them; keep any trailing punctuation of the source sentence.
  const punct = (/[?!.,…]+$/.exec(romanization) || [''])[0];
  return { type: 'tiles', lao, words, wordRoman, en, romanization: wordRoman.join(' ') + punct, enFr };
};

export const UNITS = [
  {
    id: 'u1', num: 1, icon: '👋', color: '#58cc02',
    title: 'First steps', titleFr: "Premiers pas", desc: 'Say hello, thank people and introduce yourself in Lao.', descFr: "Dis bonjour, remercie et présente-toi en lao.",
    lessons: [
      {
        id: 'u1l1', title: 'Hello & goodbye', titleFr: "Bonjour et au revoir", blurb: 'The very first words every Lao learner needs.', blurbFr: "Les tout premiers mots de tout apprenant du lao.",
        exercises: [
          mc('hello', ['goodbye', 'thanks', 'sorry']),
          typeEx('thanks'),
          mc('goodbye', ['hello', 'yes', 'no'], 'en2lao'),
          listen('sorry', ['hello', 'thanks', 'fine']),
          typeEx('yes', 'en2lao'),
          mc('ok_q', ['yes', 'no', 'sorry']),
          speak('hello'),
        ],
      },
      {
        id: 'u1l2', title: 'Introducing yourself', titleFr: "Se présenter", blurb: 'Names, meetings and "how are you?"', blurbFr: "Noms, rencontres et « comment allez-vous ? »",
        exercises: [
          mc('name_q', ['where', 'what', 'who']),
          mc('nice_meet', ['see_you', 'fine', 'goodbye'], 'en2lao'),
          typeEx('how_are_you'),
          tiles('ສະບາຍດີບໍ', ['ສະບາຍດີ', 'ບໍ'], 'How are you?', 'sa-bai-dii baw?', "Comment allez-vous ?"),
          listen('fine', ['nice_meet', 'tired', 'hungry']),
          match(['hello', 'goodbye', 'thanks', 'welcome', 'see_you', 'fine']),
        ],
      },
      {
        id: 'u1l3', title: 'Being polite', titleFr: "La politesse", blurb: 'Lao culture loves politeness — learn the key phrases.', blurbFr: "La culture lao adore la politesse — apprends les phrases clés.",
        exercises: [
          mc('thanks_a_lot', ['thanks', 'sorry', 'welcome']),
          typeEx('welcome'),
          mc('good_morning', ['good_night', 'goodbye', 'bye'], 'en2lao'),
          listen('good_night', ['good_morning', 'fine', 'good_luck']),
          typeEx('please'),
          match(['please', 'sorry', 'good_luck', 'ok_q', 'welcome', 'thanks_a_lot']),
          speak('good_morning'),
        ],
      },
    ],
  },
  {
    id: 'u2', num: 2, icon: '🧑‍🤝‍🧑', color: '#1cb0f6',
    title: 'People & family', titleFr: "Les gens et la famille", desc: 'Pronouns, family words and meeting people.', descFr: "Pronoms, mots de la famille et rencontres.",
    lessons: [
      {
        id: 'u2l1', title: 'Who am I?', titleFr: "Qui suis-je ?", blurb: 'Pronouns and the verb "to be".', blurbFr: "Les pronoms et le verbe « être ».",
        exercises: [
          mc('i', ['you', 'he_she', 'we']),
          mc('you', ['i', 'he_she', 'we'], 'en2lao'),
          typeEx('he_she'),
          mc('be', ['have', 'can', 'go']),
          tiles('ເປັນຄົນລາວ', ['ເປັນ', 'ຄົນລາວ'], 'I am Lao', 'pen khon Lao', "Je suis laotien(ne)"),
          listen('we', ['i', 'you', 'he_she']),
          speak('i'),
        ],
      },
      {
        id: 'u2l2', title: 'My family', titleFr: "Ma famille", blurb: 'The words for the people closest to you.', blurbFr: "Les mots pour les gens qui comptent le plus.",
        exercises: [
          mc('family', ['friend', 'house', 'school']),
          typeEx('father'),
          mc('mother', ['father', 'older_sib', 'teacher'], 'en2lao'),
          listen('older_sib', ['younger_sib', 'child', 'friend']),
          typeEx('child'),
          match(['father', 'mother', 'older_sib', 'younger_sib', 'friend', 'baby']),
        ],
      },
      {
        id: 'u2l3', title: 'Meeting people', titleFr: "Rencontrer du monde", blurb: 'Teachers, friends and fellow Lao people.', blurbFr: "Professeurs, amis et Laotiennes et Laotiens.",
        exercises: [
          mc('speak_lao_q', ['name_q', 'how_are_you', 'where_toilet']),
          typeEx('teacher'),
          mc('man', ['woman', 'child', 'teacher'], 'en2lao'),
          listen('lao_person', ['country', 'lao_lang', 'english']),
          mc('student', ['teacher', 'friend', 'doctor']),
          match(['teacher', 'student', 'man', 'woman', 'friend', 'lao_person']),
        ],
      },
    ],
  },
  {
    id: 'u3', num: 3, icon: '🔢', color: '#ff9600',
    title: 'Numbers & money', titleFr: "Nombres et argent", desc: 'Count, ask prices and handle kip.', descFr: "Compte, demande les prix et manipule les kips.",
    lessons: [
      {
        id: 'u3l1', title: 'Counting 1–10', titleFr: "Compter de 1 à 10", blurb: 'One to ten, plus the "person" counter.', blurbFr: "De un à dix, plus le classificateur des personnes.",
        exercises: [
          match(['n1', 'n2', 'n3', 'n4', 'n5', 'n10']),
          mc('n3', ['n2', 'n4', 'n5'], 'en2lao'),
          typeEx('n7'),
          listen('n5', ['n4', 'n6', 'n8']),
          mc('n10', ['n9', 'n1', 'n11'], 'lao2en'),
          typeEx('person', 'lao2en'),
        ],
      },
      {
        id: 'u3l2', title: 'Bigger numbers', titleFr: "Les grands nombres", blurb: 'From 11 up to one million.', blurbFr: "De 11 jusqu’à un million.",
        exercises: [
          mc('n20', ['n2', 'n10', 'n100'], 'en2lao'),
          typeEx('n100'),
          listen('n1000', ['n100', 'n10000', 'n1m']),
          mc('n1m', ['n1000', 'n10000', 'n100'], 'lao2en'),
          typeEx('money'),
          match(['n11', 'n20', 'n100', 'n1000', 'n10000', 'n1m']),
        ],
      },
      {
        id: 'u3l3', title: 'Shopping & prices', titleFr: "Courses et prix", blurb: '"How much?", cheap, expensive and the bill.', blurbFr: "« C’est combien ? », pas cher, cher et l’addition.",
        exercises: [
          mc('how_much', ['where', 'who', 'when']),
          tiles('ອັນນີ້ເທົ່າໃດ', ['ອັນນີ້', 'ເທົ່າໃດ'], 'How much is this?', 'an ni thao dai?', "C’est combien, ça ?"),
          typeEx('price'),
          mc('cheap', ['expensive', 'big', 'small'], 'en2lao'),
          listen('expensive', ['cheap', 'new', 'old']),
          mc('buy', ['sell', 'give', 'take']),
          tiles('ຄິດໄລ່ເງິນ', ['ຄິດໄລ່', 'ເງິນ'], 'The bill, please', 'khit lai ngoen', "L'addition, s'il vous plaît"),
        ],
      },
    ],
  },
  {
    id: 'u4', num: 4, icon: '🍜', color: '#ff4b4b',
    title: 'Food & drink', titleFr: "Manger et boire", desc: 'Rice, larb, papaya salad and ordering at a stall.', descFr: "Riz, larb, salade de papaye et commande à l’étal.",
    lessons: [
      {
        id: 'u4l1', title: 'The staples', titleFr: "Les aliments de base", blurb: 'Rice and water — the heart of every Lao meal.', blurbFr: "Le riz et l’eau — le cœur de chaque repas lao.",
        exercises: [
          mc('rice', ['white', 'n9', 'old']),
          typeEx('sticky_rice'),
          mc('water', ['juice', 'food', 'milk'], 'en2lao'),
          listen('food', ['water', 'house', 'school']),
          typeEx('juice'),
          match(['rice', 'sticky_rice', 'water', 'food', 'juice', 'snack']),
        ],
      },
      {
        id: 'u4l2', title: 'Famous Lao dishes', titleFr: "Les plats célèbres", blurb: 'The dishes Laos is famous for.', blurbFr: "Les plats dont le Laos est fier.",
        exercises: [
          mc('larb', ['mok_pa', 'noodles', 'sausage']),
          typeEx('papaya_salad', 'en2lao'),
          mc('mok_pa', ['larb', 'baguette', 'grilled_chicken'], 'en2lao'),
          listen('noodles', ['rice', 'papaya_salad', 'mok_pa']),
          typeEx('baguette'),
          mc('sausage', ['fish', 'egg', 'meat'], 'lao2en'),
        ],
      },
      {
        id: 'u4l3', title: 'Eating out', titleFr: "Manger dehors", blurb: 'Order food, say it is delicious, avoid chili.', blurbFr: "Commander, dire que c’est délicieux, éviter le piment.",
        exercises: [
          mc('eat', ['drink', 'sleep', 'walk']),
          mc('tasty', ['spicy', 'sweet', 'sour'], 'en2lao'),
          typeEx('spicy'),
          tiles('ບໍ່ກິນເຜັດ', ['ບໍ່', 'ກິນ', 'ເຜັດ'], "I don't eat spicy food", 'baw kin pet', "Je ne mange pas épicé"),
          listen('sweet', ['sour', 'salty', 'spicy']),
          mc('sour', ['sweet', 'salty', 'tasty'], 'en2lao'),
          tiles('ເຂົ້າປຽກເສັ້ນໜຶ່ງຄວາບ', ['ເຂົ້າປຽກເສັ້ນ', 'ໜຶ່ງ', 'ຄວາບ'], 'One bowl of noodles, please', 'khao piak sen neung khuap', "Un bol de nouilles, s'il vous plaît"),
          mc('eaten_q', ['how_are_you', 'see_you', 'nice_meet']),
        ],
      },
    ],
  },
  {
    id: 'u5', num: 5, icon: '🏙️', color: '#ce82ff',
    title: 'Around town', titleFr: "En ville", desc: 'Places, directions and getting around Laos.', descFr: "Lieux, directions et moyens de locomotion au Laos.",
    lessons: [
      {
        id: 'u5l1', title: 'Places', titleFr: "Les lieux", blurb: 'Home, school, temple, market and more.', blurbFr: "Maison, école, temple, marché et compagnie.",
        exercises: [
          mc('house', ['room', 'school', 'hotel']),
          typeEx('market'),
          mc('temple', ['house', 'road', 'shop'], 'en2lao'),
          listen('school', ['hospital', 'market', 'house']),
          typeEx('toilet'),
          match(['house', 'room', 'school', 'hospital', 'market', 'temple']),
        ],
      },
      {
        id: 'u5l2', title: 'Directions', titleFr: "Les directions", blurb: 'Left, right, straight ahead…', blurbFr: "À gauche, à droite, tout droit…",
        exercises: [
          mc('left', ['right', 'straight', 'turn'], 'en2lao'),
          typeEx('right'),
          mc('straight', ['left', 'under', 'outside']),
          listen('turn', ['walk', 'sit', 'stand']),
          tiles('ລ້ຽວຊ້າຍ', ['ລ້ຽວ', 'ຊ້າຍ'], 'Turn left', 'liaw sai', "Tournez à gauche"),
          match(['left', 'right', 'on', 'under', 'here', 'there']),
        ],
      },
      {
        id: 'u5l3', title: 'Getting around', titleFr: "Se déplacer", blurb: 'Cars, boats, planes and the mighty Mekong.', blurbFr: "Voitures, bateaux, avions et le puissant Mékong.",
        exercises: [
          mc('car', ['boat', 'bicycle', 'plane']),
          typeEx('bicycle'),
          mc('plane', ['car', 'boat', 'ticket'], 'en2lao'),
          listen('boat', ['car', 'road', 'mountain']),
          tiles('ໄປຕະຫຼາດ', ['ໄປ', 'ຕະຫຼາດ'], 'Go to the market', 'pai ta-lat', "Allez au marché"),
          match(['car', 'boat', 'plane', 'airport', 'ticket', 'mekong']),
        ],
      },
    ],
  },
  {
    id: 'u6', num: 6, icon: '🗣️', color: '#00cd9c',
    title: 'Everyday verbs', titleFr: "Les verbes du quotidien", desc: 'Go, come, speak, learn — the verbs of daily life.', descFr: "Aller, venir, parler, apprendre — les verbes de la vie quotidienne.",
    lessons: [
      {
        id: 'u6l1', title: 'Action verbs', titleFr: "Les verbes d’action", blurb: 'Move, talk, read and see.', blurbFr: "Bouger, parler, lire et voir.",
        exercises: [
          mc('go', ['come', 'sit', 'sleep']),
          typeEx('come'),
          mc('speak', ['listen', 'read', 'write'], 'en2lao'),
          listen('read', ['write', 'see', 'think']),
          typeEx('write'),
          mc('see', ['hear', 'eat', 'go'], 'lao2en'),
          match(['go', 'come', 'speak', 'listen', 'read', 'write']),
        ],
      },
      {
        id: 'u6l2', title: 'Daily routines', titleFr: "Les routines du jour", blurb: 'Learn, work, walk, sleep…', blurbFr: "Apprendre, travailler, marcher, dormir…",
        exercises: [
          mc('learn', ['work', 'sleep', 'eat'], 'lao2en'),
          typeEx('work'),
          mc('sit', ['stand', 'walk', 'sleep'], 'en2lao'),
          listen('walk', ['sit', 'stand', 'run']),
          typeEx('sleep'),
          tiles('ກຳລັງຮຽນພາສາລາວ', ['ກຳລັງ', 'ຮຽນ', 'ພາສາລາວ'], 'I am learning Lao', 'kamlang hian pha-sa Lao', "J'apprends le lao"),
        ],
      },
      {
        id: 'u6l3', title: 'Likes & feelings', titleFr: "Aimer et ressentir", blurb: 'What you love, want and understand.', blurbFr: "Ce que tu aimes, veux et comprends.",
        exercises: [
          mc('like', ['love', 'want', 'no']),
          typeEx('love'),
          mc('want', ['like', 'have', 'can'], 'en2lao'),
          listen('understand', ['not_understand', 'think', 'see']),
          mc('not_understand', ['understand', 'like', 'want']),
          tiles('ຂ້ອຍຮັກເຈົ້າ', ['ຂ້ອຍ', 'ຮັກ', 'ເຈົ້າ'], 'I love you', 'khoi hak jao', "Je t'aime"),
          speak('love'),
        ],
      },
    ],
  },
  {
    id: 'u7', num: 7, icon: '🎨', color: '#ff86d0',
    title: 'Describing the world', titleFr: "Décrire le monde", desc: 'Adjectives, tastes and colors.', descFr: "Adjectifs, goûts et couleurs.",
    lessons: [
      {
        id: 'u7l1', title: 'Adjectives', titleFr: "Les adjectifs", blurb: 'Good, big, beautiful and more.', blurbFr: "Bon, grand, beau et compagnie.",
        exercises: [
          mc('good', ['bad', 'big', 'new']),
          typeEx('beautiful'),
          mc('big', ['small', 'old', 'new'], 'en2lao'),
          listen('small', ['big', 'good', 'bad']),
          typeEx('new'),
          match(['good', 'bad', 'beautiful', 'big', 'small', 'old']),
        ],
      },
      {
        id: 'u7l2', title: 'Tastes & ingredients', titleFr: "Goûts et ingrédients", blurb: 'Spicy, sweet, sour… and what you eat.', blurbFr: "Épicé, sucré, acide… et ce que tu manges.",
        exercises: [
          mc('spicy', ['sweet', 'sour', 'salty']),
          typeEx('sweet'),
          mc('sour', ['salty', 'spicy', 'tasty'], 'en2lao'),
          listen('salty', ['sweet', 'sour', 'spicy']),
          mc('tasty', ['cheap', 'expensive', 'big']),
          match(['egg', 'meat', 'fish', 'chicken', 'vegetable', 'fruit']),
        ],
      },
      {
        id: 'u7l3', title: 'Colors', titleFr: "Les couleurs", blurb: 'The rainbow in Lao.', blurbFr: "L’arc-en-ciel en lao.",
        exercises: [
          match(['red', 'blue', 'green', 'yellow', 'black', 'white']),
          mc('orange', ['pink', 'brown', 'red'], 'en2lao'),
          typeEx('pink'),
          listen('brown', ['black', 'blue', 'green']),
          mc('white', ['rice', 'black', 'red'], 'lao2en'),
        ],
      },
    ],
  },
  {
    id: 'u8', num: 8, icon: '⏰', color: '#f7b500',
    title: 'Time & conversation', titleFr: "Temps et conversations", desc: 'Days, hours and real small talk.', descFr: "Jours, heures et vraies petites conversations.",
    lessons: [
      {
        id: 'u8l1', title: 'Days & time', titleFr: "Jours et heures", blurb: 'Today, tomorrow, now and o\'clock.', blurbFr: "Aujourd’hui, demain, maintenant et l’heure.",
        exercises: [
          mc('today', ['yesterday', 'tomorrow', 'now']),
          typeEx('tomorrow'),
          mc('morning', ['evening', 'night', 'day'], 'en2lao'),
          listen('night', ['morning', 'evening', 'today']),
          typeEx('now'),
          match(['today', 'yesterday', 'tomorrow', 'morning', 'evening', 'now']),
        ],
      },
      {
        id: 'u8l2', title: 'Small talk', titleFr: "Petits bavardages", blurb: 'The phrases you will actually use.', blurbFr: "Les phrases que tu utiliseras vraiment.",
        exercises: [
          mc('speak_lao_q', ['name_q', 'how_much_this', 'where_toilet']),
          tiles('ພູດຊ້າໆໄດ້ບໍ', ['ພູດ', 'ຊ້າໆ', 'ໄດ້', 'ບໍ'], 'Please speak slowly', 'phut chaa chaa dai baw?', "Parlez lentement, s'il vous plaît"),
          mc('not_understand_p', ['speak_lao_q', 'fine', 'nice_meet'], 'en2lao'),
          listen('how_are_you', ['fine', 'eaten_q', 'name_q']),
          tiles('ກິນເຂົ້າແລ້ວບໍ', ['ກິນ', 'ເຂົ້າ', 'ແລ້ວ', 'ບໍ'], 'Have you eaten yet?', 'kin khao laew baw?', "Vous avez déjà mangé ?"),
          mc('where_toilet', ['where', 'how_much', 'who']),
        ],
      },
      {
        id: 'u8l3', title: 'Putting it together', titleFr: "On assemble tout", blurb: 'Build real Lao sentences. You have got this!', blurbFr: "Construis de vraies phrases lao. Tu peux le faire !",
        exercises: [
          tiles('ເປັນຄົນລາວ', ['ເປັນ', 'ຄົນລາວ'], 'I am Lao', 'pen khon Lao', "Je suis laotien(ne)"),
          tiles('ພົບກັນມື້ໜ້າ', ['ພົບກັນ', 'ມື້ໜ້າ'], 'See you tomorrow', 'phop kan mue-nao', "À demain"),
          mc('learning_lao', ['i_am_lao', 'speak_lao_q', 'see_you_tomorrow']),
          tiles('ພົບກັນໃໝ່', ['ພົບກັນ', 'ໃໝ່'], 'See you again', 'phoep kan mai', "À bientôt"),
          speak('nice_meet'),
          match(['hello', 'thanks', 'see_you', 'i_am_lao', 'learning_lao', 'speak_lao_q']),
        ],
      },
    ],
  },
  {
    id: 'u9', num: 9, icon: '🧳', color: '#8b5cf6',
    title: 'Travel & emergencies', titleFr: "Voyage et urgences", desc: 'Get help, handle health issues and find your way around Laos.', descFr: "Demander de l’aide, gérer la santé et trouver ton chemin au Laos.",
    lessons: [
      {
        id: 'u9l1', title: 'Getting help', titleFr: "Demander de l’aide", blurb: 'Help, lost, police and phones.', blurbFr: "Secours, égarement, police et téléphones.",
        exercises: [
          mc('help', ['eat', 'sleep', 'walk']),
          mc('help_bang', ['hello', 'goodbye', 'thanks'], 'en2lao'),
          typeEx('lost'),
          listen('lost_way', ['help', 'sick', 'police']),
          mc('police', ['doctor', 'teacher', 'friend']),
          typeEx('phone'),
          speak('help_bang'),
        ],
      },
      {
        id: 'u9l2', title: 'Health', titleFr: "La santé", blurb: 'When you or someone else feels sick.', blurbFr: "Quand toi ou quelqu’un se sent malade.",
        exercises: [
          mc('sick', ['happy', 'tired', 'hungry']),
          typeEx('doctor'),
          mc('medicine', ['water', 'food', 'ticket'], 'en2lao'),
          listen('pharmacy', ['hospital', 'school', 'market']),
          tiles('ຂ້ອຍປ່ວຍ', ['ຂ້ອຍ', 'ປ່ວຍ'], 'I am sick', 'khoi puay', "Je suis malade"),
          match(['sick', 'doctor', 'medicine', 'pharmacy', 'hospital', 'water']),
        ],
      },
      {
        id: 'u9l3', title: 'On the road', titleFr: "Sur la route", blurb: 'Taxis, passports, rooms and asking the way.', blurbFr: "Taxis, passeports, chambres et demander son chemin.",
        exercises: [
          mc('taxi', ['boat', 'bicycle', 'plane']),
          typeEx('passport'),
          tiles('ຂໍຫ້ອງໜຶ່ງ', ['ຂໍ', 'ຫ້ອງ', 'ໜຶ່ງ'], 'I would like one room', 'kho hong neung', "Je voudrais une chambre"),
          listen('exchange', ['money', 'price', 'cheap']),
          mc('how_to_wat', ['where_market', 'how_are_you', 'name_q']),
          mc('where_market', ['how_to_wat', 'bill_please', 'where_toilet'], 'en2lao'),
          match(['taxi', 'passport', 'phone', 'exchange', 'airport', 'hotel']),
        ],
      },
    ],
  },
  {
    id: 'u10', num: 10, icon: '💭', color: '#f59e0b',
    title: 'Feelings & opinions', titleFr: "Sentiments et opinions", desc: 'Say what you think, feel and hope for.', descFr: "Dis ce que tu penses, ressens et espères.",
    lessons: [
      {
        id: 'u10l1', title: 'Opinions', titleFr: "Les opinions", blurb: '"I think that…" and what matters to you.', blurbFr: "« Je pense que… » et ce qui compte pour toi.",
        exercises: [
          mc('think_that', ['understand', 'want', 'like']),
          tiles('ຄິດວ່າອາຫານລາວແຊບ', ['ຄິດວ່າ', 'ອາຫານລາວ', 'ແຊບ'], 'I think Lao food is delicious', 'khit wa a-han Lao saep', "Je trouve la cuisine lao délicieuse"),
          typeEx('possible'),
          mc('important', ['fun', 'easy', 'small'], 'en2lao'),
          listen('interesting', ['difficult', 'bored', 'afraid']),
        ],
      },
      {
        id: 'u10l2', title: 'Emotions', titleFr: "Les émotions", blurb: 'Afraid, angry, sad, hopeful…', blurbFr: "Peur, colère, tristesse, espoir…",
        exercises: [
          mc('afraid', ['angry', 'sad', 'fun']),
          typeEx('angry'),
          mc('sad', ['happy', 'hope', 'dream'], 'en2lao'),
          listen('miss', ['think_that', 'bored', 'lonely']),
          typeEx('hope'),
          match(['afraid', 'angry', 'sad', 'miss', 'hope', 'dream', 'bored']),
        ],
      },
      {
        id: 'u10l3', title: 'Putting it together', titleFr: "On assemble tout", blurb: 'Real sentences about real feelings.', blurbFr: "De vraies phrases sur de vrais sentiments.",
        exercises: [
          tiles('ຖ້າຝົນຕົກກໍ່ບໍ່ໄປ', ['ຖ້າ', 'ຝົນຕົກ', 'ກໍ່', 'ບໍ່ໄປ'], "If it rains, we won't go", 'tha fon tok ko baw pai', "S'il pleut, on n'ira pas"),
          mc('fun', ['sad', 'afraid', 'bored']),
          typeEx('difficult'),
          mc('easy', ['difficult', 'expensive', 'big'], 'en2lao'),
          mc('surprised', ['lonely', 'interesting', 'possible']),
          match(['fun', 'interesting', 'difficult', 'easy', 'surprised', 'important', 'possible']),
        ],
      },
    ],
  },
  {
    id: 'u11', num: 11, icon: '💼', color: '#0ea5e9',
    title: 'Work & plans', titleFr: "Travail et projets", desc: 'Meetings, appointments, calls and making plans.', descFr: "Réunions, rendez-vous, appels et organisation.",
    lessons: [
      {
        id: 'u11l1', title: 'At work', titleFr: "Au travail", blurb: 'Bosses, meetings and being busy.', blurbFr: "Patrons, réunions et emplois du temps chargés.",
        exercises: [
          mc('work', ['sleep', 'eat', 'walk']),
          typeEx('boss'),
          mc('meeting', ['market', 'school', 'hospital'], 'en2lao'),
          listen('busy', ['free_time', 'late', 'fun']),
          typeEx('late'),
          match(['work', 'boss', 'meeting', 'busy', 'late', 'learn']),
        ],
      },
      {
        id: 'u11l2', title: 'Making plans', titleFr: "Faire des projets", blurb: 'Plans, appointments and meeting at the café.', blurbFr: "Plans, rendez-vous et café ensemble.",
        exercises: [
          mc('plan', ['food', 'money', 'house']),
          tiles('ວາງແຜນ', ['ວາງ', 'ແຜນ'], 'to plan', 'wang phaen', "planifier"),
          mc('appointment', ['plan', 'late', 'busy'], 'en2lao'),
          listen('free_time', ['busy', 'sick', 'tired']),
          tiles('ພົບກັນທີ່ຮ້ານກາເຟ', ['ພົບກັນ', 'ທີ່', 'ຮ້ານກາເຟ'], 'See you at the café', 'phop kan thi haan kafe', "On se voit au café"),
        ],
      },
      {
        id: 'u11l3', title: 'Calls & messages', titleFr: "Appels et messages", blurb: 'Phone calls, emails and messages.', blurbFr: "Appels téléphoniques, e-mails et messages.",
        exercises: [
          mc('call', ['write', 'read', 'eat']),
          typeEx('message'),
          listen('email', ['letter', 'phone', 'computer']),
          tiles('ໂທຫາຂ້ອຍໄດ້ບໍ', ['ໂທ', 'ຫາ', 'ຂ້ອຍ', 'ໄດ້', 'ບໍ'], 'Can you call me?', 'tho ha khoi dai baw?', "Pouvez-vous m’appeler ?"),
          match(['call', 'message', 'email', 'letter', 'phone', 'computer']),
        ],
      },
    ],
  },
  {
    id: 'u12', num: 12, icon: '💬', color: '#d946ef',
    title: 'Proverbs & wisdom', titleFr: "Proverbes et sagesse", desc: 'Famous Lao sayings — learned in the situations where you hear them.', descFr: "Célèbres dictons lao — appris dans les situations où on les entend.",
    lessons: [
      {
        id: 'u12l1', title: 'Seize the moment', titleFr: "Saisir le moment", blurb: 'During Pi Mai the Mekong rises fast. Grandma laughs: "When the water rises, scoop quickly" — grab the good moment while it lasts!', blurbFr: "Pendant Pi Mai le Mékong monte vite. Maman rit : « Quand l’eau monte, écoper vite » — profite du bon moment tant qu’il dure !",
        exercises: [
          mc('pv_scoop', ['pv_slow', 'pv_effort', 'success']),
          tiles(V.pv_scoop.lao, ['ນ້ຳຂຶ້ນ ', 'ໃຫ້', 'ລີບ', 'ຕັກ'], 'When the water rises, scoop quickly', 'nam khen hai lip tak', "Quand l’eau monte, écoper vite"),
          listen('pv_scoop', ['pv_slow', 'pv_effort', 'water_rises']),
          mc('water_rises', ['fish', 'rice', 'house']),
          typeEx('scoop', 'en2lao'),
          match(['pv_scoop', 'pv_slow', 'pv_effort', 'water_rises', 'scoop', 'effort']),
          speak('water_rises'),
        ],
      },
      {
        id: 'u12l2', title: 'Slow and steady', titleFr: "Doucement mais sûrement", blurb: 'Grandpa sharpens his knife for a long time. "Slowly you get a beautiful blade," he smiles — patience makes quality.', blurbFr: "Papi aiguise son couteau longtemps. « Vas-y doucement et tu auras une belle lame », sourit-il — la patience fait la qualité.",
        exercises: [
          mc('pv_slow', ['pv_scoop', 'pv_effort', 'blade']),
          listen('pv_slow', ['pv_scoop', 'pv_effort', 'blade']),
          tiles(V.pv_slow.lao, ['ຊ້າໆ ', 'ໄດ້', 'ແຜ່ນ', 'ເລ່ືອມ', 'ງາມ'], 'Slowly you get a beautiful blade', 'chaa chaa dai phaen lueam ngam', "Vas-y doucement et tu auras une belle lame"),
          mc('blade', ['fish', 'rice', 'water'], 'en2lao'),
          typeEx('slow'),
          match(['pv_slow', 'blade', 'slow', 'beautiful', 'effort', 'pv_effort']),
          speak('pv_slow'),
        ],
      },
      {
        id: 'u12l3', title: 'Effort & success', titleFr: "Effort et réussite", blurb: 'Exam tomorrow! Mum says: "Where there is effort, there is success." You have been studying hard — you have got this!', blurbFr: "Examen demain ! Maman dit : « Là où il y a l’effort, il y a la réussite. » Tu as bien révisé — tu vas y arriver !",
        exercises: [
          mc('pv_effort', ['pv_scoop', 'pv_slow', 'success']),
          tiles(V.pv_effort.lao, ['ຄວາມພະຍາຍາມ', 'ຢູ່ທີ່ໃດ ', 'ຄວາມສຳເລັດ', 'ຢູ່ທີ່ນັ້ນ'], 'Where there is effort, there is success', 'khwam pha-nya-nyam yuu thi dai, khwam sam-lat yuu thi nan', "Là où il y a l’effort, il y a la réussite"),
          listen('pv_effort', ['pv_scoop', 'pv_slow', 'where_q']),
          typeEx('effort', 'en2lao'),
          mc('success', ['blade', 'fish', 'water']),
          mc('where_q', ['here', 'there', 'now']),
          match(['pv_effort', 'effort', 'success', 'where_q', 'pv_scoop', 'pv_slow']),
          speak('pv_effort'),
        ],
      },
    ],
  },
  {
    id: 'u13', num: 13, icon: '🗣️', color: '#14b8a6',
    title: 'Everyday dialogues', titleFr: "Dialogues du quotidien", desc: 'Short real-life conversations: the market, a Lao restaurant, meeting friends.', descFr: "Courtes conversations de la vraie vie : le marché, un restaurant lao, des retrouvailles entre amis.",
    lessons: [
      {
        id: 'u13l1', title: 'At the market', titleFr: "Au marché", blurb: 'You walk into a market in Vientiane. A vendor smiles: "How much is this?" Time to haggle politely — and ask for the bill at the end!', blurbFr: "Tu entres dans un marché à Vientiane. Une vendeuse sourit : « C’est combien, ça ? » L’heure de marchander poliment — et de demander l’addition à la fin !",
        exercises: [
          mc('how_much_this', ['where_toilet', 'name_q', 'eaten_q']),
          tiles('ອັນນີ້ເທົ່າໃດ', ['ອັນນີ້', 'ເທົ່າໃດ'], 'How much is this?', 'an ni thao dai?', "C’est combien, ça ?"),
          listen('bill_please', ['how_much_this', 'eaten_q', 'speak_slow']),
          mc('cheap', ['expensive', 'big', 'small'], 'en2lao'),
          tiles('ຄິດໄລ່ເງິນ', ['ຄິດໄລ່', 'ເງິນ'], 'The bill, please', 'khit lai ngoen', "L'addition, s'il vous plaît"),
          typeEx('buy'),
          match(['how_much_this', 'bill_please', 'cheap', 'expensive', 'buy', 'money']),
          speak('how_much_this'),
        ],
      },
      {
        id: 'u13l2', title: 'At a Lao restaurant', titleFr: "Au restaurant lao", blurb: 'Lunch with friends at a riverside stall. "Have you eaten yet?" — the classic Lao greeting — then order noodles and say the food is delicious.', blurbFr: "Déjeuner entre amis à un étal au bord du fleuve. « Vous avez déjà mangé ? » — la salutation classique lao — puis commande des nouilles et dis que c’est délicieux.",
        exercises: [
          mc('eaten_q', ['how_are_you', 'speak_lao_q', 'name_q']),
          listen('eaten_q', ['speak_slow', 'how_much_this', 'nice_meet']),
          tiles('ກິນເຂົ້າແລ້ວບໍ', ['ກິນ', 'ເຂົ້າ', 'ແລ້ວ', 'ບໍ'], 'Have you eaten yet?', 'kin khao laew baw?', "Vous avez déjà mangé ?"),
          mc('tasty', ['spicy', 'sweet', 'sour'], 'en2lao'),
          tiles('ບໍ່ກິນເຜັດ', ['ບໍ່', 'ກິນ', 'ເຜັດ'], "I don't eat spicy food", 'baw kin pet', "Je ne mange pas épicé"),
          tiles('ເຂົ້າປຽກເສັ້ນໜຶ່ງຄວາບ', ['ເຂົ້າປຽກເສັ້ນ', 'ໜຶ່ງ', 'ຄວາບ'], 'One bowl of noodles, please', 'khao piak sen neung khuap', "Un bol de nouilles, s'il vous plaît"),
          match(['eaten_q', 'tasty', 'spicy', 'eat', 'food', 'rice']),
          speak('eaten_q'),
        ],
      },
      {
        id: 'u13l3', title: 'Meeting friends', titleFr: "Retrouvailles", blurb: 'You meet a Lao friend at the café after class. "Do you speak Lao?" — small talk, making plans and saying goodbye until tomorrow.', blurbFr: "Tu retrouves un ami lao au café après le cours. « Parlez-vous lao ? » — petits bavardages, projets ensemble et au revoir jusqu’à demain.",
        exercises: [
          mc('speak_lao_q', ['name_q', 'how_are_you', 'where_toilet']),
          listen('speak_slow', ['speak_lao_q', 'fine', 'nice_meet']),
          tiles('ພູດຊ້າໆໄດ້ບໍ', ['ພູດ', 'ຊ້າໆ', 'ໄດ້', 'ບໍ'], 'Please speak slowly', 'phut chaa chaa dai baw?', "Parlez lentement, s'il vous plaît"),
          tiles('ພົບກັນມື້ໜ້າ', ['ພົບກັນ', 'ມື້ໜ້າ'], 'See you tomorrow', 'phop kan mue-nao', "À demain"),
          mc('learning_lao', ['i_am_lao', 'speak_lao_q', 'see_you_tomorrow']),
          tiles('ກຳລັງຮຽນພາສາລາວ', ['ກຳລັງ', 'ຮຽນ', 'ພາສາລາວ'], 'I am learning Lao', 'kamlang hian pha-sa Lao', "J'apprends le lao"),
          match(['speak_lao_q', 'speak_slow', 'nice_meet', 'see_you', 'learning_lao', 'plan']),
          speak('nice_meet'),
        ],
      },
    ],
  },
];

export const LESSON_BY_ID = {};
for (const u of UNITS) for (const l of u.lessons) LESSON_BY_ID[l.id] = { ...l, unit: u };

export function validateUnits() {
  const errors = [];
  for (const u of UNITS) {
    for (const l of u.lessons) {
      if (!l.id || !l.title || !l.exercises?.length) errors.push(`lesson ${l.id} malformed`);
      for (const ex of l.exercises) {
        const ids = ex.ids || (ex.id ? [ex.id] : []) || (ex.type === 'tiles' ? [] : []);
        for (const id of ids) if (!V[id]) errors.push(`${l.id}: unknown vocab id "${id}"`);
        if ((ex.type === 'mc' || ex.type === 'listen') && !V[ex.answer]) errors.push(`${l.id}: unknown answer "${ex.answer}"`);
        if (ex.type === 'type' || ex.type === 'speak') if (!V[ex.id]) errors.push(`${l.id}: unknown id "${ex.id}"`);
        if (ex.type === 'tiles' && ex.words.join('') !== ex.lao) errors.push(`${l.id}: tiles do not join to lao "${ex.lao}"`);
      }
    }
  }
  return errors;
}
