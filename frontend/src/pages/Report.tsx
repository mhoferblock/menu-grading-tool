import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileDown,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  DollarSign,
  Type,
  Layers,
  Copy,
  PackageMinus,
  PackagePlus,
} from 'lucide-react';
import ScoreRing from '@/components/ui/ScoreRing';
import FeedbackPreview from '@/components/feedback/FeedbackPreview';
import { api } from '@/api/client';
import type { GradingReport, ItemGrade, IssueEntry, IssueValue } from '@/types';

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

function getIssueList(val: IssueValue): IssueEntry[] {
  if (Array.isArray(val)) return val as IssueEntry[];
  return [];
}

function getIssueCount(val: IssueValue): number {
  if (Array.isArray(val)) return val.length;
  if (typeof val === 'number') return val;
  return 0;
}

const ISSUE_CONFIG = [
  { key: 'price_discrepancies', label: 'Price Mismatches', tone: 'danger' as const, icon: DollarSign, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  { key: 'capitalization_errors', label: 'Capitalization Errors', tone: 'warning' as const, icon: Type, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { key: 'modifier_issues', label: 'Modifier Issues', tone: 'warning' as const, icon: Layers, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { key: 'duplicates', label: 'Duplicates', tone: 'info' as const, icon: Copy, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { key: 'missing_items', label: 'Missing Items', tone: 'danger' as const, icon: PackageMinus, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  { key: 'extra_items', label: 'Extra Items', tone: 'success' as const, icon: PackagePlus, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
] as const;

const SECTION_CONFIG = [
  { key: 'neatness' as const, label: 'Neatness', weight: '10%', description: 'Capitalization, spelling, formatting, descriptions' },
  { key: 'organization' as const, label: 'Organization', weight: '30%', description: 'Categories, modifiers, variations, item grouping' },
  { key: 'accuracy' as const, label: 'Accuracy', weight: '40%', description: 'Prices, item names, descriptions matching source' },
  { key: 'thoroughness' as const, label: 'Thoroughness', weight: '20%', description: 'Completeness, all items present, special requests' },
] as const;

const toneStyles = {
  success: 'border-l-green-500',
  warning: 'border-l-amber-500',
  danger: 'border-l-red-500',
  info: 'border-l-blue-500',
};

export default function Report() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<GradingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [expandedIssues, setExpandedIssues] = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const issueRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  if (showFeedback) {
    return <FeedbackPreview report={r} onClose={() => setShowFeedback(false)} />;
  }

  const scrollToIssue = (key: string) => {
    setExpandedIssues((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      issueRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const scrollToSection = (key: string) => {
    setActiveSection(key);
    setTimeout(() => {
      sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const toggleIssue = (key: string) => {
    setExpandedIssues((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const itemsForSection = (sectionKey: string): ItemGrade[] => {
    return r.item_grades
      .filter((item) => {
        const score = item[sectionKey as keyof ItemGrade] as number;
        return typeof score === 'number' && score < 90;
      })
      .sort((a, b) => {
        const sa = a[sectionKey as keyof ItemGrade] as number;
        const sb = b[sectionKey as keyof ItemGrade] as number;
        return sa - sb;
      });
  };

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
            onClick={async () => {
              try {
                await api.reports.downloadPdf(r.id, r.merchant_name);
              } catch {
                alert('Failed to generate PDF. Please try again.');
              }
            }}
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

      {/* Score + Section Scores */}
      <div className="grid items-center gap-6 md:grid-cols-[1fr_2fr]">
        <div className="flex flex-col items-center gap-3">
          <ScoreRing score={r.overall_score} size={120} />
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${scoreLabelColor(r.overall_score)}`}>
            {scoreLabel(r.overall_score)}
          </span>
        </div>
        <div className="space-y-3">
          {SECTION_CONFIG.map(({ key, label, weight }) => {
            const sec = r.section_scores[key];
            if (!sec) return null;
            const pct = sec.max_points > 0 ? (sec.earned / sec.max_points) * 100 : 0;
            return (
              <button
                key={key}
                onClick={() => scrollToSection(key)}
                className="group flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-zinc-800/50"
              >
                <span className="w-28 shrink-0 text-sm text-zinc-300 group-hover:text-zinc-100">
                  {label}
                  <span className="ml-1 text-[10px] text-zinc-500">({weight})</span>
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      pct >= 90 ? 'bg-green-500' : pct >= 75 ? 'bg-amber-500' : pct >= 60 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <span className="w-14 shrink-0 text-right text-sm tabular-nums text-zinc-400">
                  {sec.earned}/{sec.max_points}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-zinc-600 transition-colors group-hover:text-zinc-400" />
              </button>
            );
          })}
        </div>
      </div>

      <hr className="border-zinc-800" />

      {/* Issue Stats — clickable cards */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Issues Found
          <span className="ml-2 text-xs font-normal text-zinc-500">(click to view details)</span>
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {ISSUE_CONFIG.map(({ key, label, tone, icon: Icon }) => {
            const count = getIssueCount(r.issues[key]);
            return (
              <button
                key={key}
                onClick={() => count > 0 && scrollToIssue(key)}
                disabled={count === 0}
                className={`rounded-lg border border-zinc-800 bg-zinc-900 p-5 text-left transition-all border-l-2 ${
                  toneStyles[tone]
                } ${count > 0 ? 'cursor-pointer hover:border-zinc-700 hover:bg-zinc-800/80' : 'opacity-60'}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-zinc-100">{count}</p>
                  {count > 0 && <Icon className="h-4 w-4 text-zinc-500" />}
                </div>
                <p className="mt-1 text-sm text-zinc-400">{label}</p>
                {count > 0 && (
                  <p className="mt-1 text-xs text-zinc-600">Click to see all {count} items</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Issue Detail Sections */}
      {ISSUE_CONFIG.map(({ key, label, icon: Icon, color, bg, border }) => {
        const items = getIssueList(r.issues[key]);
        if (items.length === 0) return null;
        const isExpanded = expandedIssues[key];
        return (
          <div
            key={key}
            ref={(el) => { issueRefs.current[key] = el; }}
            className={`overflow-hidden rounded-lg border ${border} ${bg} transition-all`}
          >
            <button
              onClick={() => toggleIssue(key)}
              className="flex w-full items-center justify-between px-5 py-4 text-left"
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${color}`} />
                <span className="font-semibold text-zinc-100">{label}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color} ${bg}`}>
                  {items.length}
                </span>
              </div>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-zinc-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              )}
            </button>
            {isExpanded && (
              <div className="border-t border-zinc-800/50 px-5 pb-4">
                <table className="mt-3 w-full text-left">
                  <thead>
                    <tr>
                      <th className="pb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Item</th>
                      <th className="pb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((entry, i) => (
                      <tr key={i} className={i % 2 === 1 ? 'bg-zinc-900/30' : ''}>
                        <td className="border-t border-zinc-800/30 py-2 pr-4 text-sm font-medium text-zinc-200">
                          {typeof entry === 'object' ? entry.item || '—' : String(entry)}
                        </td>
                        <td className="border-t border-zinc-800/30 py-2 text-sm text-zinc-400">
                          {typeof entry === 'object' ? entry.detail || '—' : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      <hr className="border-zinc-800" />

      {/* Section Breakdowns */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Section Breakdowns
        </h2>
        <div className="space-y-4">
          {SECTION_CONFIG.map(({ key, label, weight, description }) => {
            const sec = r.section_scores[key];
            if (!sec) return null;
            const pct = sec.max_points > 0 ? Math.round((sec.earned / sec.max_points) * 100) : 0;
            const isActive = activeSection === key;
            const flaggedItems = itemsForSection(key);
            return (
              <div
                key={key}
                ref={(el) => { sectionRefs.current[key] = el; }}
                className={`overflow-hidden rounded-lg border transition-all ${
                  isActive ? 'border-zinc-600 bg-zinc-900' : 'border-zinc-800 bg-zinc-900'
                }`}
              >
                <button
                  onClick={() => setActiveSection(isActive ? null : key)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-zinc-800/50"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${
                        pct >= 90
                          ? 'bg-green-500/20 text-green-400'
                          : pct >= 75
                          ? 'bg-amber-500/20 text-amber-400'
                          : pct >= 60
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {pct}%
                    </div>
                    <div>
                      <span className="font-semibold text-zinc-100">
                        {label}
                        <span className="ml-2 text-xs font-normal text-zinc-500">({weight} of total)</span>
                      </span>
                      <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm tabular-nums text-zinc-400">{sec.earned}/{sec.max_points} pts</span>
                    {flaggedItems.length > 0 && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                        <AlertTriangle className="h-3 w-3" />
                        {flaggedItems.length} items flagged
                      </span>
                    )}
                    {isActive ? (
                      <ChevronDown className="h-4 w-4 text-zinc-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-zinc-500" />
                    )}
                  </div>
                </button>
                {isActive && (
                  <div className="border-t border-zinc-800 px-5 pb-5">
                    {flaggedItems.length > 0 ? (
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-zinc-800/30">
                              <th className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Item</th>
                              <th className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Category</th>
                              <th className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-zinc-500">{label} Score</th>
                              <th className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Overall</th>
                              <th className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Issues</th>
                            </tr>
                          </thead>
                          <tbody>
                            {flaggedItems.map((item, idx) => {
                              const dimScore = item[key as keyof ItemGrade] as number;
                              return (
                                <tr key={item.item_name} className={idx % 2 === 1 ? 'bg-zinc-900/50' : ''}>
                                  <td className="border-t border-zinc-800/30 px-3 py-2.5 text-sm font-medium text-zinc-200">
                                    {item.item_name}
                                  </td>
                                  <td className="border-t border-zinc-800/30 px-3 py-2.5 text-sm text-zinc-400">
                                    {item.category_name}
                                  </td>
                                  <td className={`border-t border-zinc-800/30 px-3 py-2.5 text-sm font-semibold tabular-nums ${scoreBadge(dimScore)}`}>
                                    {dimScore}%
                                  </td>
                                  <td className={`border-t border-zinc-800/30 px-3 py-2.5 text-sm tabular-nums ${scoreBadge(item.overall_score)}`}>
                                    {item.overall_score}%
                                  </td>
                                  <td className="border-t border-zinc-800/30 px-3 py-2.5 text-sm text-zinc-400">
                                    {item.issues.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {item.issues.map((issue, i) => (
                                          <span key={i} className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400">
                                            {issue}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-zinc-600">—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="mt-3 rounded-lg bg-green-500/5 p-4 text-center">
                        <p className="text-sm text-green-400">All items scored 90%+ for {label.toLowerCase()}.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <hr className="border-zinc-800" />

      {/* Full Per-Item Grades Table */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          All Item Grades ({r.item_grades.length} items)
        </h2>
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
    </div>
  );
}
