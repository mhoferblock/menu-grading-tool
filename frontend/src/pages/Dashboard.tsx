import StatCard from '@/components/ui/StatCard';

const stats = [
  { value: 12, label: 'Menus Graded Today', tone: 'info' as const },
  { value: 81, label: 'Average Score', tone: 'warning' as const },
  { value: 3, label: 'Pending Review', tone: 'danger' as const },
  { value: 8, label: 'Feedback Sent', tone: 'success' as const },
];

const recentActivity = [
  { date: '2026-04-21', merchant: 'Bella Italia', builder: 'Maria S.', score: 92, status: 'Sent' },
  { date: '2026-04-21', merchant: 'Taco Loco', builder: 'James W.', score: 78, status: 'Pending' },
  { date: '2026-04-20', merchant: 'Sakura Sushi', builder: 'Li Chen', score: 85, status: 'Sent' },
  { date: '2026-04-20', merchant: 'Burger Barn', builder: 'Alex K.', score: 61, status: 'Draft' },
  { date: '2026-04-19', merchant: 'Café Mocha', builder: 'Sara J.', score: 94, status: 'Sent' },
];

function statusBadge(status: string) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';
  switch (status) {
    case 'Sent':
      return `${base} bg-[#00D632]/10 text-[#00D632]`;
    case 'Pending':
      return `${base} bg-[#FF9500]/10 text-[#FF9500]`;
    default:
      return `${base} bg-[#F6F6F6] text-[#8A8A8A]`;
  }
}

function scoreClass(score: number) {
  if (score >= 90) return 'text-[#00D632]';
  if (score >= 75) return 'text-[#FF9500]';
  if (score >= 60) return 'text-[#FF9500]';
  return 'text-[#E02B1D]';
}

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[#1A1A1A]">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Recent Activity */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-[#1A1A1A]">Recent Activity</h2>
        <div className="overflow-hidden rounded-xl border border-[#E5E5E5] shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#E5E5E5] bg-white">
              <tr>
                {['Date', 'Merchant', 'Builder', 'Score', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium text-[#8A8A8A]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {recentActivity.map((row, i) => (
                <tr key={i} className="transition-colors hover:bg-[#F6F6F6]">
                  <td className="px-4 py-3 text-[#8A8A8A]">{row.date}</td>
                  <td className="px-4 py-3 text-[#1A1A1A]">{row.merchant}</td>
                  <td className="px-4 py-3 text-[#4A4A4A]">{row.builder}</td>
                  <td className={`px-4 py-3 font-medium tabular-nums ${scoreClass(row.score)}`}>
                    {row.score}
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusBadge(row.status)}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
