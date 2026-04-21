import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 shadow">
      {label && <p className="mb-1 font-medium">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

/* ─── Collapsible Card ────────────────────────────────────────────── */

function CollapsibleCard({
  title,
  pill,
  pillTone,
  defaultOpen = false,
  children,
}: {
  title: string;
  pill: string;
  pillTone: 'warning' | 'success';
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const pillClass = pillTone === 'warning'
    ? 'bg-amber-500/10 text-amber-400'
    : 'bg-emerald-500/10 text-emerald-400';

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-zinc-200">{title}</h2>
          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', pillClass)}>
            {pill}
          </span>
        </div>
        {open
          ? <ChevronDown className="h-5 w-5 text-zinc-400" />
          : <ChevronRight className="h-5 w-5 text-zinc-400" />}
      </button>
      {open && (
        <div className="border-t border-zinc-800 px-6 py-4">
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── Data ────────────────────────────────────────────────────────── */

const teamTrend = [
  { week: 'Week 1', GT: 74, MNL: 71 },
  { week: 'Week 2', GT: 76, MNL: 73 },
  { week: 'Week 3', GT: 75, MNL: 75 },
  { week: 'Week 4', GT: 78, MNL: 76 },
  { week: 'Week 5', GT: 80, MNL: 77 },
  { week: 'Week 6', GT: 81, MNL: 78 },
];

const issueDistPie = [
  { name: 'Capitalization', value: 34 },
  { name: 'Modifiers', value: 28 },
  { name: 'Pricing', value: 18 },
  { name: 'Duplicates', value: 12 },
  { name: 'Organization', value: 8 },
];

const issueDistBar = [
  { category: 'Capitalization', GT: 18, MNL: 16 },
  { category: 'Modifiers', GT: 12, MNL: 16 },
  { category: 'Pricing', GT: 10, MNL: 8 },
  { category: 'Duplicates', GT: 5, MNL: 7 },
];

const corrections = [
  { correction: 'Changed "Menu Item" → "menu item" in lowercase market', learned: 'Respect market-specific casing rules', applied: 12 },
  { correction: 'Kept modifier group order as submitted', learned: 'Modifier order follows POS display order', applied: 8 },
  { correction: 'Accepted $0.00 price for combo components', learned: '$0 valid for bundled sub-items', applied: 5 },
];

/* ─── Page ────────────────────────────────────────────────────────── */

export default function AIInsights() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">Claude AI Insights</h1>
        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
          Powered by Claude
        </span>
      </div>
      <p className="text-sm text-zinc-400">
        AI-powered analysis of grading patterns, recurring issues, and team performance trends.
      </p>

      {/* Recurring Issues */}
      <CollapsibleCard title="Recurring Issues Detected" pill="3 patterns" pillTone="warning" defaultOpen>
        <div className="space-y-4 text-sm text-zinc-300">
          <div>
            <p className="font-semibold text-zinc-100">1. Capitalization inconsistencies across GT team</p>
            <p className="mt-1 text-zinc-400">12 menus this week had mixed title case and sentence case within the same section. Most frequent in item descriptions.</p>
          </div>
          <div>
            <p className="font-semibold text-zinc-100">2. Modifier group ordering deviations</p>
            <p className="mt-1 text-zinc-400">8 menus had modifier groups reordered from the POS display sequence, causing confusion during merchant review.</p>
          </div>
          <div>
            <p className="font-semibold text-zinc-100">3. Auto-add rule misapplication</p>
            <p className="mt-1 text-zinc-400">5 menus included items added by auto-add rules that didn't match the merchant's actual menu, primarily affecting combo/meal deals.</p>
          </div>
        </div>
      </CollapsibleCard>

      {/* Learning from Corrections */}
      <CollapsibleCard title="Learning from Corrections" pill="Adaptive" pillTone="success">
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            The AI grading model adapts based on grader overrides and corrections. Here are recent learned rules:
          </p>
          <div className="overflow-hidden rounded-lg border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-zinc-800/50">
                  {['Correction', 'Learned Rule', 'Applied'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {corrections.map((r, i) => (
                  <tr key={i} className={cn('border-t border-zinc-800/50', i % 2 === 1 && 'bg-zinc-900/50')}>
                    <td className="px-4 py-3 text-zinc-300">{r.correction}</td>
                    <td className="px-4 py-3 text-zinc-200">{r.learned}</td>
                    <td className="px-4 py-3 tabular-nums text-zinc-400">{r.applied} times</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CollapsibleCard>

      {/* Team Performance Trends */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-200">Team Performance Trends</h2>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={teamTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#71717a" vertical={false} />
              <XAxis dataKey="week" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
              <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} domain={[65, 90]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: 12 }} />
              <Area type="monotone" dataKey="GT" name="GT Team Avg" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
              <Area type="monotone" dataKey="MNL" name="MNL Team Avg" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Issue Distribution */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-200">Issue Distribution This Month</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={issueDistPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  nameKey="name"
                  paddingAngle={2}
                >
                  {issueDistPie.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={issueDistBar}>
                <CartesianGrid strokeDasharray="3 3" stroke="#71717a" vertical={false} />
                <XAxis dataKey="category" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: 12 }} />
                <Bar dataKey="GT" name="GT" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="MNL" name="MNL" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
