// HianLao learning path: units -> lessons -> exercises.
// Exercises are data; the engine in lesson.js renders them and shuffles options at runtime.
// Exercise shapes:
//   { type:'mc',     dir:'lao2en'|'en2lao', ids:[4 ids], answer:id }  pick the correct option
//   { type:'type',   dir:'lao2en'|'en2lao', id }                     type the translation (Lao script or transliteration accepted)
//   { type:'match',  ids:[5-6 ids] }                                 match Lao <-> English pairs
//   { type:'listen', ids:[4 ids], answer:id }                        hear the Lao word, pick its meaning (speech synthesis)
//   { type:'tiles',  lao, words:[tokens], en, tr }                  arrange word tiles to build the Lao sentence
//   { type:'speak',  id }                                            say it aloud (SpeechRecognition when available)

import { VOCAB_BY_ID as V } from './vocab.js';

const mc     = (answer, distractors, dir = 'lao2en') => ({ type: 'mc', dir, ids: [answer, ...distractors], answer });
const typeEx = (id, dir = 'lao2en') => ({ type: 'type', dir, id });
const match  = (ids) => ({ type: 'match', ids });
const listen = (answer, distractors) => ({ type: 'listen', ids: [answer, ...distractors], answer });
const speak  = (id) => ({ type: 'speak', id });
const tiles  = (lao, words, en, tr) => ({ type: 'tiles', lao, words, en, tr });

