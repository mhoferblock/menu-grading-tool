import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

const PIE_COLORS = ['#006AFF', '#00D632', '#FF9500', '#E02B1D', '#8B5CF6'];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#1A1A1A] shadow">
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
    ? 'bg-[#FF9500]/10 text-[#FF9500]'
    : 'bg-[#00D632]/10 text-[#00D632]';

  return (
    <div className="rounded-xl border border-[#E5E5E5] bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">{title}</h2>
          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', pillClass)}>
            {pill}
          </span>
        </div>
        {open
          ? <ChevronDown className="h-5 w-5 text-[#8A8A8A]" />
          : <ChevronRight className="h-5 w-5 text-[#8A8A8A]" />}
      </button>
      {open && (
        <div className="border-t border-[#E5E5E5] px-6 py-4">
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
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Claude AI Insights</h1>
        <span className="rounded-full bg-[#006AFF]/10 px-3 py-1 text-xs font-medium text-[#006AFF]">
          Powered by Claude
        </span>
      </div>
      <p className="text-sm text-[#8A8A8A]">
        AI-powered analysis of grading patterns, recurring issues, and team performance trends.
      </p>

      {/* Recurring Issues */}
      <CollapsibleCard title="Recurring Issues Detected" pill="3 patterns" pillTone="warning" defaultOpen>
        <div className="space-y-4 text-sm text-[#4A4A4A]">
          <div>
            <p className="font-semibold text-[#1A1A1A]">1. Capitalization inconsistencies across GT team</p>
            <p className="mt-1 text-[#8A8A8A]">12 menus this week had mixed title case and sentence case within the same section. Most frequent in item descriptions.</p>
          </div>
          <div>
            <p className="font-semibold text-[#1A1A1A]">2. Modifier group ordering deviations</p>
            <p className="mt-1 text-[#8A8A8A]">8 menus had modifier groups reordered from the POS display sequence, causing confusion during merchant review.</p>
          </div>
          <div>
            <p className="font-semibold text-[#1A1A1A]">3. Auto-add rule misapplication</p>
            <p className="mt-1 text-[#8A8A8A]">5 menus included items added by auto-add rules that didn't match the merchant's actual menu, primarily affecting combo/meal deals.</p>
          </div>
        </div>
      </CollapsibleCard>

      {/* Learning from Corrections */}
      <CollapsibleCard title="Learning from Corrections" pill="Adaptive" pillTone="success">
        <div className="space-y-4">
          <p className="text-sm text-[#8A8A8A]">
            The AI grading model adapts based on grader overrides and corrections. Here are recent learned rules:
          </p>
          <div className="overflow-hidden rounded-xl border border-[#E5E5E5]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[#F6F6F6]">
                  {['Correction', 'Learned Rule', 'Applied'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8A8A8A]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {corrections.map((r, i) => (
                  <tr key={i} className={cn('border-t border-[#E5E5E5]', i % 2 === 1 && 'bg-[#F6F6F6]/50')}>
                    <td className="px-4 py-3 text-[#4A4A4A]">{r.correction}</td>
                    <td className="px-4 py-3 text-[#1A1A1A]">{r.learned}</td>
                    <td className="px-4 py-3 tabular-nums text-[#8A8A8A]">{r.applied} times</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CollapsibleCard>

      {/* Team Performance Trends */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-[#1A1A1A]">Team Performance Trends</h2>
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={teamTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" vertical={false} />
              <XAxis dataKey="week" stroke="#E5E5E5" tick={{ fill: '#8A8A8A', fontSize: 12 }} />
              <YAxis stroke="#E5E5E5" tick={{ fill: '#8A8A8A', fontSize: 12 }} domain={[65, 90]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#8A8A8A', fontSize: 12 }} />
              <Area type="monotone" dataKey="GT" name="GT Team Avg" stroke="#006AFF" fill="#006AFF" fillOpacity={0.1} />
              <Area type="monotone" dataKey="MNL" name="MNL Team Avg" stroke="#00D632" fill="#00D632" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Issue Distribution */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-[#1A1A1A]">Issue Distribution This Month</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
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
                <Legend wrapperStyle={{ color: '#8A8A8A', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={issueDistBar}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" vertical={false} />
                <XAxis dataKey="category" stroke="#E5E5E5" tick={{ fill: '#8A8A8A', fontSize: 12 }} />
                <YAxis stroke="#E5E5E5" tick={{ fill: '#8A8A8A', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#8A8A8A', fontSize: 12 }} />
                <Bar dataKey="GT" name="GT" fill="#006AFF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="MNL" name="MNL" fill="#00D632" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
