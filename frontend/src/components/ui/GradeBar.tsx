function barColor(pct: number) {
  if (pct >= 90) return 'bg-[#00D632]';
  if (pct >= 75) return 'bg-[#FF9500]';
  if (pct >= 60) return 'bg-[#FF9500]';
  return 'bg-[#E02B1D]';
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
      <span className="w-28 shrink-0 text-sm text-[#4A4A4A]">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E5E5E5]">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-14 shrink-0 text-right text-sm tabular-nums text-[#8A8A8A]">
        {score}/{max}
      </span>
    </div>
  );
}
