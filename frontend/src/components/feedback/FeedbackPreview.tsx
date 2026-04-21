import { useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import ScoreRing from '@/components/ui/ScoreRing';
import type { GradingReport } from '@/types';

interface FeedbackPreviewProps {
  report: GradingReport;
  onClose: () => void;
}

function letterGrade(score: number) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

const CC_EMAIL = 'menugradingtoolresponses@squareup.com';

export default function FeedbackPreview({ report, onClose }: FeedbackPreviewProps) {
  const [sent, setSent] = useState(false);
  const [notes, setNotes] = useState('');

  const r = report;

  const sections = [
    { name: 'Neatness', earned: r.section_scores.neatness.earned, max: r.section_scores.neatness.max_points },
    { name: 'Organization', earned: r.section_scores.organization.earned, max: r.section_scores.organization.max_points },
    { name: 'Accuracy', earned: r.section_scores.accuracy.earned, max: r.section_scores.accuracy.max_points },
    { name: 'Thoroughness', earned: r.section_scores.thoroughness.earned, max: r.section_scores.thoroughness.max_points },
  ];

  const topIssues = r.item_grades
    .flatMap((item) => item.issues.map((issue) => ({ item: item.item_name, issue })))
    .slice(0, 8);

  const recommendations = [
    'Review capitalization standards — ensure every item follows Title Case.',
    'Double-check prices against the Square catalog before finalizing.',
    'Audit modifier groups for consistency and completeness.',
    'Remove duplicate items before submission.',
  ];

  if (sent) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
          <Send className="h-8 w-8 text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-zinc-100">Feedback Sent</h2>
        <p className="text-sm text-zinc-400">Email delivered to {r.builder_email}</p>
        <p className="text-sm text-zinc-500">CC: {CC_EMAIL}</p>
        <button
          onClick={onClose}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Back to Report
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h1 className="text-lg font-semibold text-zinc-100">Preview Feedback Email</h1>
        <button
          onClick={() => setSent(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          <Send className="h-4 w-4" />
          Send Feedback
        </button>
      </div>

      {/* Email details card */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="w-16 shrink-0 text-zinc-500">To:</span>
            <span className="text-zinc-200">{r.builder_name} ({r.builder_email})</span>
          </div>
          <div className="flex gap-2">
            <span className="w-16 shrink-0 text-zinc-500">CC:</span>
            <span className="text-zinc-200">{CC_EMAIL}</span>
          </div>
          <div className="flex gap-2">
            <span className="w-16 shrink-0 text-zinc-500">Reply-To:</span>
            <span className="text-zinc-200">{r.graded_by}</span>
          </div>
          <div className="flex gap-2">
            <span className="w-16 shrink-0 text-zinc-500">Subject:</span>
            <span className="font-medium text-zinc-200">
              Menu QA Report — {r.merchant_name} — Score: {r.overall_score}/100
            </span>
          </div>
        </div>
      </div>

      {/* Email body card */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <div className="space-y-5">
          <div className="space-y-2 text-sm text-zinc-300">
            <p>Hi {r.builder_name},</p>
            <p>Your menu build for <strong className="text-zinc-100">{r.merchant_name}</strong> has been reviewed.</p>
          </div>

          {/* Score summary */}
          <div className="flex items-center gap-4">
            <ScoreRing score={r.overall_score} size={64} />
            <div>
              <p className="text-lg font-bold text-zinc-100">
                Overall Score: {r.overall_score}/100 ({letterGrade(r.overall_score)})
              </p>
            </div>
          </div>

          {/* Section scores table */}
          <div className="overflow-hidden rounded-lg border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-zinc-800/50">
                  <th className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-zinc-400">Section</th>
                  <th className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-zinc-400">Score</th>
                  <th className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-zinc-400">Max</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((s) => (
                  <tr key={s.name}>
                    <td className="border-t border-zinc-800/50 px-4 py-2 text-zinc-300">{s.name}</td>
                    <td className="border-t border-zinc-800/50 px-4 py-2 tabular-nums text-zinc-200">{s.earned}</td>
                    <td className="border-t border-zinc-800/50 px-4 py-2 tabular-nums text-zinc-400">{s.max}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top issues table */}
          {topIssues.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-zinc-200">Top Issues</h3>
              <div className="overflow-hidden rounded-lg border border-zinc-800">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-zinc-800/50">
                      <th className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-zinc-400">Item</th>
                      <th className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-zinc-400">Issue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topIssues.map((ti, idx) => (
                      <tr key={idx} className={issueRowColor(ti.issue)}>
                        <td className="border-t border-zinc-800/50 px-4 py-2 text-zinc-300">{ti.item}</td>
                        <td className="border-t border-zinc-800/50 px-4 py-2">
                          <span className={`rounded px-1.5 py-0.5 text-xs ${issueBadgeColor(ti.issue)}`}>
                            {ti.issue}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-zinc-200">Recommendations</h3>
            <ol className="list-inside list-decimal space-y-1 text-sm text-zinc-400">
              {recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Personal notes */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <label className="mb-2 block text-sm font-semibold text-zinc-200">Personal Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Add any context or coaching notes for the builder..."
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
        />
        <p className="mt-1.5 text-xs text-zinc-500">
          These notes will be appended to the email above.
        </p>
      </div>
    </div>
  );
}

function issueRowColor(issue: string) {
  switch (issue) {
    case 'price': return 'bg-red-500/5';
    case 'capitalization': return 'bg-amber-500/5';
    case 'modifier': return 'bg-amber-500/5';
    case 'duplicate': return 'bg-blue-500/5';
    case 'missing': return 'bg-red-500/5';
    default: return '';
  }
}

function issueBadgeColor(issue: string) {
  switch (issue) {
    case 'price': return 'bg-red-500/20 text-red-400';
    case 'capitalization': return 'bg-amber-500/20 text-amber-400';
    case 'modifier': return 'bg-amber-500/20 text-amber-400';
    case 'duplicate': return 'bg-blue-500/20 text-blue-400';
    case 'missing': return 'bg-red-500/20 text-red-400';
    default: return 'bg-zinc-700 text-zinc-400';
  }
}
