import { useEffect, useRef } from 'react';

function scoreColor(score: number) {
  if (score >= 90) return '#00D632';
  if (score >= 80) return '#006AFF';
  if (score >= 70) return '#FF9500';
  return '#E02B1D';
}

interface ScoreRingProps {
  score: number;
  size?: number;
}

export default function ScoreRing({ score, size = 120 }: ScoreRingProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  const clamped = Math.max(0, Math.min(100, score));
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  useEffect(() => {
    const el = circleRef.current;
    if (!el) return;
    el.style.strokeDashoffset = String(circumference);
    requestAnimationFrame(() => {
      el.style.transition = 'stroke-dashoffset 0.8s ease-out';
      el.style.strokeDashoffset = String(offset);
    });
  }, [circumference, offset]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E5E5"
          strokeWidth={strokeWidth}
        />
        <circle
          ref={circleRef}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={scoreColor(clamped)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-[#1A1A1A]">{score}</span>
        <span className="text-xs text-[#8A8A8A]">/100</span>
      </div>
    </div>
  );
}
