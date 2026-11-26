import {
  Bot, Box, Brain, Braces, Building2, CircleDollarSign, ClipboardCheck, Cpu, Database, FileText, Files, Filter, Gauge, Globe,
  Hammer, Layers, ListOrdered, MessageSquare, Network, Scale, ScanSearch, Search, Server, Shield, ShieldAlert, Shuffle, Sparkles,
  Target, Timer, User, Wrench, Zap, Skull, Binary, Scissors, Repeat, HardDrive, GraduationCap, Route, BookOpen, Ticket, Hash, Users, TriangleAlert, ListTodo, Smartphone, Laptop,
  type LucideIcon,
} from 'lucide-react';

const map: Record<string, LucideIcon> = {
  bot: Bot, box: Box, brain: Brain, braces: Braces, building: Building2, money: CircleDollarSign, check: ClipboardCheck, cpu: Cpu,
  db: Database, doc: FileText, docs: Files, filter: Filter, gauge: Gauge, globe: Globe, hammer: Hammer, layers: Layers,
  rank: ListOrdered, chat: MessageSquare, network: Network, scale: Scale, scan: ScanSearch, search: Search, server: Server,
  shield: Shield, alert: ShieldAlert, shuffle: Shuffle, spark: Sparkles, target: Target, timer: Timer, user: User, wrench: Wrench,
  zap: Zap, skull: Skull, binary: Binary, scissors: Scissors, loop: Repeat, disk: HardDrive, grad: GraduationCap, route: Route,
  book: BookOpen, ticket: Ticket, hash: Hash, users: Users, warn: TriangleAlert, queue: ListTodo, phone: Smartphone, laptop: Laptop,
};

export function Icon({ name, size = 16 }: { name: string; size?: number }) {
  const C = map[name] ?? Box;
  return <C size={size} strokeWidth={1.9} aria-hidden />;
}
