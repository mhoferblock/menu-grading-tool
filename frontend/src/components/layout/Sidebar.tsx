import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  FileText,
  BarChart3,
  Brain,
  Clock,
  Settings,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/upload', label: 'Upload & Compare', icon: Upload },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/quality', label: 'Quality', icon: BarChart3 },
  { to: '/ai', label: 'AI Insights', icon: Brain },
  { to: '/history', label: 'History', icon: Clock },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const;

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-[#E5E5E5] bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <ClipboardList className="h-5 w-5 text-[#006AFF]" />
        <span className="text-sm font-semibold tracking-tight text-[#1A1A1A]">
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
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'border-l-2 border-[#006AFF] bg-[#E6F2FF] text-[#006AFF]'
                  : 'text-[#4A4A4A] hover:bg-[#F6F6F6] hover:text-[#1A1A1A]',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-[#E5E5E5] px-5 py-4">
        <p className="truncate text-xs text-[#8A8A8A]">user@squareup.com</p>
      </div>
    </aside>
  );
}
