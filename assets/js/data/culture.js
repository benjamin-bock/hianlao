// HianLao culture guide — for the Lao diaspora and everyone who loves Laos.
// img keys reference original SVG illustrations in assets/img/.

export const CULTURE = [
  {
    id: 'laos', icon: '🇱🇦', img: 'stupa.svg', title: 'Laos at a glance',
    blocks: [
      { t: 'p', html: '<b>Laos</b> (<span class="lao">ປຣະເທສລາວ</span>, <i>Pathet Lao</i>) is a landlocked country in Southeast Asia, bordered by Thailand, Vietnam, Cambodia, Myanmar and China. Its people call it <b>"the land of a million elephants"</b> — the former kingdom of <b>Lan Xang</b> (<span class="lao">ລ້ານຊ້າງ</span>).' },
      { t: 'p', html: 'The <b>Mekong river</b> (<span class="lao">ແມ່ນ້ຳໂຂງ</span>, <i>mae nam khong</i>) is the country\'s lifeline and border. The capital is <b>Vientiane</b> (<span class="lao">ເວີຢງຈັນທນ໌</span>), and the spiritual heart is <b>Luang Prabang</b> (<span class="lao">ຫລວງພຣະບາງ</span>), a UNESCO city of golden temples. Other wonders: the mysterious <b>Plain of Jars</b> and the <b>Pak Ou caves</b> full of Buddha statues.' },
      { t: 'list', items: [
        'Official language: <b>Lao</b> (<span class="lao">ພາສາລາວ</span>, <i>phasa Lao</i>)',
        'Script: the <b>Lao script</b>, closely related to Thai but distinct',
        'Religion: <b>Theravada Buddhism</b>, mixed with spirit beliefs (<i>phi</i>)',
        'Famous for: sticky rice, larb, papaya salad, gentle smiles — <span class="lao">ສະບາຍດີ</span>!',
      ] },
    ],
  },
  {
    id: 'festivals', icon: '🎆', img: 'festival.svg', title: 'Festivals & celebrations',
    blocks: [
      { t: 'p', html: '<b>Pi Mai</b> (<span class="lao">ປີໃໝ່</span>) — the <b>Lao New Year</b> in mid-April — is the biggest festival. For three days, people Splash water on each other for good luck, build sand stupas at temples and visit family. It is joy, water and <span class="lao">ສະບາຍດີ</span> everywhere.' },
      { t: 'list', items: [
        '<b>Boun Ok Phansa</b> (<span class="lao">ອອກພຣຣສາ</span>) — end of Buddhist Lent (Oct), celebrated with candle-lit boat processions on the Mekong.',
        '<b>Boun That Luang</b> (<span class="lao">ງານຘາຕຸຫລວງ</span>) — the great golden stupa festival in Vientiane (Nov), with fireworks and fairs.',
        '<b>Boun Bang Fai</b> (<span class="lao">ບຸຍບັ້ງໄຟ</span>) — the rocket festival at the start of the rainy season: giant homemade rockets are launched to wake the rain gods.',
        '<b>Visoun / Lao New Year in the diaspora</b>: Lao communities in the US, France, Australia and Canada organize Pi Mai celebrations every April — look for one near you!',
      ] },
    ],
  },
  {
    id: 'food', icon: '🍛', img: 'food.svg', title: 'Food & meals',
    blocks: [
      { t: 'p', html: 'Lao meals are built around <b>sticky rice</b> (<span class="lao">ຂ້າວເຫນີຢວ</span>, <i>khao niao</i>) — eaten with the hands, rolled into small balls and dipped into dishes. The national dish is <b>larb</b> (<span class="lao">ລາບ</span>): a fresh minced-meat salad with lime, fish sauce, herbs and toasted rice powder. <b>Tam mak hoong</b> (<span class="lao">ຕຳຫມາກຫຸ່ງ</span>) is the fiery green papaya salad.' },
      { t: 'list', items: [
        '<b>Khao piak sen</b> (<span class="lao">ຂ້າວເປີຢກເສ້ນ</span>) — comforting Lao noodle soup.',
        '<b>Mok pa</b> (<span class="lao">ຫມກປລາ</span>) — fish steamed with herbs in a banana leaf.',
        '<b>Khao jii</b> (<span class="lao">ຂ້າວຈີ່</span>) — a crusty baguette sandwich: a delicious leftover of the French colonial era.',
        '<b>Sai oua</b> (<span class="lao">ໄສ້ອັ່ວ</span>) — herbal Lao sausage from Luang Prabang.',
        'Ask <span class="lao">ກິນຂ້າວແລ້ວບ່</span> (<i>kin khao laew bo?</i>) — "have you eaten?" — it\'s the warmest way to greet someone.',
      ] },
    ],
  },
  {
    id: 'etiquette', icon: '🙏', img: 'greeting.svg', title: 'Etiquette & daily life',
    blocks: [
      { t: 'p', html: 'The Lao greeting is the <b>nop</b> — hands pressed together like a prayer: raise them to your chest for equals, higher for elders, monks and Buddha images. Say <span class="lao">ສະບາຍດີ</span> <i>(sa-bai-dii)</i> with a smile.' },
      { t: 'list', items: [
        'The <b>head is sacred</b>: never touch anyone\'s head (even a child\'s, lovingly).',
        'The <b>feet are low</b>: never point your feet at people or Buddha images; don\'t step over anyone sitting.',
        'Take off your <b>shoes</b> before entering a home or a temple.',
        'Dress modestly at temples: shoulders and knees covered.',
        'Buddha images and monks are deeply respected — never pose silly with them.',
        'In the morning you may see monks walking barefoot collecting alms (<b>tak bat</b>, <span class="lao">ຕັກບາຕຣ</span>) — a beautiful tradition to witness respectfully.',
      ] },
    ],
  },
  {
    id: 'language', icon: '🗣️', img: 'script.svg', title: 'The Lao language',
    blocks: [
      { t: 'p', html: 'Lao belongs to the <b>Tai language family</b>, and spoken Lao is quite close to Thai — but the scripts, tones and many words are different, and Lao has its own charm. The standard is the <b>Vientiane dialect</b>; other dialects exist in the north (Luang Prabang) and south (Champasak), plus Lao communities in Thailand (Isan).' },
      { t: 'p', html: 'Lao is <b>analytic</b>: no verb conjugations, no plural forms, no genders. Grammar is mostly word order and small particles. Once you learn the tones and the script, everything clicks — and <span class="lao">hian</span> (<i>learn</i>) is exactly what HianLao is for!' },
      { t: 'ex', lao: 'ເຣີຢນພາສາລາວ', tr: 'hian phasa Lao', en: 'learn the Lao language — HianLao!' },
    ],
  },
  {
    id: 'diaspora', icon: '🌏', img: 'elephant.svg', title: 'The Lao diaspora',
    blocks: [
      { t: 'p', html: 'After the fall of the Kingdom of Laos in 1975, hundreds of thousands of Lao fled as refugees. Today there are vibrant Lao communities in the <b>United States</b> (California, Minnesota, Texas…), <b>France</b> (Paris, Lyon…), <b>Australia</b>, <b>Canada</b> and beyond.' },
      { t: 'p', html: 'For second and third generations, Lao is often the <b>heritage language</b>: spoken at home with grandparents, alive at temple festivals and Pi Mai celebrations. HianLao exists so that language stays free and open — no subscriptions, no paywalls — because <b>every Lao child should be able to learn the language of their family</b>: <span class="lao">ພາສາຂອງເຣາ</span> <i>(phasa khong rao)</i>, "our language".' },
      { t: 'note', html: 'Know a Lao community event, a good Lao teacher or a resource? Open an issue on GitHub and help us grow the community links!' },
    ],
  },
  {
    id: 'proverbs', icon: '💬', img: 'script.svg', title: 'Lao proverbs & sayings',
    blocks: [
      { t: 'p', html: 'Lao wisdom in a few words — these sayings are used in everyday life and are a lovely way to sound like a local:' },
      { t: 'list', items: [
        '<span class="lao">ນ້ຳຂຶ້ໃຫ້ຣີບຕັກ</span> <i>(nam khuen hai rep tak)</i> — "When the water rises, scoop quickly" → <b>seize the opportunity!</b>',
        '<span class="lao">ຊ້າໆ ໄດ້ພຣ້າເລ່ມງາມ</span> <i>(cha cha dai phra lem ngam)</i> — "Slowly you get a beautiful blade" → <b>slow and steady wins the race</b>.',
        '<span class="lao">ຄວາມພຢາຢາມອຢູ່ທີ່ໄຫນ ຄວາມສຳເຣັຈອຢູ່ທີ່ນັ່ນ</span> <i>(khwam phayayam yu thi nai, khwam samret yu thi nan)</i> — "Where there is effort, there is success." Perfect for language learning!',
      ] },
      { t: 'note', html: 'Know a beautiful Lao proverb? Add it in <code>assets/js/data/culture.js</code> and send a pull request! Practice these three in <a href="learn.html">Unit 12 on the Learn page</a>. 🇱🇦' },
    ],
  },
];
