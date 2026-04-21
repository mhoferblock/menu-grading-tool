import { useState } from 'react';
import { Search } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

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

/* ─── Data ────────────────────────────────────────────────────────── */

const historyRows = [
  { date: 'Apr 21', merchant: 'Artisan Coffee House', builder: 'C. Zamora', grader: 'yecheverria-bpo', market: 'US', score: 82, feedback: 'Draft', tone: '' },
  { date: 'Apr 20', merchant: 'Tokyo Ramen Bar', builder: 'A. Cruz', grader: 'sebastianguzman-bpo', market: 'US', score: 91, feedback: 'Sent', tone: 'success' },
  { date: 'Apr 20', merchant: 'Melbourne Bistro', builder: 'R. Santos', grader: 'alyanna-bpo', market: 'AU', score: 74, feedback: 'Pending', tone: 'warning' },
  { date: 'Apr 19', merchant: 'Bella Italia', builder: 'L. Reyes', grader: 'randell-bpo', market: 'EU', score: 88, feedback: 'Sent', tone: '' },
  { date: 'Apr 19', merchant: 'Green Bowl Kitchen', builder: 'C. Zamora', grader: 'czamora-bpo', market: 'US', score: 67, feedback: 'Sent', tone: 'danger' },
  { date: 'Apr 18', merchant: 'Sunrise Bakery', builder: 'S. Guzman', grader: 'leonel-bpo', market: 'US', score: 93, feedback: 'Sent', tone: 'success' },
];

const scoreDist = [
  { range: '0-59', count: 2 },
  { range: '60-69', count: 5 },
  { range: '70-79', count: 9 },
  { range: '80-89', count: 14 },
  { range: '90-100', count: 8 },
];

function scoreColor(score: number) {
  if (score >= 90) return 'text-[#00D632]';
  if (score >= 75) return 'text-[#FF9500]';
  if (score >= 60) return 'text-[#FF9500]';
  return 'text-[#E02B1D]';
}

function feedbackBadge(feedback: string, tone: string) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';
  if (tone === 'success') return `${base} bg-[#00D632]/10 text-[#00D632]`;
  if (tone === 'warning') return `${base} bg-[#FF9500]/10 text-[#FF9500]`;
  if (tone === 'danger') return `${base} bg-[#E02B1D]/10 text-[#E02B1D]`;
  if (feedback === 'Sent') return `${base} bg-[#00D632]/10 text-[#00D632]`;
  return `${base} bg-[#F6F6F6] text-[#8A8A8A]`;
}

/* ─── Page ────────────────────────────────────────────────────────── */

export default function History() {
  const [search, setSearch] = useState('');

  const filtered = historyRows.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.merchant.toLowerCase().includes(q) ||
      r.builder.toLowerCase().includes(q) ||
      r.grader.toLowerCase().includes(q) ||
      r.market.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Grading History</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]" />
          <input
            type="text"
            placeholder="Search history…"
            aria-label="Search grading history"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-[#E5E5E5] bg-white py-2 pl-9 pr-4 text-sm text-[#1A1A1A] placeholder-[#8A8A8A] outline-none focus:border-[#006AFF] focus:ring-1 focus:ring-[#006AFF]/10"
          />
        </div>
      </div>

      {/* History Table */}
      <div className="overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-[#F6F6F6]">
              {['Date', 'Merchant', 'Builder', 'Graded By', 'Market', 'Score', 'Feedback'].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8A8A8A]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr
                key={i}
                className={cn(
                  'border-t border-[#E5E5E5]',
                  r.tone === 'success' && 'bg-[#00D632]/10',
                  r.tone === 'warning' && 'bg-[#FF9500]/10',
                  r.tone === 'danger' && 'bg-[#E02B1D]/10',
                  !r.tone && i % 2 === 1 && 'bg-[#F6F6F6]/50',
                )}
              >
                <td className="px-4 py-3 text-[#8A8A8A]">{r.date}</td>
                <td className="px-4 py-3 font-medium text-[#1A1A1A]">{r.merchant}</td>
                <td className="px-4 py-3 text-[#4A4A4A]">{r.builder}</td>
                <td className="px-4 py-3 text-[#8A8A8A]">{r.grader}</td>
                <td className="px-4 py-3 text-[#8A8A8A]">{r.market}</td>
                <td className={cn('px-4 py-3 font-medium tabular-nums', scoreColor(r.score))}>
                  {r.score}/100
                </td>
                <td className="px-4 py-3">
                  <span className={feedbackBadge(r.feedback, r.tone)}>{r.feedback}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Score Distribution Chart */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-[#1A1A1A]">Score Distribution (Last 30 Days)</h2>
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoreDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" vertical={false} />
              <XAxis dataKey="range" stroke="#E5E5E5" tick={{ fill: '#8A8A8A', fontSize: 12 }} />
              <YAxis stroke="#E5E5E5" tick={{ fill: '#8A8A8A', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Reports" fill="#006AFF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
