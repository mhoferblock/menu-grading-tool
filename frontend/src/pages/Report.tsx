import { useState } from 'react';
import { FileDown } from 'lucide-react';
import ScoreRing from '@/components/ui/ScoreRing';
import GradeBar from '@/components/ui/GradeBar';
import StatCard from '@/components/ui/StatCard';
import FeedbackPreview from '@/components/feedback/FeedbackPreview';
import type { GradingReport, ItemGrade } from '@/types';

const sampleReport: GradingReport = {
  id: 'rpt-001',
  merchant_name: 'Artisan Coffee House',
  market: 'US',
  graded_by: 'yecheverria-bpo@bpofit.com',
  overall_score: 82,
  section_scores: {
    neatness: { score: 85, earned: 8.5, max_points: 10 },
    organization: { score: 78, earned: 23.4, max_points: 30 },
    accuracy: { score: 80, earned: 32, max_points: 40 },
    thoroughness: { score: 90, earned: 18, max_points: 20 },
  },
  item_grades: [
    { item_name: 'Espresso', category_name: 'Hot Drinks', overall_score: 95, neatness: 10, organization: 28, accuracy: 38, thoroughness: 19, issues: [] },
    { item_name: 'Caramel Macchiato', category_name: 'Hot Drinks', overall_score: 88, neatness: 9, organization: 26, accuracy: 35, thoroughness: 18, issues: ['modifier'] },
    { item_name: 'Iced Americano', category_name: 'Cold Drinks', overall_score: 72, neatness: 7, organization: 22, accuracy: 28, thoroughness: 15, issues: ['price', 'modifier'] },
    { item_name: 'Avocado Toast', category_name: 'Food', overall_score: 90, neatness: 9, organization: 27, accuracy: 36, thoroughness: 18, issues: [] },
    { item_name: 'caesar salad', category_name: 'Food', overall_score: 60, neatness: 6, organization: 18, accuracy: 24, thoroughness: 12, issues: ['capitalization', 'price', 'missing'] },
    { item_name: 'Chocolate Chip Cookie', category_name: 'Bakery', overall_score: 92, neatness: 9, organization: 28, accuracy: 37, thoroughness: 18, issues: [] },
    { item_name: 'Fresh Squeezed OJ', category_name: 'Cold Drinks', overall_score: 78, neatness: 8, organization: 23, accuracy: 30, thoroughness: 17, issues: ['modifier', 'capitalization'] },
    { item_name: 'Bagel With Cream cheese', category_name: 'Bakery', overall_score: 68, neatness: 7, organization: 20, accuracy: 26, thoroughness: 15, issues: ['capitalization', 'duplicate', 'capitalization'] },
  ],
  issues: {
    price_discrepancies: 2,
    capitalization_errors: 4,
    modifier_issues: 3,
    duplicates: 1,
    missing_items: 1,
    extra_items: 0,
  },
  builder_name: 'Carlos Zamora',
  builder_email: 'czamora-bpo@bpofit.com',
  builder_team: 'GT',
  builder_id: 'bld-001',
  feedback_status: 'pending',
  feedback_sent_at: null,
  feedback_notes: null,
  created_at: '2026-04-21T10:30:00Z',
};

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

export default function Report() {
  const [showFeedback, setShowFeedback] = useState(false);
  const r = sampleReport;

  if (showFeedback) {
    return <FeedbackPreview report={r} onClose={() => setShowFeedback(false)} />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">QA Report: {r.merchant_name}</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Graded by {r.graded_by} on Apr 21, 2026 | Market: {r.market}
          </p>
          <p className="text-sm text-zinc-400">
            Built by {r.builder_name} ({r.builder_email}) | Team: {r.builder_team}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700">
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
          <GradeBar label="Neatness" score={r.section_scores.neatness.earned} max={r.section_scores.neatness.max_points} />
          <GradeBar label="Organization" score={r.section_scores.organization.earned} max={r.section_scores.organization.max_points} />
          <GradeBar label="Accuracy" score={r.section_scores.accuracy.earned} max={r.section_scores.accuracy.max_points} />
          <GradeBar label="Thoroughness" score={r.section_scores.thoroughness.earned} max={r.section_scores.thoroughness.max_points} />
        </div>
      </div>

      <hr className="border-zinc-800" />

      {/* Issue Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard value={r.issues.price_discrepancies} label="Price Mismatches" tone="danger" />
        <StatCard value={r.issues.capitalization_errors} label="Capitalization Errors" tone="warning" />
        <StatCard value={r.issues.modifier_issues} label="Modifier Issues" tone="warning" />
        <StatCard value={r.issues.duplicates} label="Duplicates" tone="info" />
        <StatCard value={r.issues.missing_items} label="Missing Items" tone="danger" />
        <StatCard value={r.issues.extra_items} label="Extra Items" tone="success" />
      </div>

      <hr className="border-zinc-800" />

      {/* Per-Item Grades Table */}
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10">
              <tr className="bg-zinc-800/50">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400">Item</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400">Category</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400">Score</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400">N</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400">O</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400">A</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400">T</th>
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
    </div>
  );
}
