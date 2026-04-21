import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell,
} from 'recharts';
import { cn } from '@/lib/utils';
import StatCard from '@/components/ui/StatCard';
import ScoreRing from '@/components/ui/ScoreRing';

type SubTab = 'builder' | 'grader' | 'profile';

const SUB_TABS: { key: SubTab; label: string }[] = [
  { key: 'builder', label: 'Builder Quality' },
  { key: 'grader', label: 'Grader Quality' },
  { key: 'profile', label: 'Builder Profile' },
];

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

/* ─── Builder Quality Tab ──────────────────────────────────────────── */

const builderStats = [
  { value: 24, label: 'Active Builders', tone: 'info' as const },
  { value: 78, label: 'Avg Score', tone: 'warning' as const },
  { value: 6, label: 'Improving', tone: 'success' as const },
  { value: 3, label: 'Declining', tone: 'danger' as const },
];

const builderRows = [
  { builder: 'Carlos Zamora', team: 'GT', menus: 12, avg: 76, trend: 'Improving (+4)', topIssue: 'Capitalization', tone: '' },
  { builder: 'Alyanna Cruz', team: 'MNL', menus: 15, avg: 84, trend: 'Stable', topIssue: 'Modifier ordering', tone: '' },
  { builder: 'Leonel Reyes', team: 'GT', menus: 9, avg: 91, trend: 'Stable', topIssue: 'None recurring', tone: 'success' },
  { builder: 'Randell Santos', team: 'MNL', menus: 11, avg: 68, trend: 'Declining (-6)', topIssue: 'Price mismatches', tone: 'danger' },
  { builder: 'Sebastian Guzman', team: 'GT', menus: 14, avg: 82, trend: 'Improving (+8)', topIssue: 'Auto-add rules', tone: '' },
  { builder: 'Amauricio Lopez', team: 'GT', menus: 7, avg: 73, trend: 'Declining (-3)', topIssue: 'Duplicate items', tone: 'warning' },
];

const builderDistribution = [
  { range: '0-59', GT: 1, MNL: 0 },
  { range: '60-69', GT: 2, MNL: 3 },
  { range: '70-79', GT: 4, MNL: 5 },
  { range: '80-89', GT: 6, MNL: 4 },
  { range: '90-100', GT: 3, MNL: 2 },
];

