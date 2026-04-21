import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileDown, ArrowLeft } from 'lucide-react';
import ScoreRing from '@/components/ui/ScoreRing';
import GradeBar from '@/components/ui/GradeBar';
import StatCard from '@/components/ui/StatCard';
import FeedbackPreview from '@/components/feedback/FeedbackPreview';
import { api } from '@/api/client';
import type { GradingReport, ItemGrade } from '@/types';

function scoreLabel(score: number) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Fair';
  return 'Needs Work';
}

function scoreLabelColor(score: number) {
  if (score >= 90) return 'bg-green-500/20 text-green-400';
  if (score >= 80) return 'bg-blue-500/20 text-blue-400';
  if (score >= 70) return 'bg-amber-500/20 text-amber-400';
  return 'bg-red-500/20 text-red-400';
}

function rowTone(score: number) {
  if (score >= 90) return 'bg-emerald-500/5';
  if (score >= 75) return '';
  if (score >= 60) return 'bg-amber-500/5';
  return 'bg-red-500/5';
}

function scoreBadge(score: number) {
  if (score >= 90) return 'text-green-400';
  if (score >= 75) return 'text-zinc-300';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function issueCount(issues: Record<string, unknown>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const [key, val] of Object.entries(issues)) {
    if (Array.isArray(val)) counts[key] = val.length;
    else if (typeof val === 'number') counts[key] = val;
    else counts[key] = 0;
  }
  return counts;
}

export default function Report() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<GradingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('No report ID provided');
      setLoading(false);
      return;
    }
    api.reports
      .get(id)
      .then(setReport)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load report'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <Link to="/reports" className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200">
          <ArrowLeft className="h-4 w-4" /> Back to Reports
        </Link>
        <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-20 text-center">
          <p className="text-sm text-red-400">{error || 'Report not found'}</p>
        </div>
      </div>
    );
  }

  const r = report;
  const issues = issueCount(r.issues);

  if (showFeedback) {
    return <FeedbackPreview report={r} onClose={() => setShowFeedback(false)} />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Back link */}
      <Link to="/reports" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200">
        <ArrowLeft className="h-4 w-4" /> Back to Reports
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">QA Report: {r.merchant_name}</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Graded by {r.graded_by} on {formatDate(r.created_at)} | Market: {r.market}
          </p>
          <p className="text-sm text-zinc-400">
            Built by {r.builder_name} ({r.builder_email}) | Team: {r.builder_team}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700"
          >
            <FileDown className="h-4 w-4" />
            Export PDF
          </button>
          <button
            onClick={() => setShowFeedback(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Send Feedback
          </button>
        </div>
      </div>

      {/* Score Section */}
      <div className="grid items-center gap-6 md:grid-cols-[1fr_2fr]">
        <div className="flex flex-col items-center gap-3">
          <ScoreRing score={r.overall_score} size={120} />
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${scoreLabelColor(r.overall_score)}`}>
            {scoreLabel(r.overall_score)}
          </span>
        </div>
        <div className="space-y-3">
          {r.section_scores.neatness && (
            <GradeBar label="Neatness" score={r.section_scores.neatness.earned} max={r.section_scores.neatness.max_points} />
          )}
          {r.section_scores.organization && (
            <GradeBar label="Organization" score={r.section_scores.organization.earned} max={r.section_scores.organization.max_points} />
          )}
          {r.section_scores.accuracy && (
            <GradeBar label="Accuracy" score={r.section_scores.accuracy.earned} max={r.section_scores.accuracy.max_points} />
          )}
          {r.section_scores.thoroughness && (
            <GradeBar label="Thoroughness" score={r.section_scores.thoroughness.earned} max={r.section_scores.thoroughness.max_points} />
          )}
        </div>
      </div>

      <hr className="border-zinc-800" />

      {/* Issue Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard value={issues.price_discrepancies ?? 0} label="Price Mismatches" tone="danger" />
        <StatCard value={issues.capitalization_errors ?? 0} label="Capitalization Errors" tone="warning" />
        <StatCard value={issues.modifier_issues ?? 0} label="Modifier Issues" tone="warning" />
        <StatCard value={issues.duplicates ?? 0} label="Duplicates" tone="info" />
        <StatCard value={issues.missing_items ?? 0} label="Missing Items" tone="danger" />
        <StatCard value={issues.extra_items ?? 0} label="Extra Items" tone="success" />
      </div>

      <hr className="border-zinc-800" />

      {/* Per-Item Grades Table */}
      {r.item_grades.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 z-10">
                <tr className="bg-zinc-800/50">
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400">Item</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400">Category</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400">Score</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400" title="Neatness">N</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400" title="Organization">O</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400" title="Accuracy">A</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400" title="Thoroughness">T</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400">Issues</th>
                </tr>
              </thead>
              <tbody>
                {r.item_grades.map((item: ItemGrade, idx: number) => (
                  <tr
                    key={item.item_name}
                    className={`${rowTone(item.overall_score)} ${idx % 2 === 1 ? 'bg-zinc-900/50' : ''}`}
                  >
                    <td className="border-t border-zinc-800/50 px-4 py-3 text-sm font-medium text-zinc-200">
                      {item.item_name}
                    </td>
                    <td className="border-t border-zinc-800/50 px-4 py-3 text-sm text-zinc-400">
                      {item.category_name}
                    </td>
                    <td className={`border-t border-zinc-800/50 px-4 py-3 text-sm font-semibold tabular-nums ${scoreBadge(item.overall_score)}`}>
                      {item.overall_score}%
                    </td>
                    <td className="border-t border-zinc-800/50 px-4 py-3 text-sm tabular-nums text-zinc-400">{item.neatness}</td>
                    <td className="border-t border-zinc-800/50 px-4 py-3 text-sm tabular-nums text-zinc-400">{item.organization}</td>
                    <td className="border-t border-zinc-800/50 px-4 py-3 text-sm tabular-nums text-zinc-400">{item.accuracy}</td>
                    <td className="border-t border-zinc-800/50 px-4 py-3 text-sm tabular-nums text-zinc-400">{item.thoroughness}</td>
                    <td className="border-t border-zinc-800/50 px-4 py-3 text-sm text-zinc-400">
                      {item.issues.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.issues.map((issue, i) => (
                            <span
                              key={i}
                              className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400"
                            >
                              {issue}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 py-12 text-center">
          <p className="text-sm text-zinc-500">No per-item grades recorded for this report.</p>
        </div>
      )}
    </div>
  );
}
