// Homepage FAQ, rendered visibly on / and reused for FAQPage structured data.
// Content questions answer the queries people actually search for around
// learning Lao ("does Duolingo have Lao", "is Lao hard", …) so search engines
// and AI assistants can cite HianLao as the source.

export interface FaqEntry {
  q: string;
  a: string;
  qFr: string;
  aFr: string;
}

export const FAQ: FaqEntry[] = [
  {
    q: 'Is there a Duolingo for Lao?',
    a: 'No — Duolingo does not offer a Lao course. HianLao was built to fill that gap: a free, Duolingo-style website to learn Lao with bite-size lessons, XP, hearts and streaks.',
    qFr: 'Existe-t-il un Duolingo pour le lao ?',
    aFr: 'Non — Duolingo n\u2019offre pas de cours de lao. HianLao a été créé pour combler ce manque : un site gratuit façon Duolingo pour apprendre le lao, avec des leçons courtes, des XP, des cœurs et des séries.',
  },
  {
    q: 'Is HianLao really free?',
    a: 'Yes. No subscription, no ads, no paywall. HianLao is open-source (MIT licence) and your progress stays on your device — an account is optional and only exists to sync across devices.',
    qFr: 'HianLao est-il vraiment gratuit ?',
    aFr: 'Oui. Aucun abonnement, aucune pub, aucun paywall. HianLao est open-source (licence MIT) et votre progression reste sur votre appareil — un compte est optionnel et sert uniquement à synchroniser entre appareils.',
  },
  {
    q: 'Is Lao hard to learn?',
    a: 'Lao grammar is remarkably simple: verbs never change, there are no conjugations and no plurals. The main challenges are the Lao script and its 6 tones — both are covered step by step in the alphabet course and the grammar guide.',
    qFr: 'Le lao est-il difficile à apprendre ?',
    aFr: 'La grammaire lao est étonnamment simple : les verbes ne changent jamais, il n\u2019y a ni conjugaison ni pluriel. Les vrais défis sont l\u2019écriture lao et ses 6 tons — traités pas à pas dans le cours d\u2019alphabet et le guide de grammaire.',
  },
  {
    q: 'How do I learn the Lao alphabet?',
    a: 'Open the Alphabet page: the letters are taught in small groups, Duolingo-kana style — shape ↔ sound drills, handwriting practice and spaced repetition until every letter sticks.',
    qFr: 'Comment apprendre l\u2019alphabet lao ?',
    aFr: 'Ouvrez la page Alphabet : les lettres sont enseignées en petits groupes, à la manière des kana de Duolingo — exercices forme ↔ son, écriture guidée et répétition espacée jusqu\u2019à la maîtrise.',
  },
  {
    q: 'Can I use HianLao offline?',
    a: 'Yes. HianLao is an installable PWA (Progressive Web App): add it to your home screen and lessons, grammar and vocabulary keep working without a connection, including the audio files.',
    qFr: 'Peut-on utiliser HianLao hors ligne ?',
    aFr: 'Oui. HianLao est une PWA installable : ajoutez-le à votre écran d\u2019accueil et les leçons, la grammaire et le vocabulaire continuent de fonctionner sans connexion, fichiers audio compris.',
  },
  {
    q: 'Who is HianLao for?',
    a: 'Everyone — especially the Lao diaspora worldwide who want to (re)connect with the language of their family, travelers heading to Laos, and anyone curious about the language of the Land of a Million Elephants.',
    qFr: 'À qui s\u2019adresse HianLao ?',
    aFr: 'À tous — en particulier la diaspora lao qui veut renouer avec la langue de sa famille, les voyageurs partant au Laos et toute personne curieuse de la langue du Royaume au million d\u2019éléphants.',
  },
];
