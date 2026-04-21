import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  FileText,
  BarChart3,
  Brain,
  Clock,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/upload', label: 'Upload & Grade', icon: Upload },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/quality', label: 'Quality', icon: BarChart3 },
  { to: '/ai', label: 'AI Insights', icon: Brain },
  { to: '/history', label: 'History', icon: Clock },
] as const;

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <ClipboardList className="h-5 w-5 text-blue-500" />
        <span className="text-sm font-semibold tracking-tight text-zinc-100">
          Menu Grading Tool
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 pt-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'border-l-2 border-blue-500 bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-zinc-800 px-5 py-4">
        <p className="truncate text-xs text-zinc-500">user@squareup.com</p>
      </div>
    </aside>
  );
}
