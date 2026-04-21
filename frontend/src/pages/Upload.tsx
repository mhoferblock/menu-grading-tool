import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, ChevronDown } from 'lucide-react';
import { api } from '@/api/client';
import type { Builder, Grader } from '@/types';

const markets = ['US', 'EU', 'AU'] as const;

export default function Upload() {
  const navigate = useNavigate();
  const [catalogSource, setCatalogSource] = useState('square');
  const [merchantId, setMerchantId] = useState('');
  const [activeMarket, setActiveMarket] = useState<string>('US');
  const [catalogFile, setCatalogFile] = useState<File | null>(null);

  const [builders, setBuilders] = useState<Builder[]>([]);
  const [graders, setGraders] = useState<Grader[]>([]);
  const [selectedBuilderId, setSelectedBuilderId] = useState('');
  const [selectedGraderId, setSelectedGraderId] = useState('');

  useEffect(() => {
    api.builders.list().then(setBuilders);
    api.graders.list().then(setGraders);
  }, []);

  const selectedBuilder = builders.find((b) => b.id === selectedBuilderId);
  const selectedGrader = graders.find((g) => g.id === selectedGraderId);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <h1 className="text-2xl font-bold text-zinc-100">Upload &amp; Compare</h1>

      {/* Step 1 + Step 2 grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Menu Source */}
        <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
            <h2 className="text-sm font-semibold text-zinc-100">Menu Source</h2>
            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
              Step 1
            </span>
          </div>
          <div className="p-5">
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 py-12 text-center hover:border-zinc-600">
              <UploadIcon className="mb-3 h-10 w-10 text-zinc-500" />
              <p className="text-sm text-zinc-300">Drop PDF or image of physical menu</p>
              <label className="mt-4 cursor-pointer rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700">
                Browse Files
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" />
              </label>
              <p className="mt-3 text-xs text-zinc-500">
                Supports PDF, PNG, JPG. OCR + AI extraction for scanned menus.
              </p>
            </div>
          </div>
        </div>

        {/* Catalog Source */}
        <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
            <h2 className="text-sm font-semibold text-zinc-100">Catalog Source</h2>
            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
              Step 2
            </span>
          </div>
          <div className="space-y-4 p-5">
            <div className="relative">
              <select
                value={catalogSource}
                onChange={(e) => setCatalogSource(e.target.value)}
                className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 pr-8 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="square">Square Catalog (API)</option>
                <option value="excel">Excel Export Upload</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            </div>

            {catalogSource === 'square' ? (
              <>
                <input
                  type="text"
                  placeholder="Square Merchant ID..."
                  value={merchantId}
                  onChange={(e) => setMerchantId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                />

                <div className="flex gap-2">
                  {markets.map((m) => (
                    <button
                      key={m}
                      onClick={() => setActiveMarket(m)}
                      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                        activeMarket === m
                          ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => alert('Catalog fetch will connect to Square API once configured. Enter a Merchant ID above.')}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
                >
                  Fetch Catalog
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 py-10 text-center hover:border-zinc-600">
                <UploadIcon className="mb-3 h-8 w-8 text-zinc-500" />
                {catalogFile ? (
                  <>
                    <p className="text-sm font-medium text-emerald-400">{catalogFile.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {(catalogFile.size / 1024).toFixed(1)} KB
                    </p>
                    <button
                      onClick={() => setCatalogFile(null)}
                      className="mt-3 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-1.5 text-xs text-zinc-400 hover:bg-zinc-700"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-zinc-300">Upload catalog Excel export</p>
                    <label className="mt-3 cursor-pointer rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700">
                      Browse Files
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setCatalogFile(file);
                        }}
                      />
                    </label>
                    <p className="mt-2 text-xs text-zinc-500">
                      Supports .xlsx, .xls, .csv
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Builder & Grader Selection */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Builder */}
        <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
            <h2 className="text-sm font-semibold text-zinc-100">Builder</h2>
            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
              Step 3
            </span>
          </div>
          <div className="space-y-3 p-5">
            <p className="text-sm text-zinc-400">
              Who built this menu? Feedback will be emailed to them after grading.
            </p>
            <div className="relative">
              <select
                value={selectedBuilderId}
                onChange={(e) => setSelectedBuilderId(e.target.value)}
                className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 pr-8 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select a builder...</option>
                {builders.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} — {b.email} ({b.team})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            </div>
            {selectedBuilder && (
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-400">
                  {selectedBuilder.email}
                </span>
                <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-400">
                  Team: {selectedBuilder.team}
                </span>
              </div>
            )}
            {builders.length === 0 && (
              <p className="text-xs text-zinc-500">
                No builders configured.{' '}
                <a href="/settings" className="text-blue-400 hover:underline">Add builders in Settings</a>
              </p>
            )}
          </div>
        </div>

        {/* Grader */}
        <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
            <h2 className="text-sm font-semibold text-zinc-100">Graded By</h2>
            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
              Step 4
            </span>
          </div>
          <div className="space-y-3 p-5">
            <p className="text-sm text-zinc-400">
              Who is grading this menu?
            </p>
            <div className="relative">
              <select
                value={selectedGraderId}
                onChange={(e) => setSelectedGraderId(e.target.value)}
                className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 pr-8 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select a grader...</option>
                {graders.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} — {g.email} ({g.role})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            </div>
            {selectedGrader && (
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-400">
                  {selectedGrader.email}
                </span>
                <span className={`rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs ${
                  selectedGrader.role === 'lead' ? 'text-blue-400' : 'text-zinc-400'
                }`}>
                  {selectedGrader.role}
                </span>
              </div>
            )}
            {graders.length === 0 && (
              <p className="text-xs text-zinc-500">
                No graders configured.{' '}
                <a href="/settings" className="text-blue-400 hover:underline">Add graders in Settings</a>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Start Grading */}
      <div className="flex justify-end">
        <button
          onClick={() => navigate('/reports')}
          disabled={!selectedBuilderId}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Grading
        </button>
      </div>
    </div>
  );
}
