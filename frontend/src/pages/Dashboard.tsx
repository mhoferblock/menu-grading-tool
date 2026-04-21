import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import { api } from '@/api/client';
import type { GradingReport } from '@/types';

function statusBadge(status: string) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';
  switch (status) {
    case 'sent':
      return `${base} bg-[#00D632]/10 text-[#00D632]`;
    case 'pending':
      return `${base} bg-[#FF9500]/10 text-[#FF9500]`;
    default:
      return `${base} bg-[#F6F6F6] text-[#8A8A8A]`;
  }
}

function statusLabel(status: string) {
  if (status === 'sent') return 'Sent';
  if (status === 'pending') return 'Pending';
  return 'Draft';
}

function scoreClass(score: number) {
  if (score >= 90) return 'text-[#00D632]';
  if (score >= 80) return 'text-[#006AFF]';
  if (score >= 70) return 'text-[#FF9500]';
  return 'text-[#E02B1D]';
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return iso?.slice(0, 10) ?? '';
  }
}

export default function Dashboard() {
  const [reports, setReports] = useState<GradingReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.reports
      .list()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setReports(list);
      })
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = reports.filter((r) => r.created_at?.slice(0, 10) === today).length;
  const avgScore = reports.length > 0
    ? Math.round(reports.reduce((sum, r) => sum + (r.overall_score || 0), 0) / reports.length)
    : 0;
  const pendingCount = reports.filter((r) => r.feedback_status !== 'sent').length;
  const sentCount = reports.filter((r) => r.feedback_status === 'sent').length;

  const stats = [
    { value: todayCount, label: 'Menus Graded Today', tone: 'info' as const },
    { value: avgScore, label: 'Average Score', tone: avgScore >= 80 ? 'success' as const : 'warning' as const },
    { value: pendingCount, label: 'Pending Review', tone: 'danger' as const },
    { value: sentCount, label: 'Feedback Sent', tone: 'success' as const },
  ];

  const recent = [...reports]
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    .slice(0, 10);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[#1A1A1A]">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Recent Activity */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Recent Activity</h2>
          {reports.length > 10 && (
            <Link to="/reports" className="text-sm font-medium text-[#006AFF] hover:text-[#0056CC] transition-colors">
              View all reports
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E5E5E5] border-t-[#006AFF]" />
          </div>
        ) : recent.length === 0 ? (
          <div className="rounded-xl border border-[#E5E5E5] bg-white py-16 text-center shadow-sm">
            <p className="text-sm text-[#8A8A8A]">No reports yet. Upload a menu to get started.</p>
            <Link
              to="/upload"
              className="mt-3 inline-block rounded-full bg-[#006AFF] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0056CC] transition-colors"
            >
              Upload Menu
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#E5E5E5] shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#E5E5E5] bg-[#F6F6F6]">
                <tr>
                  {['Date', 'Merchant', 'Builder', 'Score', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8A8A8A]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {recent.map((row) => (
                  <tr key={row.id} className="group transition-colors hover:bg-[#F6F6F6]">
                    <td className="px-4 py-3 text-[#8A8A8A]">{formatDate(row.created_at)}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/reports/${row.id}`}
                        className="font-medium text-[#1A1A1A] hover:text-[#006AFF] transition-colors"
                      >
                        {row.merchant_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#4A4A4A]">{row.builder_name}</td>
                    <td className={`px-4 py-3 font-semibold tabular-nums ${scoreClass(row.overall_score)}`}>
                      {row.overall_score}%
                    </td>
                    <td className="px-4 py-3">
                      <span className={statusBadge(row.feedback_status)}>
                        {statusLabel(row.feedback_status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/reports/${row.id}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#8A8A8A] transition-colors hover:bg-[#E6F2FF] hover:text-[#006AFF]"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
