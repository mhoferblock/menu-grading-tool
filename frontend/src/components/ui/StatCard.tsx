import { cn } from '@/lib/utils';

const toneStyles = {
  success: 'border-l-[#00D632]',
  warning: 'border-l-[#FF9500]',
  danger: 'border-l-[#E02B1D]',
  info: 'border-l-[#006AFF]',
} as const;

interface StatCardProps {
  value: string | number;
  label: string;
  tone?: keyof typeof toneStyles;
}

export default function StatCard({ value, label, tone }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm',
        tone && 'border-l-2',
        tone && toneStyles[tone],
      )}
    >
      <p className="text-2xl font-bold text-[#1A1A1A]">{value}</p>
      <p className="mt-1 text-sm text-[#8A8A8A]">{label}</p>
    </div>
  );
}
