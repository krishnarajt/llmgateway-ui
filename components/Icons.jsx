"use client";

// ═══════════════════════════════════════════════════════════════
// ICONS — Using lucide-react for crisp, consistent icons
// ═══════════════════════════════════════════════════════════════
import {
  Home,
  Users,
  Key,
  Server,
  Layers,
  Lock,
  Shield,
  MessageSquare,
  Settings,
  LogOut,
  Plus,
  Trash2,
  Check,
  X,
  Eye,
  Copy,
  Send,
  RefreshCw,
  GitBranch,
  ArrowUp,
  ArrowDown,
  Save,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

// Map icon names to lucide components for easy lookup
export const IconMap = {
  dashboard: Home,
  users: Users,
  key: Key,
  server: Server,
  model: Layers,
  lock: Lock,
  shield: Shield,
  chat: MessageSquare,
  settings: Settings,
  logout: LogOut,
  plus: Plus,
  trash: Trash2,
  check: Check,
  x: X,
  eye: Eye,
  copy: Copy,
  send: Send,
  refresh: RefreshCw,
  route: GitBranch,
  up: ArrowUp,
  down: ArrowDown,
  save: Save,
  toggleOff: ToggleLeft,
  toggleOn: ToggleRight,
};

/**
 * Icon component wrapper — renders a lucide-react icon by name
 * @param {string} name - Icon name from IconMap
 * @param {number} size - Icon size in px
 * @param {string} className - Additional Tailwind classes
 */
export default function Icon({ name, size = 18, className = "" }) {
  const LucideIcon = IconMap[name];
  if (!LucideIcon) return null;
  return <LucideIcon size={size} className={className} />;
}
