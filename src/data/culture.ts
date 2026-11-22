import type { CultureStory } from './types.ts';

// HianLao culture guide — for the Lao diaspora and everyone who loves Laos.
// img keys reference original SVG illustrations in assets/img/.

export const CULTURE: CultureStory[] = [
  {
    id: "laos", icon: "🇱🇦", img: "illu/travelers.svg", title: "Laos at a glance", titleFr: "Le Laos en un coup d’œil",
    blocks: [
      { t: "p", html: "<b>Laos</b> (<span class=\"lao\">ປະເທດລາວ</span>, <i>Pa-thet Lao</i>) is a landlocked country in Southeast Asia, bordered by Thailand, Vietnam, Cambodia, Myanmar and China. Its people call it <b>\"the land of a million elephants\"</b> — the former kingdom of <b>Lan Xang</b> (<span class=\"lao\">ລ້ານຊ້າງ</span>).", htmlFr: "Le <b>Laos</b> (<span class=\"lao\">ປະເທດລາວ</span>, <i>Pa-thet Lao</i>) est un pays enclavé d’Asie du Sud-Est, bordé par la Thaïlande, le Vietnam, le Cambodge, le Myanmar et la Chine. Ses habitants l’appellent <b>« le pays du million d’éléphants »</b> — l’ancien royaume de <b>Lan Xang</b> (<span class=\"lao\">ລ້ານຊ້າງ</span>)." },
      { t: "p", html: "The <b>Mekong river</b> (<span class=\"lao\">ແມ່ນ້ຳຂອງ</span>, <i>mae nam khong</i>) is the country's lifeline and border. The capital is <b>Vientiane</b> (<span class=\"lao\">ວຽງຈັນ <i>(Vieng Chan)</i></span></span>), and the spiritual heart is <b>Luang Prabang</b> (<span class=\"lao\">ຫຼວງພະບາງ</span>), a UNESCO city of golden temples. Other wonders: the mysterious <b>Plain of Jars</b> and the <b>Pak Ou caves</b> full of Buddha statues.", htmlFr: "Le <b>Mékong</b> (<span class=\"lao\">ແມ່ນ້ຳຂອງ</span>, <i>mae nam khong</i>) est la colonne vertébrale et la frontière du pays. La capitale est <b>Vientiane</b> (<span class=\"lao\">ວຽງຈັນ</span>, <i>Vieng Chan</i>), et le cœur spirituel est <b>Luang Prabang</b> (<span class=\"lao\">ຫຼວງພະບາງ</span>), ville de temples dorés classée à l’UNESCO. Autres merveilles : la mystérieuse <b>Plaine des Jarres</b> et les <b>grottes de Pak Ou</b>, pleines de statues de Bouddha." },
      { t: "list", items: [
        "Official language: <b>Lao</b> (<span class=\"lao\">ພາສາລາວ</span>, <i>phasa Lao</i>)",
        "Script: the <b>Lao script</b>, closely related to Thai but distinct",
        "Religion: <b>Theravada Buddhism</b>, mixed with spirit beliefs (<i>phi</i>)",
        "Famous for: sticky rice, larb, papaya salad, gentle smiles — <span class=\"lao\">ສະບາຍດີ</span>!",
      ], itemsFr: [
        "Langue officielle : le <b>lao</b> (<span class=\"lao\">ພາສາລາວ</span>, <i>phasa Lao</i>)",
        "Écriture : l’<b>écriture lao</b>, proche de la thaïe mais bien distincte",
        "Religion : le <b>bouddhisme theravada</b>, mêlé de croyances aux esprits (<i>phi</i>)",
        "Célèbre pour : le riz gluant, le larb, la salade de papaye, les sourires doux — <span class=\"lao\">ສະບາຍດີ</span> !",
      ] },
    ],
  },
  {
    id: "festivals", icon: "🎆", img: "illu/celebration.svg", title: "Festivals & celebrations", titleFr: "Fêtes et célébrations",
    blocks: [
      { t: "p", html: "<b>Pi Mai</b> (<span class=\"lao\">ປີໃໝ່</span>) — the <b>Lao New Year</b> in mid-April — is the biggest festival. For three days, people splash water on each other for good luck, build sand stupas at temples and visit family. It is joy, water and <span class=\"lao\">ສະບາຍດີ</span> everywhere.", htmlFr: "<b>Pi Mai</b> (<span class=\"lao\">ປີໃໝ່</span>) — le <b>nouvel an lao</b> à la mi-avril — est la plus grande fête. Pendant trois jours, on s’arrose d’eau pour porter chance, on construit des stuvas de sable dans les temples et on rend visite à la famille. C’est la joie, l’eau et des <span class=\"lao\">ສະບາຍດີ</span> partout." },
      { t: "list", items: [
        "<b>Boun Ok Phansa</b> (<span class=\"lao\">ອອກພັນສາ <i>(ok phansa)</i></span></span>) — end of Buddhist Lent (Oct), celebrated with candle-lit boat processions on the Mekong.",
        "<b>Boun That Luang</b> (<span class=\"lao\">ບຸນທາດຫຼວງ <i>(boun That Luang)</i></span></span>) — the great golden stupa festival in Vientiane (Nov), with fireworks and fairs.",
        "<b>Boun Bang Fai</b> (<span class=\"lao\">ບຸນບັ້ງໄຟ</span>) — the rocket festival at the start of the rainy season: giant homemade rockets are launched to wake the rain gods.",
        "<b>Visoun / Lao New Year in the diaspora</b>: Lao communities in the US, France, Australia and Canada organize Pi Mai celebrations every April — look for one near you!",
      ], itemsFr: [
        "<b>Boun Ok Phansa</b> (<span class=\"lao\">ອອກພັນສາ</span>, <i>ok phansa</i>) — fin du carême bouddhique (octobre), célébrée avec des processions de bateaux illuminés sur le Mékong.",
        "<b>Boun That Luang</b> (<span class=\"lao\">ບຸນທາດຫຼວງ</span>, <i>boun That Luang</i>) — la grande fête du stupa doré à Vientiane (novembre), avec feux d’artifice et foires.",
        "<b>Boun Bang Fai</b> (<span class=\"lao\">ບຸນບັ້ງໄຟ</span>) — la fête des fusées au début de la saison des pluies : on lance d’immenses fusées artisanales pour réveiller les dieux de la pluie.",
        "<b>Visoun / le nouvel an lao en diaspora</b> : les communautés lao des États-Unis, de France, d’Australie et du Canada organisent des célébrations de Pi Mai chaque avril — cherchez-en une près de chez vous !",
      ] },
    ],
  },
  {
    id: "food", icon: "🍛", img: "illu/eating-together.svg", title: "Food & meals", titleFr: "Manger à la lao",
    blocks: [
      { t: "p", html: "Lao meals are built around <b>sticky rice</b> (<span class=\"lao\">ເຂົ້າໜຽວ</span>, <i>khao niao</i>) — eaten with the hands, rolled into small balls and dipped into dishes. The national dish is <b>larb</b> (<span class=\"lao\">ລາບ</span>): a fresh minced-meat salad with lime, fish sauce, herbs and toasted rice powder. <b>Tam mak hoong</b> (<span class=\"lao\">ຕຳໝາກຮຸ່ງ</span>) is the fiery green papaya salad.", htmlFr: "Les repas lao s’organisent autour du <b>riz gluant</b> (<span class=\"lao\">ເຂົ້າໜຽວ</span>, <i>khao niao</i>) — mangé à la main, roulé en petites boulettes et trempé dans les plats. Le plat national est le <b>larb</b> (<span class=\"lao\">ລາບ</span>) : une salade de viande hachée fraîche, au citron vert, sauce de poisson, herbes et riz grillé pilé. Le <b>tam mak hoong</b> (<span class=\"lao\">ຕຳໝາກຮຸ່ງ</span>) est la salade de papaye verte, bien piquante." },
      { t: "list", items: [
        "<b>Khao piak sen</b> (<span class=\"lao\">ເຂົ້າປຽກເສັ້ນ</span>) — comforting Lao noodle soup.",
        "<b>Mok pa</b> (<span class=\"lao\">ມົກປາ</span>) — fish steamed with herbs in a banana leaf.",
        "<b>Khao jii</b> (<span class=\"lao\">ເຂົ້າຈີ່</span>) — a crusty baguette sandwich: a delicious leftover of the French colonial era.",
        "<b>Sai oua</b> (<span class=\"lao\">ໄສ້ອົ່ວ</span>) — herbal Lao sausage from Luang Prabang.",
        "Ask <span class=\"lao\">ກິນເຂົ້າແລ້ວບໍ</span> (<i>kin khao laew bo?</i>) — \"have you eaten?\" — it's the warmest way to greet someone.",
      ], itemsFr: [
        "<b>Khao piak sen</b> (<span class=\"lao\">ເຂົ້າປຽກເສັ້ນ</span>) — la soupe de nouilles lao réconfortante.",
        "<b>Mok pa</b> (<span class=\"lao\">ມົກປາ</span>) — du poisson cuit à la vapeur aux herbes, enveloppé dans une feuille de bananier.",
        "<b>Khao jii</b> (<span class=\"lao\">ເຂົ້າຈີ່</span>) — un sandwich-baguette croustillant : un délicieux héritage de l’époque coloniale française.",
        "<b>Sai oua</b> (<span class=\"lao\">ໄສ້ອົ່ວ</span>) — la saucisse lao aux herbes de Luang Prabang.",
        "Demande <span class=\"lao\">ກິນເຂົ້າແລ້ວບໍ</span> (<i>kin khao laew bo?</i>) — « avez-vous déjà mangé ? » — c’est la salutation la plus chaleureuse qui soit.",
      ] },
    ],
  },
  {
    id: "etiquette", icon: "🙏", img: "illu/hello.svg", title: "Etiquette & daily life", titleFr: "Politesse et vie quotidienne",
    blocks: [
      { t: "p", html: "The Lao greeting is the <b>nop</b> — hands pressed together like a prayer: raise them to your chest for equals, higher for elders, monks and Buddha images. Say <span class=\"lao\">ສະບາຍດີ</span> <i>(sa-bai-dii)</i> with a smile.", htmlFr: "La salutation lao est le <b>nop</b> — mains jointes comme pour une prière : à hauteur de poitrine entre égaux, plus haut pour les aînés, les moines et les images de Bouddha. Dis <span class=\"lao\">ສະບາຍດີ</span> <i>(sa-bai-dii)</i> avec le sourire." },
      { t: "list", items: [
        "The <b>head is sacred</b>: never touch anyone's head (even a child's, lovingly).",
        "The <b>feet are low</b>: never point your feet at people or Buddha images; don't step over anyone sitting.",
        "Take off your <b>shoes</b> before entering a home or a temple.",
        "Dress modestly at temples: shoulders and knees covered.",
        "Buddha images and monks are deeply respected — never pose silly with them.",
        "In the morning you may see monks walking barefoot collecting alms (<b>tak bat</b>, <span class=\"lao\">ຕັກບາດ</span>) — a beautiful tradition to witness respectfully.",
      ], itemsFr: [
        "La <b>tête est sacrée</b> : ne touche jamais la tête de qui que ce soit (même celle d’un enfant, même avec tendresse).",
        "Les <b>pieds sont bas</b> : ne pointe jamais tes pieds vers quelqu’un ou vers une image de Bouddha ; n’enjambe personne assis.",
        "Retire tes <b>chaussures</b> avant d’entrer dans une maison ou un temple.",
        "Habille-toi pudiquement dans les temples : épaules et genoux couverts.",
        "Les images de Bouddha et les moines inspirent un profond respect — ne prends jamais de poses déplacées avec eux.",
        "Le matin, tu verras peut-être les moines marcher pieds nus pour recevoir les offrandes (<b>tak bat</b>, <span class=\"lao\">ຕັກບາດ</span>) — une belle tradition à observer avec respect.",
      ] },
    ],
  },
  {
    id: "language", icon: "🗣️", img: "illu/chatting.svg", title: "The Lao language", titleFr: "La langue lao",
    blocks: [
      { t: "p", html: "Lao belongs to the <b>Tai language family</b>, and spoken Lao is quite close to Thai — but the scripts, tones and many words are different, and Lao has its own charm. The standard is the <b>Vientiane dialect</b>; other dialects exist in the north (Luang Prabang) and south (Champasak), plus Lao communities in Thailand (Isan).", htmlFr: "Le lao appartient à la <b>famille des langues tai</b>, et le lao parlé est proche du thaï — mais les écritures, les tons et bien des mots diffèrent, et le lao a son charme propre. La norme est le <b>dialecte de Vientiane</b> ; d’autres dialectes existent au nord (Luang Prabang) et au sud (Champasak), sans oublier les communautés lao de Thaïlande (Isan)." },
      { t: "p", html: "Lao is <b>analytic</b>: no verb conjugations, no plural forms, no genders. Grammar is mostly word order and small particles. Once you learn the tones and the script, everything clicks — — <span class=\"lao\">ຮຽນ</span> <i>(hian, \"to learn\")</i> is exactly what HianLao is for!", htmlFr: "Le lao est une langue <b>analytique</b> : pas de conjugaisons, pas de pluriels, pas de genres. La grammaire tient à l’ordre des mots et à quelques petites particules. Quand tu maîtrises les tons et l’écriture, tout devient limpide — <span class=\"lao\">ຮຽນ</span> <i>(hian, « apprendre »)</i> est exactement la vocation de HianLao !" },
      { t: "ex", lao: "ຮຽນພາສາລາວ", romanization: "hian pha-sa Lao", en: "learn the Lao language — HianLao!", enFr: "apprends la langue lao — HianLao !" },
    ],
  },
  {
    id: "diaspora", icon: "🌏", img: "illu/connected-world.svg", title: "The Lao diaspora", titleFr: "La diaspora lao",
    blocks: [
      { t: "p", html: "After the fall of the Kingdom of Laos in 1975, hundreds of thousands of Lao fled as refugees. Today there are vibrant Lao communities in the <b>United States</b> (California, Minnesota, Texas…), <b>France</b> (Paris, Lyon…), <b>Australia</b>, <b>Canada</b> and beyond.", htmlFr: "Après la chute du royaume du Laos en 1975, des centaines de milliers de Lao ont fui comme réfugiés. Aujourd’hui, des communautés lao dynamiques vivent aux <b>États-Unis</b> (Californie, Minnesota, Texas…), en <b>France</b> (Paris, Lyon…), en <b>Australie</b>, au <b>Canada</b> et ailleurs." },
      { t: "p", html: "For second and third generations, Lao is often the <b>heritage language</b>: spoken at home with grandparents, alive at temple festivals and Pi Mai celebrations. HianLao exists so that language stays free and open — no subscriptions, no paywalls — because <b>every Lao child should be able to learn the language of their family</b>: <span class=\"lao\">ພາສາຂອງເຮົາ</span> <i>(pha-sa khong hao)</i>, \"our language\".", htmlFr: "Pour les deuxième et troisième générations, le lao est souvent une <b>langue d’héritage</b> : parlée à la maison avec les grands-parents, vivante dans les fêtes de temple et les célébrations de Pi Mai. HianLao existe pour que cette langue reste libre et ouverte — sans abonnement, sans paywall — parce que <b>chaque enfant lao devrait pouvoir apprendre la langue de sa famille</b> : <span class=\"lao\">ພາສາຂອງເຮົາ</span> <i>(pha-sa khong hao)</i>, « notre langue »." },
      { t: "note", html: "Know a Lao community event, a good Lao teacher or a resource? Open an issue on GitHub and help us grow the community links!", htmlFr: "Tu connais un événement de la communauté lao, un bon professeur de lao ou une ressource utile ? Ouvre une issue sur GitHub et aide-nous à enrichir les liens communautaires !" },
    ],
  },
  {
    id: "proverbs", icon: "💬", img: "illu/book-reading.svg", title: "Lao proverbs & sayings", titleFr: "Proverbes et dictons lao",
    blocks: [
      { t: "p", html: "Lao wisdom in a few words — these sayings are used in everyday life and are a lovely way to sound like a local:", htmlFr: "La sagesse lao en quelques mots — ces dictons s’emploient dans la vie de tous les jours et sont une jolie façon de parler comme un local :" },
      { t: "list", items: [
        "<span class=\"lao\">ນ້ຳຂຶ້ນ ໃຫ້ລີບຕັກ</span> <i>(nam khen hai lip tak)</i> — \"When the water rises, scoop quickly\" → <b>seize the opportunity!</b>",
        "<span class=\"lao\">ຊ້າໆ ໄດ້ແຜ່ນເລ່ືອມງາມ</span> <i>(chaa chaa dai phaen lueam ngam)</i> — \"Slowly you get a beautiful blade\" → <b>slow and steady wins the race</b>.",
        "<span class=\"lao\">ຄວາມພະຍາຍາມຢູ່ທີ່ໃດ ຄວາມສຳເລັດຢູ່ທີ່ນັ້ນ</span> <i>(khwam pha-nya-nyam yuu thi dai, khwam sam-lat yuu thi nan)</i> — \"Where there is effort, there is success.\" Perfect for language learning!",
      ], itemsFr: [
        "<span class=\"lao\">ນ້ຳຂຶ້ນ ໃຫ້ລີບຕັກ</span> <i>(nam khen hai lip tak)</i> — « quand l’eau monte, écoper vite » → <b>saisis l’occasion !</b>",
        "<span class=\"lao\">ຊ້າໆ ໄດ້ແຜ່ນເລ່ືອມງາມ</span> <i>(chaa chaa dai phaen lueam ngam)</i> — « vas-y doucement et tu auras une belle lame » → <b>la patience donne la qualité</b>.",
        "<span class=\"lao\">ຄວາມພະຍາຍາມຢູ່ທີ່ໃດ ຄວາມສຳເລັດຢູ່ທີ່ນັ້ນ</span> <i>(khwam pha-nya-nyam yuu thi dai, khwam sam-lat yuu thi nan)</i> — « là où il y a l’effort, il y a la réussite ». Parfait pour apprendre une langue !",
      ] },
      { t: "note", html: "Know a beautiful Lao proverb? Add it in <code>assets/js/data/culture.js</code> and send a pull request! Practice these three in <a href='/learn'>Unit 12 on the Learn page</a>. 🇱🇦", htmlFr: "Tu connais un beau proverbe lao ? Ajoute-le dans <code>assets/js/data/culture.js</code> et envoie une pull request ! Entraîne-toi avec ces trois proverbes dans <a href='/learn'>l’unité 12 de la page Apprendre</a>. 🇱🇦" },
    ],
  },
];
