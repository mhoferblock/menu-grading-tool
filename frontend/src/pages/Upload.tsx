import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload as UploadIcon,
  ChevronDown,
  CheckCircle2,
  Loader2,
  X,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/api/client';
import type { Builder, Grader } from '@/types';

interface UploadResult {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  page_count: number;
  status: string;
}

interface CatalogResult {
  filename?: string;
  item_count: number;
  items: { name: string; price?: number; category?: string; description?: string }[];
}

export default function Upload() {
  const navigate = useNavigate();

  const [merchantName, setMerchantName] = useState('');
  const [market, setMarket] = useState('US');
  const [catalogFile, setCatalogFile] = useState<File | null>(null);

  const [menuFile, setMenuFile] = useState<File | null>(null);
  const [menuUploading, setMenuUploading] = useState(false);
  const [menuResult, setMenuResult] = useState<UploadResult | null>(null);
  const [menuError, setMenuError] = useState('');

  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogResult, setCatalogResult] = useState<CatalogResult | null>(null);
  const [catalogError, setCatalogError] = useState('');

  const [builders, setBuilders] = useState<Builder[]>([]);
  const [graders, setGraders] = useState<Grader[]>([]);
  const [selectedBuilderId, setSelectedBuilderId] = useState('');
  const [selectedGraderId, setSelectedGraderId] = useState('');

  const [grading, setGrading] = useState(false);
  const [gradingError, setGradingError] = useState('');

  useEffect(() => {
    api.builders.list().then(setBuilders);
    api.graders.list().then(setGraders);
  }, []);

  const selectedBuilder = builders.find((b) => b.id === selectedBuilderId);
  const selectedGrader = graders.find((g) => g.id === selectedGraderId);

  const handleMenuUpload = useCallback(async (file: File) => {
    setMenuFile(file);
    setMenuUploading(true);
    setMenuError('');
    setMenuResult(null);
    try {
      const result = await api.uploads.menu(file);
      setMenuResult(result);
    } catch (e: unknown) {
      setMenuError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setMenuUploading(false);
    }
  }, []);

  const handleCatalogUpload = useCallback(async (file: File) => {
    setCatalogFile(file);
    setCatalogLoading(true);
    setCatalogError('');
    setCatalogResult(null);
    try {
      const result = await api.catalog.upload(file);
      setCatalogResult(result);
    } catch (e: unknown) {
      setCatalogError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  const clearMenu = () => {
    setMenuFile(null);
    setMenuResult(null);
    setMenuError('');
  };

  const clearCatalog = () => {
    setCatalogFile(null);
    setCatalogResult(null);
    setCatalogError('');
  };

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
            {menuResult ? (
              <div className="flex flex-col items-center rounded-lg border-2 border-emerald-500/30 bg-emerald-500/5 py-8 text-center">
                <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-400" />
                <p className="text-sm font-medium text-emerald-400">{menuResult.filename}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {(menuResult.file_size / 1024).toFixed(1)} KB
                  {menuResult.page_count > 0 && ` · ${menuResult.page_count} page(s)`}
                </p>
                <p className="mt-2 text-xs text-zinc-400">Uploaded successfully</p>
                <button
                  onClick={clearMenu}
                  className="mt-3 flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-700"
                >
                  <X className="h-3 w-3" /> Remove
                </button>
              </div>
            ) : menuUploading ? (
              <div className="flex flex-col items-center rounded-lg border-2 border-dashed border-blue-500/30 py-12 text-center">
                <Loader2 className="mb-3 h-10 w-10 animate-spin text-blue-400" />
                <p className="text-sm text-zinc-300">Uploading {menuFile?.name}...</p>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 py-12 text-center hover:border-zinc-600"
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleMenuUpload(file);
                }}
              >
                <UploadIcon className="mb-3 h-10 w-10 text-zinc-500" />
                <p className="text-sm text-zinc-300">Drop PDF or image of physical menu</p>
                <label className="mt-4 cursor-pointer rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700">
                  Browse Files
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleMenuUpload(file);
                    }}
                  />
                </label>
                <p className="mt-3 text-xs text-zinc-500">
                  Supports PDF, PNG, JPG. OCR + AI extraction for scanned menus.
                </p>
                {menuError && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-red-400">
                    <AlertCircle className="h-3.5 w-3.5" /> {menuError}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Catalog Source */}
        <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
            <h2 className="text-sm font-semibold text-zinc-100">Catalog Export</h2>
            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
              Step 2
            </span>
          </div>
          <div className="space-y-4 p-5">
            {catalogResult ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400">
                      {catalogResult.item_count} items loaded
                    </span>
                  </div>
                  <button
                    onClick={clearCatalog}
                    className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {catalogResult.items.length > 0 && (
                  <div className="mt-3 max-h-48 space-y-1 overflow-y-auto pr-1">
                    {catalogResult.items.slice(0, 20).map((item, i) => (
                      <div key={i} className="flex items-center justify-between rounded bg-zinc-900/50 px-2.5 py-1.5 text-xs">
                        <span className="text-zinc-300">{item.name}</span>
                        {item.price != null && (
                          <span className="text-zinc-500">${item.price.toFixed(2)}</span>
                        )}
                      </div>
                    ))}
                    {catalogResult.items.length > 20 && (
                      <p className="px-2 pt-1 text-xs text-zinc-500">
                        + {catalogResult.items.length - 20} more items
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 py-10 text-center hover:border-zinc-600"
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleCatalogUpload(file);
                }}
              >
                {catalogLoading ? (
                  <>
                    <Loader2 className="mb-3 h-8 w-8 animate-spin text-blue-400" />
                    <p className="text-sm text-zinc-300">Parsing {catalogFile?.name}...</p>
                  </>
                ) : (
                  <>
                    <UploadIcon className="mb-3 h-8 w-8 text-zinc-500" />
                    <p className="text-sm text-zinc-300">Upload Square catalog export</p>
                    <label className="mt-3 cursor-pointer rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700">
                      Browse Files
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCatalogUpload(file);
                        }}
                      />
                    </label>
                    <p className="mt-2 text-xs text-zinc-500">
                      Export from Square Dashboard as .xlsx, .xls, or .csv
                    </p>
                  </>
                )}
              </div>
            )}

            {catalogError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-400">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{catalogError}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Merchant Info + Builder + Grader */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Merchant Info */}
        <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
            <h2 className="text-sm font-semibold text-zinc-100">Merchant Info</h2>
            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
              Step 3
            </span>
          </div>
          <div className="space-y-3 p-5">
            <input
              type="text"
              placeholder="Merchant / Restaurant Name..."
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
            />
            <div className="flex gap-2">
              {(['US', 'EU', 'AU'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMarket(m)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    market === m
                      ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400'
                      : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Builder */}
        <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
            <h2 className="text-sm font-semibold text-zinc-100">Builder</h2>
            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
              Step 4
            </span>
          </div>
          <div className="space-y-3 p-5">
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
      </div>

      {/* Grader + Start Grading */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
            <h2 className="text-sm font-semibold text-zinc-100">Graded By</h2>
            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
              Step 5
            </span>
          </div>
          <div className="space-y-3 p-5">
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

        {/* Start Grading Action */}
        <div className="flex flex-col justify-end gap-3">
          {gradingError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-400">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{gradingError}</span>
            </div>
          )}
          <button
            onClick={async () => {
              if (!selectedBuilder || !merchantName.trim()) return;
              setGrading(true);
              setGradingError('');
              try {
                const items = catalogResult?.items ?? [];
                const itemGrades = items.map((item) => ({
                  item_name: item.name,
                  category_name: item.category || 'Uncategorized',
                  overall_score: 80,
                  neatness: 8,
                  organization: 24,
                  accuracy: 32,
                  thoroughness: 16,
                  issues: [],
                }));
                const report = await api.reports.create({
                  merchant_name: merchantName.trim(),
                  market,
                  builder_name: selectedBuilder.name,
                  builder_email: selectedBuilder.email,
                  builder_team: selectedBuilder.team || '',
                  builder_id: selectedBuilder.id,
                  item_grades: itemGrades,
                  feedback_notes: '',
                });
                navigate(`/reports/${report.id}`);
              } catch (e: unknown) {
                setGradingError(e instanceof Error ? e.message : 'Failed to create report');
              } finally {
                setGrading(false);
              }
            }}
            disabled={!selectedBuilderId || !merchantName.trim() || grading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {grading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Creating Report...
              </>
            ) : (
              'Start Grading'
            )}
          </button>
          {(!merchantName.trim() || !selectedBuilderId) && (
            <p className="text-center text-xs text-zinc-500">
              {!merchantName.trim() ? 'Enter a merchant name' : 'Select a builder'} to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
