import { useState } from 'react';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
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
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#00D632]/10">
          <Send className="h-8 w-8 text-[#00D632]" />
        </div>
        <h2 className="text-xl font-bold text-[#1A1A1A]">Feedback Sent</h2>
        <p className="text-sm text-[#4A4A4A]">Email delivered to {r.builder_email}</p>
        <p className="text-sm text-[#8A8A8A]">CC: {CC_EMAIL}</p>
        <button
          onClick={onClose}
          className="mt-4 rounded-full bg-[#006AFF] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0056CC] transition-colors"
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
          className="flex items-center gap-2 text-sm text-[#8A8A8A] hover:text-[#1A1A1A] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h1 className="text-lg font-semibold text-[#1A1A1A]">Preview Feedback Email</h1>
        <button
          disabled={sending}
          onClick={async () => {
            setSending(true);
            setError(null);
            try {
              const res = await fetch(`/api/v1/reports/${r.id}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ personal_notes: notes || null }),
              });
              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || `Server error (${res.status})`);
              }
              setSent(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to send feedback. Please try again.');
            } finally {
              setSending(false);
            }
          }}
          className="flex items-center gap-2 rounded-full bg-[#006AFF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0056CC] disabled:opacity-50 transition-colors"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {sending ? 'Sending...' : 'Send Feedback'}
        </button>
      </div>

      {/* Email details card */}
      <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="w-16 shrink-0 text-[#8A8A8A]">To:</span>
            <span className="text-[#1A1A1A]">{r.builder_name} ({r.builder_email})</span>
          </div>
          <div className="flex gap-2">
            <span className="w-16 shrink-0 text-[#8A8A8A]">CC:</span>
            <span className="text-[#1A1A1A]">{CC_EMAIL}</span>
          </div>
          <div className="flex gap-2">
            <span className="w-16 shrink-0 text-[#8A8A8A]">Reply-To:</span>
            <span className="text-[#1A1A1A]">{r.graded_by}</span>
          </div>
          <div className="flex gap-2">
            <span className="w-16 shrink-0 text-[#8A8A8A]">Subject:</span>
            <span className="font-medium text-[#1A1A1A]">
              Menu QA Report — {r.merchant_name} — Score: {r.overall_score}/100
            </span>
          </div>
        </div>
      </div>

      {/* Email body card */}
      <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
        <div className="space-y-5">
          <div className="space-y-2 text-sm text-[#4A4A4A]">
            <p>Hi {r.builder_name},</p>
            <p>Your menu build for <strong className="text-[#1A1A1A]">{r.merchant_name}</strong> has been reviewed.</p>
          </div>

          {/* Score summary */}
          <div className="flex items-center gap-4">
            <ScoreRing score={r.overall_score} size={64} />
            <div>
              <p className="text-lg font-bold text-[#1A1A1A]">
                Overall Score: {r.overall_score}/100 ({letterGrade(r.overall_score)})
              </p>
            </div>
          </div>

          {/* Section scores table */}
          <div className="overflow-hidden rounded-lg border border-[#E5E5E5]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[#F6F6F6]">
                  <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-[#8A8A8A]">Section</th>
                  <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-[#8A8A8A]">Score</th>
                  <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-[#8A8A8A]">Max</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((s) => (
                  <tr key={s.name}>
                    <td className="border-t border-[#E5E5E5] px-4 py-2.5 text-[#4A4A4A]">{s.name}</td>
                    <td className="border-t border-[#E5E5E5] px-4 py-2.5 tabular-nums text-[#1A1A1A]">{s.earned}</td>
                    <td className="border-t border-[#E5E5E5] px-4 py-2.5 tabular-nums text-[#8A8A8A]">{s.max}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top issues table */}
          {topIssues.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-[#1A1A1A]">Top Issues</h3>
              <div className="overflow-hidden rounded-lg border border-[#E5E5E5]">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-[#F6F6F6]">
                      <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-[#8A8A8A]">Item</th>
                      <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-[#8A8A8A]">Issue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topIssues.map((ti, idx) => (
                      <tr key={idx} className={issueRowColor(ti.issue)}>
                        <td className="border-t border-[#E5E5E5] px-4 py-2.5 text-[#4A4A4A]">{ti.item}</td>
                        <td className="border-t border-[#E5E5E5] px-4 py-2.5">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${issueBadgeColor(ti.issue)}`}>
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
            <h3 className="mb-2 text-sm font-semibold text-[#1A1A1A]">Recommendations</h3>
            <ol className="list-inside list-decimal space-y-1 text-sm text-[#4A4A4A]">
              {recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Personal notes */}
      <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
        <label className="mb-2 block text-sm font-semibold text-[#1A1A1A]">Personal Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Add any context or coaching notes for the builder..."
          className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder-[#8A8A8A] focus:border-[#006AFF] focus:ring-2 focus:ring-[#006AFF]/10 focus:outline-none transition-colors"
        />
        <p className="mt-1.5 text-xs text-[#8A8A8A]">
          These notes will be appended to the email above.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-[#E02B1D]/20 bg-[#E02B1D]/5 px-4 py-3 text-sm text-[#E02B1D]">
          {error}
        </div>
      )}
    </div>
  );
}

function issueRowColor(issue: string) {
  const lower = issue.toLowerCase();
  if (lower.includes('price') || lower.includes('missing')) return 'bg-[#E02B1D]/5';
  if (lower.includes('capital') || lower.includes('title case')) return 'bg-[#FF9500]/5';
  if (lower.includes('modifier') || lower.includes('variation')) return 'bg-[#FF9500]/5';
  if (lower.includes('duplicate')) return 'bg-[#006AFF]/5';
  return '';
}

function issueBadgeColor(issue: string) {
  const lower = issue.toLowerCase();
  if (lower.includes('price') || lower.includes('missing')) return 'bg-[#E02B1D]/10 text-[#E02B1D]';
  if (lower.includes('capital') || lower.includes('title case')) return 'bg-[#FF9500]/10 text-[#FF9500]';
  if (lower.includes('modifier') || lower.includes('variation')) return 'bg-[#FF9500]/10 text-[#FF9500]';
  if (lower.includes('duplicate')) return 'bg-[#006AFF]/10 text-[#006AFF]';
  return 'bg-[#F6F6F6] text-[#4A4A4A]';
}
