import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, ChevronRight } from 'lucide-react';
import { api } from '@/api/client';
import type { GradingReport } from '@/types';

function scoreBadgeColor(score: number) {
  if (score >= 90) return 'bg-emerald-500/20 text-emerald-400';
  if (score >= 80) return 'bg-blue-500/20 text-blue-400';
  if (score >= 70) return 'bg-amber-500/20 text-amber-400';
  return 'bg-red-500/20 text-red-400';
}

function statusBadge(status: string) {
  switch (status) {
    case 'sent':
      return 'bg-emerald-500/20 text-emerald-400';
    case 'approved':
      return 'bg-blue-500/20 text-blue-400';
    case 'pending_review':
      return 'bg-amber-500/20 text-amber-400';
    case 'draft':
    default:
      return 'bg-zinc-700/50 text-zinc-400';
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'sent':
      return 'Sent';
    case 'approved':
      return 'Approved';
    case 'pending_review':
      return 'Pending';
    case 'draft':
      return 'Draft';
    default:
      return status;
  }
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ReportsList() {
  const [reports, setReports] = useState<GradingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.reports
      .list()
      .then(setReports)
      .finally(() => setLoading(false));
  }, []);

  const filtered = reports.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.merchant_name.toLowerCase().includes(q) ||
      r.builder_name.toLowerCase().includes(q) ||
      r.market.toLowerCase().includes(q) ||
      r.graded_by.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">Reports</h1>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search reports"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-9 pr-3 text-sm text-zinc-200 placeholder-zinc-500 focus:border-blue-500 focus:outline-none sm:w-72"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-20 text-center">
          <FileText className="mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-sm text-zinc-400">
            {search ? 'No reports match your search.' : 'No reports yet. Grade a menu to get started.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-800/50">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Merchant
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Builder
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Market
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Score
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Date
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="group border-t border-zinc-800/50 transition-colors hover:bg-zinc-800/30"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/reports/${r.id}`}
                      className="text-sm font-medium text-zinc-200 hover:text-white"
                    >
                      {r.merchant_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-zinc-300">{r.builder_name}</div>
                    <div className="text-xs text-zinc-500">{r.builder_team}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                      {r.market}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${scoreBadgeColor(r.overall_score)}`}
                    >
                      {r.overall_score}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(r.feedback_status)}`}
                    >
                      {statusLabel(r.feedback_status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {formatDate(r.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/reports/${r.id}`}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 group-hover:text-zinc-300"
                    >
                      View <ChevronRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
