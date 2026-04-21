import { useState, useEffect } from 'react';
import { Plus, Trash2, Users, UserCheck, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/api/client';
import type { Builder, Grader } from '@/types';

type SubTab = 'builders' | 'graders';

const SUB_TABS: { key: SubTab; label: string; icon: typeof Users }[] = [
  { key: 'builders', label: 'Builders', icon: Users },
  { key: 'graders', label: 'Graders', icon: UserCheck },
];

const TEAMS = [
  { value: 'GT', label: 'GT Guatemala' },
  { value: 'MNL', label: 'MNL Manila' },
  { value: 'GSO', label: 'GSO Internal' },
  { value: 'EXT', label: 'External' },
];

const ROLES = [
  { value: 'grader', label: 'Grader' },
  { value: 'lead', label: 'Lead' },
  { value: 'admin', label: 'Admin' },
];

function teamLabel(team: string | null) {
  return TEAMS.find((t) => t.value === team)?.label ?? team ?? '—';
}

/* ─── Builders Tab ────────────────────────────────────────────────── */

function BuildersTab() {
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [team, setTeam] = useState('GT');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.builders.list().then((b) => { setBuilders(b); setLoading(false); });
  }, []);

  async function handleAdd() {
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    try {
      const created = await api.builders.create({ name: name.trim(), email: email.trim(), team });
      setBuilders((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setName('');
      setEmail('');
      setTeam('GT');
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await api.builders.delete(id);
    setBuilders((prev) => prev.filter((b) => b.id !== id));
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          {builders.length} builder{builders.length !== 1 ? 's' : ''} configured. These appear as dropdown options when grading.
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          Add Builder
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-200">New Builder</h3>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@company.com"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Team</label>
              <div className="relative">
                <select
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 pr-8 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none"
                >
                  {TEAMS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleAdd}
                disabled={saving || !name.trim() || !email.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-zinc-800/50">
              {['Name', 'Email', 'Team', 'Added', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {builders.map((b, i) => (
              <tr key={b.id} className={cn('border-t border-zinc-800/50', i % 2 === 1 && 'bg-zinc-900/50')}>
                <td className="px-4 py-3 font-medium text-zinc-200">{b.name}</td>
                <td className="px-4 py-3 text-zinc-400">{b.email}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
                    {teamLabel(b.team)}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs">
                  {new Date(b.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="rounded p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                    title="Remove builder"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {builders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500">
                  No builders configured yet. Click "Add Builder" to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Graders Tab ─────────────────────────────────────────────────── */

function GradersTab() {
  const [graders, setGraders] = useState<Grader[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [team, setTeam] = useState('GT');
  const [role, setRole] = useState('grader');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.graders.list().then((g) => { setGraders(g); setLoading(false); });
  }, []);

  async function handleAdd() {
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    try {
      const created = await api.graders.create({ name: name.trim(), email: email.trim(), team, role });
      setGraders((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setName('');
      setEmail('');
      setTeam('GT');
      setRole('grader');
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await api.graders.delete(id);
    setGraders((prev) => prev.filter((g) => g.id !== id));
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          {graders.length} grader{graders.length !== 1 ? 's' : ''} configured. These appear as the "Graded By" dropdown.
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          Add Grader
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-200">New Grader</h3>
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@company.com"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Team</label>
              <div className="relative">
                <select
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 pr-8 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none"
                >
                  {TEAMS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Role</label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 pr-8 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleAdd}
                disabled={saving || !name.trim() || !email.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-zinc-800/50">
              {['Name', 'Email', 'Team', 'Role', 'Added', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {graders.map((g, i) => (
              <tr key={g.id} className={cn('border-t border-zinc-800/50', i % 2 === 1 && 'bg-zinc-900/50')}>
                <td className="px-4 py-3 font-medium text-zinc-200">{g.name}</td>
                <td className="px-4 py-3 text-zinc-400">{g.email}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
                    {teamLabel(g.team)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-medium',
                    g.role === 'lead' ? 'bg-blue-500/10 text-blue-400' :
                    g.role === 'admin' ? 'bg-purple-500/10 text-purple-400' :
                    'bg-zinc-700/40 text-zinc-300',
                  )}>
                    {g.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs">
                  {new Date(g.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(g.id)}
                    className="rounded p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                    title="Remove grader"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {graders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-500">
                  No graders configured yet. Click "Add Grader" to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Main Settings Page ──────────────────────────────────────────── */

export default function Settings() {
  const [tab, setTab] = useState<SubTab>('builders');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
      <p className="text-sm text-zinc-400">
        Manage the builders and graders who appear in dropdown menus throughout the tool.
      </p>

      <div className="flex gap-2">
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition-colors',
              tab === t.key
                ? 'bg-zinc-100 font-medium text-zinc-900'
                : 'text-zinc-400 hover:text-zinc-200',
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'builders' && <BuildersTab />}
      {tab === 'graders' && <GradersTab />}
    </div>
  );
}
