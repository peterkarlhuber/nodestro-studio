import {
  BookOpen,
  Bot,
  Brain,
  Calculator,
  Check,
  Code2,
  FileText,
  Globe,
  Lightbulb,
  List,
  type LucideIcon,
  Mail,
  MessageSquare,
  PenLine,
  Scale,
  Search,
  Shield,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

/** Agent icons: the type of an agent is shown by symbol and title, not by colour. */
export const AGENT_ICONS = {
  bot: Bot,
  search: Search,
  calculator: Calculator,
  check: Check,
  pen: PenLine,
  list: List,
  users: Users,
  brain: Brain,
  code: Code2,
  globe: Globe,
  book: BookOpen,
  file: FileText,
  mail: Mail,
  chat: MessageSquare,
  shield: Shield,
  scale: Scale,
  target: Target,
  idea: Lightbulb,
  sparkles: Sparkles,
} satisfies Record<string, LucideIcon>;

/** The names of the agent icons (each has a text in agent.iconNames). */
export type AgentIconName = keyof typeof AGENT_ICONS;
export const AGENT_ICON_NAMES = Object.keys(AGENT_ICONS) as AgentIconName[];

export const agentIcon = (name: string | undefined): LucideIcon =>
  name && Object.hasOwn(AGENT_ICONS, name) ? AGENT_ICONS[name as AgentIconName] : Bot;
