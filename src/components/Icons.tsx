// Central registry mapping content ids (units, culture sections, vocab
// categories, achievements) to Lucide icons, so no raw emoji remains in the
// UI chrome. Data files keep plain ids; the visual layer lives here.
import {
  BadgeCheck,
  BookOpen,
  BookOpenText,
  Brain,
  CalendarCheck,
  CalendarDays,
  CaseSensitive,
  Clock,
  Coins,
  Flag,
  Flame,
  Footprints,
  Gem,
  Globe,
  GraduationCap,
  Hand,
  Hash,
  HeartHandshake,
  Home,
  Landmark,
  Languages,
  Map,
  MapPin,
  MessageCircle,
  MessagesSquare,
  Palette,
  PartyPopper,
  PenLine,
  Quote,
  RotateCcw,
  Smile,
  Star,
  Target,
  Trophy,
  UserRound,
  Users,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from 'lucide-react';

const UNIT_ICONS: Record<string, LucideIcon> = {
  u1: Hand,
  u2: Users,
  u3: Hash,
  u4: UtensilsCrossed,
  u5: Map,
  u6: MessagesSquare,
  u7: Palette,
  u8: Clock,
  u9: PenLine,
  u10: Coins,
  u11: MapPin,
  u12: Quote,
  u13: MessageCircle,
};

const CULTURE_ICONS: Record<string, LucideIcon> = {
  laos: Flag,
  festivals: PartyPopper,
  food: UtensilsCrossed,
  etiquette: HeartHandshake,
  language: Languages,
  diaspora: Globe,
  proverbs: Quote,
};

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  greetings: Hand,
  basics: Star,
  numbers: Hash,
  family: Users,
  verbs: Zap,
  adjectives: Palette,
  food: UtensilsCrossed,
  phrases: MessageCircle,
  places: MapPin,
  time: Clock,
  directions: Map,
  colors: Palette,
  travel: Globe,
  emotions: Smile,
  work: BookOpenText,
  proverbs: Quote,
};

const BADGE_ICONS: Record<string, LucideIcon> = {
  'first-step': Footprints,
  'hello-lao': Hand,
  xp50: Zap,
  xp200: Flame,
  xp500: Gem,
  xp1000: Trophy,
  streak3: CalendarDays,
  streak7: CalendarCheck,
  streak30: Star,
  lessons10: BookOpen,
  'lessons-all': GraduationCap,
};

export const NAV_ICONS: Record<string, LucideIcon> = {
  home: Home,
  learn: Brain,
  alphabet: CaseSensitive,
  review: RotateCcw,
  words: BookOpenText,
  grammar: GraduationCap,
  culture: Landmark,
};

export function UnitIcon({ id, ...props }: { id: string } & React.ComponentProps<LucideIcon>) {
  const Icon = UNIT_ICONS[id] ?? Target;
  return <Icon {...props} />;
}

export function CultureIcon({ id, ...props }: { id: string } & React.ComponentProps<LucideIcon>) {
  const Icon = CULTURE_ICONS[id] ?? Globe;
  return <Icon {...props} />;
}

export function CategoryIcon({ id, ...props }: { id: string } & React.ComponentProps<LucideIcon>) {
  const Icon = CATEGORY_ICON_MAP[id] ?? Star;
  return <Icon {...props} />;
}

export function BadgeIcon({ id, ...props }: { id: string } & React.ComponentProps<LucideIcon>) {
  const Icon = BADGE_ICONS[id] ?? BadgeCheck;
  return <Icon {...props} />;
}
