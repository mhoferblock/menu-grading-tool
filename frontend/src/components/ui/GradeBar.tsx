function barColor(pct: number) {
  if (pct >= 90) return 'bg-green-500';
  if (pct >= 75) return 'bg-amber-500';
  if (pct >= 60) return 'bg-orange-500';
  return 'bg-red-500';
}

interface GradeBarProps {
  label: string;
  score: number;
  max: number;
}

export default function GradeBar({ label, score, max }: GradeBarProps) {
  const pct = Math.min(100, max > 0 ? (score / max) * 100 : 0);

  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-sm text-zinc-300">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-14 shrink-0 text-right text-sm tabular-nums text-zinc-400">
        {score}/{max}
      </span>
    </div>
  );
}
