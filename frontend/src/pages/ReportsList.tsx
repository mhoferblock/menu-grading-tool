import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, ChevronRight } from 'lucide-react';
import { api } from '@/api/client';
import type { GradingReport } from '@/types';

function scoreBadgeColor(score: number) {
  if (score >= 90) return 'bg-[#00D632]/20 text-[#00D632]';
  if (score >= 80) return 'bg-[#006AFF]/20 text-[#006AFF]';
  if (score >= 70) return 'bg-[#FF9500]/20 text-[#FF9500]';
  return 'bg-[#E02B1D]/20 text-[#E02B1D]';
}

function statusBadge(status: string) {
  switch (status) {
    case 'sent':
      return 'bg-[#00D632]/20 text-[#00D632]';
    case 'approved':
      return 'bg-[#006AFF]/20 text-[#006AFF]';
    case 'pending_review':
      return 'bg-[#FF9500]/20 text-[#FF9500]';
    case 'draft':
    default:
      return 'bg-[#F6F6F6] text-[#8A8A8A]';
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
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Reports</h1>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]" />
          <input
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search reports"
            className="w-full rounded-lg border border-[#E5E5E5] bg-[#F6F6F6] py-2 pl-9 pr-3 text-sm text-[#1A1A1A] placeholder-[#8A8A8A] focus:border-[#006AFF] focus:outline-none sm:w-72"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E5E5E5] border-t-[#006AFF]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#E5E5E5] bg-white py-20 text-center shadow-sm">
          <FileText className="mb-3 h-10 w-10 text-[#E5E5E5]" />
          <p className="text-sm text-[#8A8A8A]">
            {search ? 'No reports match your search.' : 'No reports yet. Grade a menu to get started.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#F6F6F6]">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8A8A8A]">
                  Merchant
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8A8A8A]">
                  Builder
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8A8A8A]">
                  Market
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8A8A8A]">
                  Score
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8A8A8A]">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8A8A8A]">
                  Date
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="group border-t border-[#E5E5E5] transition-colors hover:bg-[#F6F6F6]"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/reports/${r.id}`}
                      className="text-sm font-medium text-[#1A1A1A] hover:text-[#006AFF]"
                    >
                      {r.merchant_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-[#4A4A4A]">{r.builder_name}</div>
                    <div className="text-xs text-[#8A8A8A]">{r.builder_team}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-[#E5E5E5] bg-[#F6F6F6] px-2 py-0.5 text-xs text-[#8A8A8A]">
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
                  <td className="px-4 py-3 text-xs text-[#8A8A8A]">
                    {formatDate(r.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/reports/${r.id}`}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#8A8A8A] transition-colors hover:bg-[#F6F6F6] hover:text-[#4A4A4A] group-hover:text-[#4A4A4A]"
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