export const UNITS = [
  {
    id: 'u1', num: 1, icon: '👋', color: '#58cc02',
    title: 'First steps', desc: 'Say hello, thank people and introduce yourself in Lao.',
    lessons: [
      {
        id: 'u1l1', title: 'Hello & goodbye', blurb: 'The very first words every Lao learner needs.',
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
        id: 'u1l2', title: 'Introducing yourself', blurb: 'Names, meetings and "how are you?"',
        exercises: [
          mc('name_q', ['where', 'what', 'who']),
          mc('nice_meet', ['see_you', 'fine', 'goodbye'], 'en2lao'),
          typeEx('how_are_you'),
          tiles('ສບາຢດີໄຫມ', ['ສບາຢດີ', 'ໄຫມ'], 'How are you?', 'sa-bai-dii mai?'),
          listen('fine', ['nice_meet', 'tired', 'hungry']),
          match(['hello', 'goodbye', 'thanks', 'welcome', 'see_you', 'fine']),
        ],
      },
      {
        id: 'u1l3', title: 'Being polite', blurb: 'Lao culture loves politeness — learn the key phrases.',
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
    title: 'People & family', desc: 'Pronouns, family words and meeting people.',
    lessons: [
      {
        id: 'u2l1', title: 'Who am I?', blurb: 'Pronouns and the verb "to be".',
        exercises: [
          mc('i', ['you', 'he_she', 'we']),
          mc('you', ['i', 'he_she', 'we'], 'en2lao'),
          typeEx('he_she'),
          mc('be', ['have', 'can', 'go']),
          tiles('ເປັນຄນລາວ', ['ເປັນ', 'ຄນລາວ'], 'I am Lao', 'pen khon Lao'),
          listen('we', ['i', 'you', 'he_she']),
          speak('i'),
        ],
      },
      {
        id: 'u2l2', title: 'My family', blurb: 'The words for the people closest to you.',
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
        id: 'u2l3', title: 'Meeting people', blurb: 'Teachers, friends and fellow Lao people.',
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
    title: 'Numbers & money', desc: 'Count, ask prices and handle kip.',
    lessons: [
      {
        id: 'u3l1', title: 'Counting 1–10', blurb: 'One to ten, plus the "person" counter.',
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
        id: 'u3l2', title: 'Bigger numbers', blurb: 'From 11 up to one million.',
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
        id: 'u3l3', title: 'Shopping & prices', blurb: '"How much?", cheap, expensive and the bill.',
        exercises: [
          mc('how_much', ['where', 'who', 'when']),
          tiles('ອັນນີ້ເທ່າໄຫຣ່', ['ອັນນີ້', 'ເທ່າໄຫຣ່'], 'How much is this?', 'an ni thao dai?'),
          typeEx('price'),
          mc('cheap', ['expensive', 'big', 'small'], 'en2lao'),
          listen('expensive', ['cheap', 'new', 'old']),
          mc('buy', ['sell', 'give', 'take']),
          tiles('ເກັບເງິນໄດ້ບ່', ['ເກັບເງິນ', 'ໄດ້', 'ບ່'], 'The bill, please', 'kep ngoen dai bo?'),
        ],
      },
    ],
  },
  {
    id: 'u4', num: 4, icon: '🍜', color: '#ff4b4b',
    title: 'Food & drink', desc: 'Rice, larb, papaya salad and ordering at a stall.',
    lessons: [
      {
        id: 'u4l1', title: 'The staples', blurb: 'Rice and water — the heart of every Lao meal.',
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
        id: 'u4l2', title: 'Famous Lao dishes', blurb: 'The dishes Laos is famous for.',
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
        id: 'u4l3', title: 'Eating out', blurb: 'Order food, say it is delicious, avoid chili.',
        exercises: [
          mc('eat', ['drink', 'sleep', 'walk']),
          mc('tasty', ['spicy', 'sweet', 'sour'], 'en2lao'),
          typeEx('spicy'),
          tiles('ໄມ່ກິນເຜັດ', ['ໄມ່', 'ກິນ', 'ເຜັດ'], "I don't eat spicy food", 'mai kin pet'),
          listen('sweet', ['sour', 'salty', 'spicy']),
          mc('sour', ['sweet', 'salty', 'tasty'], 'en2lao'),
          tiles('ຂ້າວເປີຢກເສ້ນຫນຶ່ງຊາມ', ['ຂ້າວເປີຢກເສ້ນ', 'ຫນຶ່ງ', 'ຊາມ'], 'One bowl of noodles, please', 'khao piak sen neung cham'),
          mc('eaten_q', ['how_are_you', 'see_you', 'nice_meet']),
        ],
      },
    ],
  },
  {
    id: 'u5', num: 5, icon: '🏙️', color: '#ce82ff',
    title: 'Around town', desc: 'Places, directions and getting around Laos.',
    lessons: [
      {
        id: 'u5l1', title: 'Places', blurb: 'Home, school, temple, market and more.',
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
        id: 'u5l2', title: 'Directions', blurb: 'Left, right, straight ahead…',
        exercises: [
          mc('left', ['right', 'straight', 'turn'], 'en2lao'),
          typeEx('right'),
          mc('straight', ['left', 'under', 'outside']),
          listen('turn', ['walk', 'sit', 'stand']),
          tiles('ເລີ້ຢວສ້າຢ', ['ເລີ້ຢວ', 'ສ້າຢ'], 'Turn left', 'leow sai'),
          match(['left', 'right', 'on', 'under', 'here', 'there']),
        ],
      },
      {
        id: 'u5l3', title: 'Getting around', blurb: 'Cars, boats, planes and the mighty Mekong.',
        exercises: [
          mc('car', ['boat', 'bicycle', 'plane']),
          typeEx('bicycle'),
          mc('plane', ['car', 'boat', 'ticket'], 'en2lao'),
          listen('boat', ['car', 'road', 'mountain']),
          tiles('ໄປຕລາດ', ['ໄປ', 'ຕລາດ'], 'Go to the market', 'pai talat'),
          match(['car', 'boat', 'plane', 'airport', 'ticket', 'mekong']),
        ],
      },
    ],
  },
  {
    id: 'u6', num: 6, icon: '🗣️', color: '#00cd9c',
    title: 'Everyday verbs', desc: 'Go, come, speak, learn — the verbs of daily life.',
    lessons: [
      {
        id: 'u6l1', title: 'Action verbs', blurb: 'Move, talk, read and see.',
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
        id: 'u6l2', title: 'Daily routines', blurb: 'Learn, work, walk, sleep…',
        exercises: [
          mc('learn', ['work', 'sleep', 'eat'], 'lao2en'),
          typeEx('work'),
          mc('sit', ['stand', 'walk', 'sleep'], 'en2lao'),
          listen('walk', ['sit', 'stand', 'run']),
          typeEx('sleep'),
          tiles('ກຳລັງເຣີຢນພາສາລາວ', ['ກຳລັງ', 'ເຣີຢນ', 'ພາສາລາວ'], 'I am learning Lao', 'kamlang hian phasa Lao'),
        ],
      },
      {
        id: 'u6l3', title: 'Likes & feelings', blurb: 'What you love, want and understand.',
        exercises: [
          mc('like', ['love', 'want', 'no']),
          typeEx('love'),
          mc('want', ['like', 'have', 'can'], 'en2lao'),
          listen('understand', ['not_understand', 'think', 'see']),
          mc('not_understand', ['understand', 'like', 'want']),
          tiles('ຂ່ອຢຣັກເຈ້າ', ['ຂ່ອຢ', 'ຣັກ', 'ເຈ້າ'], 'I love you', 'khoi hak jao'),
          speak('love'),
        ],
      },
    ],
  },
  {
    id: 'u7', num: 7, icon: '🎨', color: '#ff86d0',
    title: 'Describing the world', desc: 'Adjectives, tastes and colors.',
    lessons: [
      {
        id: 'u7l1', title: 'Adjectives', blurb: 'Good, big, beautiful and more.',
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
        id: 'u7l2', title: 'Tastes & ingredients', blurb: 'Spicy, sweet, sour… and what you eat.',
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
        id: 'u7l3', title: 'Colors', blurb: 'The rainbow in Lao.',
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
    title: 'Time & conversation', desc: 'Days, hours and real small talk.',
    lessons: [
      {
        id: 'u8l1', title: 'Days & time', blurb: 'Today, tomorrow, now and o\'clock.',
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
        id: 'u8l2', title: 'Small talk', blurb: 'The phrases you will actually use.',
        exercises: [
          mc('speak_lao_q', ['name_q', 'how_much_this', 'where_toilet']),
          tiles('ພູດຊ້າໆໄດ້ບ່', ['ພູດ', 'ຊ້າໆ', 'ໄດ້', 'ບ່'], 'Please speak slowly', 'phut cha cha dai bo?'),
          mc('not_understand_p', ['speak_lao_q', 'fine', 'nice_meet'], 'en2lao'),
          listen('how_are_you', ['fine', 'eaten_q', 'name_q']),
          tiles('ກິນຂ້າວແລ້ວບ່', ['ກິນ', 'ຂ້າວ', 'ແລ້ວ', 'ບ່'], 'Have you eaten yet?', 'kin khao laew bo?'),
          mc('where_toilet', ['where', 'how_much', 'who']),
        ],
      },
      {
        id: 'u8l3', title: 'Putting it together', blurb: 'Build real Lao sentences. You have got this!',
        exercises: [
          tiles('ເປັນຄນລາວ', ['ເປັນ', 'ຄນລາວ'], 'I am Lao', 'pen khon Lao'),
          tiles('ພບກັນພຣຸ່ງນີ້', ['ພບ', 'ກັນ', 'ພຣຸ່ງນີ້'], 'See you tomorrow', 'phoep kan phuk ni'),
          mc('learning_lao', ['i_am_lao', 'speak_lao_q', 'see_you_tomorrow']),
          tiles('ພບກັນໃຫມ່', ['ພບ', 'ກັນ', 'ໃຫມ່'], 'See you again', 'phoep kan mai'),
          speak('nice_meet'),
          match(['hello', 'thanks', 'see_you', 'i_am_lao', 'learning_lao', 'speak_lao_q']),
        ],
      },
    ],
  },
  {
    id: 'u9', num: 9, icon: '🧳', color: '#8b5cf6',
    title: 'Travel & emergencies', desc: 'Get help, handle health issues and find your way around Laos.',
    lessons: [
      {
        id: 'u9l1', title: 'Getting help', blurb: 'Help, lost, police and phones.',
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
        id: 'u9l2', title: 'Health', blurb: 'When you or someone else feels sick.',
        exercises: [
          mc('sick', ['happy', 'tired', 'hungry']),
          typeEx('doctor'),
          mc('medicine', ['water', 'food', 'ticket'], 'en2lao'),
          listen('pharmacy', ['hospital', 'school', 'market']),
          tiles('ຂ່ອຢປ່ວຢ', ['ຂ່ອຢ', 'ປ່ວຢ'], 'I am sick', 'khoi puai'),
          match(['sick', 'doctor', 'medicine', 'pharmacy', 'hospital', 'water']),
        ],
      },
      {
        id: 'u9l3', title: 'On the road', blurb: 'Taxis, passports, rooms and asking the way.',
        exercises: [
          mc('taxi', ['boat', 'bicycle', 'plane']),
          typeEx('passport'),
          tiles('ຂອຫ້ອງຫນຶ່ງ', ['ຂອ', 'ຫ້ອງ', 'ຫນຶ່ງ'], 'I would like one room', 'khor hong neung'),
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
    title: 'Feelings & opinions', desc: 'Say what you think, feel and hope for.',
    lessons: [
      {
        id: 'u10l1', title: 'Opinions', blurb: '"I think that…" and what matters to you.',
        exercises: [
          mc('think_that', ['understand', 'want', 'like']),
          tiles('ຄິດວ່າອາຫາຣລາວແສ່ບ', ['ຄິດວ່າ', 'ອາຫາຣລາວ', 'ແສ່ບ'], 'I think Lao food is delicious', 'khit wa ahan Lao saep'),
          typeEx('possible'),
          mc('important', ['fun', 'easy', 'small'], 'en2lao'),
          listen('interesting', ['difficult', 'bored', 'afraid']),
        ],
      },
      {
        id: 'u10l2', title: 'Emotions', blurb: 'Afraid, angry, sad, hopeful…',
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
        id: 'u10l3', title: 'Putting it together', blurb: 'Real sentences about real feelings.',
        exercises: [
          tiles('ຖ້າພນຕກກັໄມ່ໄປ', ['ຖ້າ', 'ພນຕກ', 'ກັ', 'ໄມ່ໄປ'], "If it rains, we won't go", 'tha fon tok kho mai pai'),
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
    title: 'Work & plans', desc: 'Meetings, appointments, calls and making plans.',
    lessons: [
      {
        id: 'u11l1', title: 'At work', blurb: 'Bosses, meetings and being busy.',
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
        id: 'u11l2', title: 'Making plans', blurb: 'Plans, appointments and meeting at the café.',
        exercises: [
          mc('plan', ['food', 'money', 'house']),
          tiles('ວາງແຜນ', ['ວາງ', 'ແຜນ'], 'to plan', 'wang phaen'),
          mc('appointment', ['plan', 'late', 'busy'], 'en2lao'),
          listen('free_time', ['busy', 'sick', 'tired']),
          tiles('ພບກັນທີ່ຣ້ານກາ', ['ພບກັນ', 'ທີ່', 'ຣ້ານກາ'], 'See you at the café', 'phoep kan thi ran ka'),
        ],
      },
      {
        id: 'u11l3', title: 'Calls & messages', blurb: 'Phone calls, emails and messages.',
        exercises: [
          mc('call', ['write', 'read', 'eat']),
          typeEx('message'),
          listen('email', ['letter', 'phone', 'computer']),
          tiles('ໂທຣຫາຉັນໄດ້ບ່', ['ໂທຣ', 'ຫາ', 'ຉັນ', 'ໄດ້', 'ບ່'], 'Can you call me?', 'tho ha chan dai bo?'),
          match(['call', 'message', 'email', 'letter', 'phone', 'computer']),
        ],
      },
    ],
  },
  {
    id: 'u12', num: 12, icon: '💬', color: '#d946ef',
    title: 'Proverbs & wisdom', desc: 'Famous Lao sayings — learned in the situations where you hear them.',
    lessons: [
      {
        id: 'u12l1', title: 'Seize the moment', blurb: 'During Pi Mai the Mekong rises fast. Grandma laughs: "When the water rises, scoop quickly" — grab the good moment while it lasts!',
        exercises: [
          mc('pv_scoop', ['pv_slow', 'pv_effort', 'success']),
          tiles(V.pv_scoop.lao, ['ນ້ຳຂຶ້', 'ໃຫ້', 'ຣີບ', 'ຕັກ'], 'When the water rises, scoop quickly', 'nam khuen hai rep tak'),
          listen('pv_scoop', ['pv_slow', 'pv_effort', 'water_rises']),
          mc('water_rises', ['fish', 'rice', 'house']),
          typeEx('scoop', 'en2lao'),
          match(['pv_scoop', 'pv_slow', 'pv_effort', 'water_rises', 'scoop', 'effort']),
          speak('water_rises'),
        ],
      },
      {
        id: 'u12l2', title: 'Slow and steady', blurb: 'Grandpa sharpens his knife for a long time. "Slowly you get a beautiful blade," he smiles — patience makes quality.',
        exercises: [
          mc('pv_slow', ['pv_scoop', 'pv_effort', 'blade']),
          listen('pv_slow', ['pv_scoop', 'pv_effort', 'blade']),
          tiles(V.pv_slow.lao, ['ຊ້າໆ ', 'ໄດ້', 'ພຣ້າ', 'ເລ່ມ', 'ງາມ'], 'Slowly you get a beautiful blade', 'cha cha dai phra lem ngam'),
          mc('blade', ['fish', 'rice', 'water'], 'en2lao'),
          typeEx('slow'),
          match(['pv_slow', 'blade', 'slow', 'beautiful', 'effort', 'pv_effort']),
          speak('pv_slow'),
        ],
      },
      {
        id: 'u12l3', title: 'Effort & success', blurb: 'Exam tomorrow! Mum says: "Where there is effort, there is success." You have been studying hard — you have got this!',
        exercises: [
          mc('pv_effort', ['pv_scoop', 'pv_slow', 'success']),
          tiles(V.pv_effort.lao, ['ຄວາມພຢາຢາມອ', 'ຢູ່ທີ່ໄຫນ', ' ຄວາມສຳເຣັຈອ', 'ຢູ່ທີ່ນັ່ນ'], 'Where there is effort, there is success', 'khwam phayayam yu thi nai, khwam samret yu thi nan'),
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
    title: 'Everyday dialogues', desc: 'Short real-life conversations: the market, a Lao restaurant, meeting friends.',
    lessons: [
      {
        id: 'u13l1', title: 'At the market', blurb: 'You walk into a market in Vientiane. A vendor smiles: "How much is this?" Time to haggle politely — and ask for the bill at the end!',
        exercises: [
          mc('how_much_this', ['where_toilet', 'name_q', 'eaten_q']),
          tiles('ອັນນີ້ເທ່າໄຫຣ່', ['ອັນນີ້', 'ເທ່າໄຫຣ່'], 'How much is this?', 'an ni thao dai?'),
          listen('bill_please', ['how_much_this', 'eaten_q', 'speak_slow']),
          mc('cheap', ['expensive', 'big', 'small'], 'en2lao'),
          tiles('ເກັບເງິນໄດ້ບ່', ['ເກັບເງິນ', 'ໄດ້', 'ບ່'], 'The bill, please', 'kep ngoen dai bo?'),
          typeEx('buy'),
          match(['how_much_this', 'bill_please', 'cheap', 'expensive', 'buy', 'money']),
          speak('how_much_this'),
        ],
      },
      {
        id: 'u13l2', title: 'At a Lao restaurant', blurb: 'Lunch with friends at a riverside stall. "Have you eaten yet?" — the classic Lao greeting — then order noodles and say the food is delicious.',
        exercises: [
          mc('eaten_q', ['how_are_you', 'speak_lao_q', 'name_q']),
          listen('eaten_q', ['speak_slow', 'how_much_this', 'nice_meet']),
          tiles('ກິນຂ້າວແລ້ວບ່', ['ກິນ', 'ຂ້າວ', 'ແລ້ວ', 'ບ່'], 'Have you eaten yet?', 'kin khao laew bo?'),
          mc('tasty', ['spicy', 'sweet', 'sour'], 'en2lao'),
          tiles('ໄມ່ກິນເຜັດ', ['ໄມ່', 'ກິນ', 'ເຜັດ'], 'I don\'t eat spicy food', 'mai kin pet'),
          tiles('ຂ້າວເປີຢກເສ້ນຫນຶ່ງຊາມ', ['ຂ້າວເປີຢກເສ້ນ', 'ຫນຶ່ງ', 'ຊາມ'], 'One bowl of noodles, please', 'khao piak sen neung cham'),
          match(['eaten_q', 'tasty', 'spicy', 'eat', 'food', 'rice']),
          speak('eaten_q'),
        ],
      },
      {
        id: 'u13l3', title: 'Meeting friends', blurb: 'You meet a Lao friend at the café after class. "Do you speak Lao?" — small talk, making plans and saying goodbye until tomorrow.',
        exercises: [
          mc('speak_lao_q', ['name_q', 'how_are_you', 'where_toilet']),
          listen('speak_slow', ['speak_lao_q', 'fine', 'nice_meet']),
          tiles('ພູດຊ້າໆໄດ້ບ່', ['ພູດ', 'ຊ້າໆ', 'ໄດ້', 'ບ່'], 'Please speak slowly', 'phut cha cha dai bo?'),
          tiles('ພບກັນພຣຸ່ງນີ້', ['ພບ', 'ກັນ', 'ພຣຸ່ງນີ້'], 'See you tomorrow', 'phoep kan phuk ni'),
          mc('learning_lao', ['i_am_lao', 'speak_lao_q', 'see_you_tomorrow']),
          tiles('ກຳລັງເຣີຢນພາສາລາວ', ['ກຳລັງ', 'ເຣີຢນ', 'ພາສາລາວ'], 'I am learning Lao', 'kamlang hian phasa Lao'),
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