function BuilderQuality() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {builderStats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-200">Builder Scores (Last 30 Days)</h2>
        <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-zinc-800/50">
                {['Builder', 'Team', 'Menus', 'Avg Score', 'Trend', 'Top Issue'].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {builderRows.map((r, i) => (
                <tr
                  key={r.builder}
                  className={cn(
                    'border-t border-zinc-800/50',
                    r.tone === 'success' && 'bg-emerald-500/5',
                    r.tone === 'warning' && 'bg-amber-500/5',
                    r.tone === 'danger' && 'bg-red-500/5',
                    !r.tone && i % 2 === 1 && 'bg-zinc-900/50',
                  )}
                >
                  <td className="px-4 py-3 font-medium text-zinc-200">{r.builder}</td>
                  <td className="px-4 py-3 text-zinc-400">{r.team}</td>
                  <td className="px-4 py-3 tabular-nums text-zinc-300">{r.menus}</td>
                  <td className={cn('px-4 py-3 font-medium tabular-nums', scoreColor(r.avg))}>{r.avg}</td>
                  <td className={cn('px-4 py-3 text-sm', trendColor(r.trend))}>{r.trend}</td>
                  <td className="px-4 py-3 text-zinc-400">{r.topIssue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-200">Builder Score Distribution</h2>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={builderDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#71717a" vertical={false} />
              <XAxis dataKey="range" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
              <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: 12 }} />
              <Bar dataKey="GT" name="GT Builders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="MNL" name="MNL Builders" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

/* ─── Grader Quality Tab ──────────────────────────────────────────── */

const graderStats = [
  { value: 9, label: 'Active Graders', tone: 'info' as const },
  { value: '4.2m', label: 'Avg Grade Time', tone: 'info' as const },
  { value: '14%', label: 'Override Rate', tone: 'warning' as const },
  { value: 47, label: 'Menus This Week', tone: 'info' as const },
];

const graderRows = [
  { grader: 'yecheverria-bpo', graded: 156, avgTime: '3.8 min', avgScore: 79, override: '8%', consistency: 'High', tone: '' },
  { grader: 'sebastianguzman-bpo', graded: 142, avgTime: '4.1 min', avgScore: 81, override: '12%', consistency: 'High', tone: '' },
  { grader: 'alyanna-bpo', graded: 128, avgTime: '3.5 min', avgScore: 83, override: '6%', consistency: 'Very High', tone: 'success' },
  { grader: 'randell-bpo', graded: 98, avgTime: '5.2 min', avgScore: 74, override: '22%', consistency: 'Low', tone: 'danger' },
  { grader: 'czamora-bpo', graded: 115, avgTime: '4.4 min', avgScore: 77, override: '18%', consistency: 'Medium', tone: 'warning' },
  { grader: 'leonel-bpo', graded: 134, avgTime: '3.9 min', avgScore: 80, override: '10%', consistency: 'High', tone: '' },
];

const graderScoreDist = [
  { grader: 'yecheverria', score: 79 },
  { grader: 'sebastian', score: 81 },
  { grader: 'alyanna', score: 83 },
  { grader: 'randell', score: 74 },
  { grader: 'czamora', score: 77 },
  { grader: 'leonel', score: 80 },
];

const gradeTimeTrend = [
  { week: 'Week 1', time: 5.1 },
  { week: 'Week 2', time: 4.8 },
  { week: 'Week 3', time: 4.5 },
  { week: 'Week 4', time: 4.2 },
  { week: 'Week 5', time: 4.0 },
  { week: 'Week 6', time: 3.9 },
];

function GraderQuality() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {graderStats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-200">Grader Performance</h2>
        <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-zinc-800/50">
                {['Grader', 'Menus Graded', 'Avg Time', 'Avg Score Given', 'Override Rate', 'Consistency'].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {graderRows.map((r, i) => (
                <tr
                  key={r.grader}
                  className={cn(
                    'border-t border-zinc-800/50',
                    r.tone === 'success' && 'bg-emerald-500/5',
                    r.tone === 'warning' && 'bg-amber-500/5',
                    r.tone === 'danger' && 'bg-red-500/5',
                    !r.tone && i % 2 === 1 && 'bg-zinc-900/50',
                  )}
                >
                  <td className="px-4 py-3 font-medium text-zinc-200">{r.grader}</td>
                  <td className="px-4 py-3 tabular-nums text-zinc-300">{r.graded}</td>
                  <td className="px-4 py-3 text-zinc-400">{r.avgTime}</td>
                  <td className={cn('px-4 py-3 font-medium tabular-nums', scoreColor(r.avgScore))}>{r.avgScore}</td>
                  <td className="px-4 py-3 text-zinc-400">{r.override}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      r.tone === 'success' && 'bg-emerald-500/10 text-emerald-400',
                      r.tone === 'danger' && 'bg-red-500/10 text-red-400',
                      r.tone === 'warning' && 'bg-amber-500/10 text-amber-400',
                      !r.tone && 'bg-zinc-700/40 text-zinc-300',
                    )}>
                      {r.consistency}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-200">Score Distribution by Grader</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={graderScoreDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="#71717a" vertical={false} />
              <XAxis dataKey="grader" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
              <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} domain={[60, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="score" name="Avg Score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-200">Grade Time Trend</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={gradeTimeTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#71717a" vertical={false} />
              <XAxis dataKey="week" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
              <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="time" name="Avg Time (min)" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </section>
      </div>
    </div>
  );
}

/* ─── Builder Profile Tab ─────────────────────────────────────────── */

const profileScoreTrend = [
  { month: 'Jan', Carlos: 68, TeamAvg: 74 },
  { month: 'Feb', Carlos: 71, TeamAvg: 75 },
  { month: 'Mar', Carlos: 73, TeamAvg: 76 },
  { month: 'Apr', Carlos: 76, TeamAvg: 78 },
];

const profileIssues = [
  { name: 'Capitalization', value: 34 },
  { name: 'Modifiers', value: 22 },
  { name: 'Pricing', value: 18 },
  { name: 'Duplicates', value: 14 },
  { name: 'Organization', value: 12 },
];

const profileStrengths = [
  { section: 'Neatness', Carlos: 82, Team: 78 },
  { section: 'Organization', Carlos: 71, Team: 80 },
  { section: 'Accuracy', Carlos: 78, Team: 76 },
  { section: 'Thoroughness', Carlos: 74, Team: 77 },
];

const profileReports = [
  { date: 'Apr 21', merchant: 'Artisan Coffee House', score: 82, topIssue: 'Capitalization', feedback: 'Draft' },
  { date: 'Apr 19', merchant: 'Green Bowl Kitchen', score: 67, topIssue: 'Auto-add rules', feedback: 'Sent' },
  { date: 'Apr 16', merchant: 'Taco Fiesta', score: 78, topIssue: 'Modifier ordering', feedback: 'Sent' },
  { date: 'Apr 14', merchant: 'Pizza Paradise', score: 81, topIssue: 'Duplicates', feedback: 'Sent' },
];

function BuilderProfile() {
  const [coachingOpen, setCoachingOpen] = useState(true);

  return (
    <div className="space-y-8">
      {/* Profile header */}
      <div className="flex items-center gap-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 text-lg font-bold text-zinc-300">
          CZ
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-zinc-100">Carlos Zamora</h2>
          <p className="text-sm text-zinc-400">czamora-bpo@bpofit.com · GT Team</p>
        </div>
        <ScoreRing score={76} size={56} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard value={12} label="Menus Built" tone="info" />
        <StatCard value={76} label="Avg Score" tone="warning" />
        <StatCard value="+4" label="Trend" tone="success" />
        <StatCard value="3.2" label="Avg Issues/Menu" tone="info" />
      </div>

      <hr className="border-zinc-800" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-200">Score Trend</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={profileScoreTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#71717a" vertical={false} />
              <XAxis dataKey="month" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
              <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} domain={[60, 90]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: 12 }} />
              <Area type="monotone" dataKey="Carlos" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
              <Area type="monotone" dataKey="TeamAvg" name="Team Avg" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-200">Issues by Category</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={profileIssues}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                nameKey="name"
                paddingAngle={2}
              >
                {profileIssues.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </section>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-200">Section Strengths & Weaknesses</h2>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={profileStrengths}>
              <CartesianGrid strokeDasharray="3 3" stroke="#71717a" vertical={false} />
              <XAxis dataKey="section" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
              <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} domain={[50, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: 12 }} />
              <Bar dataKey="Carlos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Team" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Coaching Recommendations */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900">
        <button
          onClick={() => setCoachingOpen(!coachingOpen)}
          aria-expanded={coachingOpen}
          className="flex w-full items-center justify-between px-6 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-zinc-200">Coaching Recommendations</h2>
            <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
              Claude AI
            </span>
          </div>
          <svg
            className={cn('h-5 w-5 text-zinc-400 transition-transform', coachingOpen && 'rotate-180')}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {coachingOpen && (
          <div className="border-t border-zinc-800 px-6 py-4 text-sm leading-relaxed text-zinc-300 space-y-3">
            <p><strong className="text-zinc-100">1. Focus on capitalization consistency.</strong> Carlos's most frequent issue is capitalization errors. Recommend reviewing the style guide section on title case vs. sentence case for menu item names and descriptions.</p>
            <p><strong className="text-zinc-100">2. Double-check auto-add rules.</strong> Several recent menus had items incorrectly added by auto-add rules. Suggest manually verifying auto-added items before submitting, especially for combo/meal deals.</p>
            <p><strong className="text-zinc-100">3. Organization score improvement.</strong> Carlos's organization scores trail the team average by 9 points. Recommend using the category template feature to ensure consistent section ordering across menus.</p>
          </div>
        )}
      </section>

      {/* Recent Reports */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-200">Recent Reports</h2>
        <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-zinc-800/50">
                {['Date', 'Merchant', 'Score', 'Top Issue', 'Feedback'].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profileReports.map((r, i) => (
                <tr key={i} className={cn('border-t border-zinc-800/50', i % 2 === 1 && 'bg-zinc-900/50')}>
                  <td className="px-4 py-3 text-zinc-400">{r.date}</td>
                  <td className="px-4 py-3 text-zinc-200">{r.merchant}</td>
                  <td className={cn('px-4 py-3 font-medium tabular-nums', scoreColor(r.score))}>{r.score}</td>
                  <td className="px-4 py-3 text-zinc-400">{r.topIssue}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      r.feedback === 'Sent' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-700/40 text-zinc-400',
                    )}>
                      {r.feedback}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ─── Utility helpers ─────────────────────────────────────────────── */

function scoreColor(score: number) {
  if (score >= 90) return 'text-emerald-400';
  if (score >= 75) return 'text-amber-400';
  if (score >= 60) return 'text-orange-400';
  return 'text-red-400';
}

function trendColor(trend: string) {
  if (trend.includes('Improving')) return 'text-emerald-400';
  if (trend.includes('Declining')) return 'text-red-400';
  return 'text-zinc-400';
}

/* ─── Main Quality Page ───────────────────────────────────────────── */

export default function Quality() {
  const [tab, setTab] = useState<SubTab>('builder');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-100">Quality Tracking</h1>

      {/* Sub-tab pills */}
      <div className="flex gap-2">
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm transition-colors',
              tab === t.key
                ? 'bg-zinc-100 font-medium text-zinc-900'
                : 'text-zinc-400 hover:text-zinc-200',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'builder' && <BuilderQuality />}
      {tab === 'grader' && <GraderQuality />}
      {tab === 'profile' && <BuilderProfile />}
    </div>
  );
}
