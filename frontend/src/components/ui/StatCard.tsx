import { cn } from '@/lib/utils';

const toneStyles = {
  success: 'border-l-green-500',
  warning: 'border-l-amber-500',
  danger: 'border-l-red-500',
  info: 'border-l-blue-500',
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
        'rounded-lg border border-zinc-800 bg-zinc-900 p-5',
        tone && 'border-l-2',
        tone && toneStyles[tone],
      )}
    >
      <p className="text-2xl font-bold text-zinc-100">{value}</p>
      <p className="mt-1 text-sm text-zinc-400">{label}</p>
    </div>
  );
}
