import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload as UploadIcon,
  ChevronDown,
  CheckCircle2,
  Loader2,
  X,
  AlertCircle,
  CheckCircle,
  Globe,
  FileUp,
} from 'lucide-react';
import { api } from '@/api/client';
import type { Builder, Grader } from '@/types';

const GRADING_PHASES = [
  { label: 'Analyzing neatness', detail: 'Checking capitalization, spelling, formatting (3 passes)' },
  { label: 'Checking organization', detail: 'Validating variations, modifiers, categories (3 passes)' },
  { label: 'Verifying accuracy', detail: 'Matching prices, checking auto-add rules, finding duplicates (3 passes)' },
  { label: 'Evaluating thoroughness', detail: 'Assessing completeness, special requests, missing items (3 passes)' },
  { label: 'Merging results', detail: 'Computing median scores, deduplicating issues, assigning confidence' },
  { label: 'Finalizing report', detail: 'Creating grading report with multipass consensus' },
];

function GradingProgress({ phase }: { phase: number }) {
  return (
    <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 space-y-2.5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Loader2 className="h-4 w-4 animate-spin text-[#006AFF]" />
        <span className="text-xs font-medium text-[#006AFF]">
          4 agents x 3 passes = 12 parallel analyses
        </span>
      </div>
      {GRADING_PHASES.map((p, i) => {
        const isDone = i < phase;
        const isActive = i === phase;
        return (
          <div key={i} className="flex items-start gap-2.5">
            {isDone ? (
              <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#00D632]" />
            ) : isActive ? (
              <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-[#006AFF]" />
            ) : (
              <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border border-[#E5E5E5]" />
            )}
            <div>
              <p className={`text-xs font-medium ${isDone ? 'text-[#00D632]' : isActive ? 'text-[#1A1A1A]' : 'text-[#8A8A8A]'}`}>
                {p.label}
              </p>
              {isActive && (
                <p className="text-[10px] text-[#8A8A8A] mt-0.5">{p.detail}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

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

  const [menuFiles, setMenuFiles] = useState<File[]>([]);
  const [menuUploading, setMenuUploading] = useState(false);
  const [menuResult, setMenuResult] = useState<UploadResult | null>(null);
  const [menuError, setMenuError] = useState('');
  const [menuSourceMode, setMenuSourceMode] = useState<'file' | 'url'>('file');
  const [menuUrl, setMenuUrl] = useState('');

  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogResult, setCatalogResult] = useState<CatalogResult | null>(null);
  const [catalogError, setCatalogError] = useState('');

  const [builders, setBuilders] = useState<Builder[]>([]);
  const [graders, setGraders] = useState<Grader[]>([]);
  const [selectedBuilderId, setSelectedBuilderId] = useState('');
  const [selectedGraderId, setSelectedGraderId] = useState('');

  const [specialRequests, setSpecialRequests] = useState('');
  const [grading, setGrading] = useState(false);
  const [gradingError, setGradingError] = useState('');
  const [gradingPhase, setGradingPhase] = useState(0);

  useEffect(() => {
    api.builders.list().then(setBuilders);
    api.graders.list().then(setGraders);
  }, []);

  const selectedBuilder = builders.find((b) => b.id === selectedBuilderId);
  const selectedGrader = graders.find((g) => g.id === selectedGraderId);

  const handleMenuUpload = useCallback(async (files: File[]) => {
    setMenuFiles(files);
    setMenuUploading(true);
    setMenuError('');
    setMenuResult(null);
    try {
      const result = await api.uploads.menu(files);
      setMenuResult(result);
    } catch (e: unknown) {
      setMenuError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setMenuUploading(false);
    }
  }, []);

  const handleMenuUrlFetch = useCallback(async () => {
    if (!menuUrl.trim()) return;
    setMenuUploading(true);
    setMenuError('');
    setMenuResult(null);
    try {
      const result = await api.uploads.menuUrl(menuUrl.trim());
      setMenuResult(result);
    } catch (e: unknown) {
      setMenuError(e instanceof Error ? e.message : 'Failed to fetch URL');
    } finally {
      setMenuUploading(false);
    }
  }, [menuUrl]);

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
    setMenuFiles([]);
    setMenuResult(null);
    setMenuError('');
    setMenuUrl('');
  };

  const clearCatalog = () => {
    setCatalogFile(null);
    setCatalogResult(null);
    setCatalogError('');
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <h1 className="text-2xl font-bold text-[#1A1A1A]">Upload &amp; Compare</h1>

      {/* Step 1 + Step 2 grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Menu Source */}
        <div className="overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] px-5 py-3">
            <h2 className="text-sm font-semibold text-[#1A1A1A]">Menu Source</h2>
            <span className="rounded-full bg-[#006AFF]/10 px-2 py-0.5 text-xs font-medium text-[#006AFF]">
              Step 1
            </span>
          </div>
          <div className="p-5">
            {menuResult ? (
              <div className="flex flex-col items-center rounded-xl border-2 border-[#00D632]/30 bg-[#00D632]/10 py-8 text-center">
                <CheckCircle2 className="mb-3 h-10 w-10 text-[#00D632]" />
                <p className="text-sm font-medium text-[#00D632]">{menuResult.filename}</p>
                <p className="mt-1 text-xs text-[#8A8A8A]">
                  {(menuResult.file_size / 1024).toFixed(1)} KB
                  {menuResult.page_count > 0 && ` · ${menuResult.page_count} page(s)`}
                  {(menuResult as UploadResult & { file_count?: number }).file_count && (menuResult as UploadResult & { file_count?: number }).file_count! > 1 && ` · ${(menuResult as UploadResult & { file_count?: number }).file_count} files`}
                </p>
                <p className="mt-2 text-xs text-[#8A8A8A]">Uploaded successfully</p>
                <button
                  onClick={clearMenu}
                  className="mt-3 flex items-center gap-1 rounded-lg border border-[#E5E5E5] bg-[#F6F6F6] px-3 py-1.5 text-xs text-[#8A8A8A] hover:bg-[#E5E5E5]"
                >
                  <X className="h-3 w-3" /> Remove
                </button>
              </div>
            ) : menuUploading ? (
              <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-[#006AFF]/30 py-12 text-center">
                <Loader2 className="mb-3 h-10 w-10 animate-spin text-[#006AFF]" />
                <p className="text-sm text-[#4A4A4A]">
                  {menuSourceMode === 'url' ? 'Fetching website...' : `Uploading ${menuFiles.length > 1 ? `${menuFiles.length} files` : menuFiles[0]?.name}...`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Tab toggle: File vs URL */}
                <div className="flex gap-1 rounded-lg bg-[#F6F6F6] p-1">
                  <button
                    onClick={() => setMenuSourceMode('file')}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      menuSourceMode === 'file' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#8A8A8A] hover:text-[#4A4A4A]'
                    }`}
                  >
                    <FileUp className="h-3.5 w-3.5" /> Upload Files
                  </button>
                  <button
                    onClick={() => setMenuSourceMode('url')}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      menuSourceMode === 'url' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#8A8A8A] hover:text-[#4A4A4A]'
                    }`}
                  >
                    <Globe className="h-3.5 w-3.5" /> Website URL
                  </button>
                </div>

                {menuSourceMode === 'file' ? (
                  <div
                    className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E5E5E5] py-10 text-center hover:border-[#006AFF]/30 transition-colors"
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const files = Array.from(e.dataTransfer.files || []);
                      if (files.length) handleMenuUpload(files);
                    }}
                  >
                    <UploadIcon className="mb-3 h-10 w-10 text-[#8A8A8A]" />
                    <p className="text-sm text-[#4A4A4A]">Drop PDF or images of the menu</p>
                    <p className="mt-1 text-xs text-[#8A8A8A]">Multiple files supported for multi-page menus</p>
                    <label className="mt-4 cursor-pointer rounded-lg border border-[#E5E5E5] bg-[#F6F6F6] px-4 py-2 text-sm font-medium text-[#4A4A4A] hover:bg-[#E5E5E5] transition-colors">
                      Browse Files
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length) handleMenuUpload(files);
                        }}
                      />
                    </label>
                    <p className="mt-3 text-xs text-[#8A8A8A]">
                      PDF, PNG, JPG — up to 10 files, 25 MB each
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://restaurant.com/menu"
                        value={menuUrl}
                        onChange={(e) => setMenuUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleMenuUrlFetch()}
                        className="flex-1 rounded-lg border border-[#E5E5E5] bg-[#F6F6F6] px-3 py-2 text-sm text-[#1A1A1A] placeholder-[#8A8A8A] focus:border-[#006AFF] focus:ring-2 focus:ring-[#006AFF]/10 focus:outline-none"
                      />
                      <button
                        onClick={handleMenuUrlFetch}
                        disabled={!menuUrl.trim()}
                        className="rounded-lg bg-[#006AFF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0056CC] disabled:opacity-50 transition-colors"
                      >
                        Fetch
                      </button>
                    </div>
                    <p className="text-xs text-[#8A8A8A]">
                      Paste a link to the restaurant's online menu. We'll fetch and analyze the page.
                    </p>
                  </div>
                )}

                {menuError && (
                  <div className="flex items-center gap-1.5 text-xs text-[#E02B1D]">
                    <AlertCircle className="h-3.5 w-3.5" /> {menuError}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Catalog Source */}
        <div className="overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] px-5 py-3">
            <h2 className="text-sm font-semibold text-[#1A1A1A]">Catalog Export</h2>
            <span className="rounded-full bg-[#006AFF]/10 px-2 py-0.5 text-xs font-medium text-[#006AFF]">
              Step 2
            </span>
          </div>
          <div className="space-y-4 p-5">
            {catalogResult ? (
              <div className="rounded-xl border border-[#00D632]/30 bg-[#00D632]/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-[#00D632]" />
                    <span className="text-sm font-medium text-[#00D632]">
                      {catalogResult.item_count} items loaded
                    </span>
                  </div>
                  <button
                    onClick={clearCatalog}
                    className="rounded p-1 text-[#8A8A8A] hover:bg-[#F6F6F6] hover:text-[#4A4A4A]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {catalogResult.items.length > 0 && (
                  <div className="mt-3 max-h-48 space-y-1 overflow-y-auto pr-1">
                    {catalogResult.items.slice(0, 20).map((item, i) => (
                      <div key={i} className="flex items-center justify-between rounded bg-white/50 px-2.5 py-1.5 text-xs">
                        <span className="text-[#4A4A4A]">{item.name}</span>
                        {item.price != null && (
                          <span className="text-[#8A8A8A]">${item.price.toFixed(2)}</span>
                        )}
                      </div>
                    ))}
                    {catalogResult.items.length > 20 && (
                      <p className="px-2 pt-1 text-xs text-[#8A8A8A]">
                        + {catalogResult.items.length - 20} more items
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E5E5E5] py-10 text-center hover:border-[#006AFF]/30"
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
                    <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#006AFF]" />
                    <p className="text-sm text-[#4A4A4A]">Parsing {catalogFile?.name}...</p>
                  </>
                ) : (
                  <>
                    <UploadIcon className="mb-3 h-8 w-8 text-[#8A8A8A]" />
                    <p className="text-sm text-[#4A4A4A]">Upload Square catalog export</p>
                    <label className="mt-3 cursor-pointer rounded-lg border border-[#E5E5E5] bg-[#F6F6F6] px-4 py-2 text-sm font-medium text-[#4A4A4A] hover:bg-[#F6F6F6]">
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
                    <p className="mt-2 text-xs text-[#8A8A8A]">
                      Export from Square Dashboard as .xlsx, .xls, or .csv
                    </p>
                  </>
                )}
              </div>
            )}

            {catalogError && (
              <div className="flex items-start gap-2 rounded-lg border border-[#E02B1D]/30 bg-[#E02B1D]/5 px-3 py-2 text-xs text-[#E02B1D]">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{catalogError}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Merchant Info + Builder */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Merchant Info */}
        <div className="overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] px-5 py-3">
            <h2 className="text-sm font-semibold text-[#1A1A1A]">Merchant Info</h2>
            <span className="rounded-full bg-[#006AFF]/10 px-2 py-0.5 text-xs font-medium text-[#006AFF]">
              Step 3
            </span>
          </div>
          <div className="space-y-3 p-5">
            <input
              type="text"
              placeholder="Merchant / Restaurant Name..."
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              className="w-full rounded-lg border border-[#E5E5E5] bg-[#F6F6F6] px-3 py-2 text-sm text-[#1A1A1A] placeholder-[#8A8A8A] focus:border-[#006AFF] focus:ring-2 focus:ring-[#006AFF]/10 focus:outline-none"
            />
            <div className="flex gap-2">
              {(['US', 'EU', 'AU'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMarket(m)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    market === m
                      ? 'border-[#00D632]/30 bg-[#00D632]/10 text-[#00D632]'
                      : 'border-[#E5E5E5] bg-[#F6F6F6] text-[#8A8A8A] hover:border-[#006AFF]/30'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <textarea
              placeholder="Special requests (e.g., AU market formatting, specific modifiers expected, ignore certain items...)"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-[#E5E5E5] bg-[#F6F6F6] px-3 py-2 text-sm text-[#1A1A1A] placeholder-[#8A8A8A] focus:border-[#006AFF] focus:ring-2 focus:ring-[#006AFF]/10 focus:outline-none"
            />
          </div>
        </div>

        {/* Builder */}
        <div className="overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] px-5 py-3">
            <h2 className="text-sm font-semibold text-[#1A1A1A]">Builder</h2>
            <span className="rounded-full bg-[#006AFF]/10 px-2 py-0.5 text-xs font-medium text-[#006AFF]">
              Step 4
            </span>
          </div>
          <div className="space-y-3 p-5">
            <div className="relative">
              <select
                value={selectedBuilderId}
                onChange={(e) => setSelectedBuilderId(e.target.value)}
                className="w-full appearance-none rounded-lg border border-[#E5E5E5] bg-[#F6F6F6] px-3 py-2 pr-8 text-sm text-[#1A1A1A] focus:border-[#006AFF] focus:ring-2 focus:ring-[#006AFF]/10 focus:outline-none"
              >
                <option value="">Select a builder...</option>
                {builders.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} — {b.email} ({b.team})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]" />
            </div>
            {selectedBuilder && (
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="rounded-full border border-[#E5E5E5] bg-[#F6F6F6] px-3 py-1 text-xs text-[#8A8A8A]">
                  {selectedBuilder.email}
                </span>
                <span className="rounded-full border border-[#E5E5E5] bg-[#F6F6F6] px-3 py-1 text-xs text-[#8A8A8A]">
                  Team: {selectedBuilder.team}
                </span>
              </div>
            )}
            {builders.length === 0 && (
              <p className="text-xs text-[#8A8A8A]">
                No builders configured.{' '}
                <a href="/settings" className="text-[#006AFF] hover:underline">Add builders in Settings</a>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Grader + Start Grading */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] px-5 py-3">
            <h2 className="text-sm font-semibold text-[#1A1A1A]">Graded By</h2>
            <span className="rounded-full bg-[#006AFF]/10 px-2 py-0.5 text-xs font-medium text-[#006AFF]">
              Step 5
            </span>
          </div>
          <div className="space-y-3 p-5">
            <div className="relative">
              <select
                value={selectedGraderId}
                onChange={(e) => setSelectedGraderId(e.target.value)}
                className="w-full appearance-none rounded-lg border border-[#E5E5E5] bg-[#F6F6F6] px-3 py-2 pr-8 text-sm text-[#1A1A1A] focus:border-[#006AFF] focus:ring-2 focus:ring-[#006AFF]/10 focus:outline-none"
              >
                <option value="">Select a grader...</option>
                {graders.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} — {g.email} ({g.role})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]" />
            </div>
            {selectedGrader && (
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="rounded-full border border-[#E5E5E5] bg-[#F6F6F6] px-3 py-1 text-xs text-[#8A8A8A]">
                  {selectedGrader.email}
                </span>
                <span className={`rounded-full border border-[#E5E5E5] bg-[#F6F6F6] px-3 py-1 text-xs ${
                  selectedGrader.role === 'lead' ? 'text-[#006AFF]' : 'text-[#8A8A8A]'
                }`}>
                  {selectedGrader.role}
                </span>
              </div>
            )}
            {graders.length === 0 && (
              <p className="text-xs text-[#8A8A8A]">
                No graders configured.{' '}
                <a href="/settings" className="text-[#006AFF] hover:underline">Add graders in Settings</a>
              </p>
            )}
          </div>
        </div>

        {/* Start Grading Action */}
        <div className="flex flex-col justify-end gap-3">
          {gradingError && (
            <div className="flex items-start gap-2 rounded-lg border border-[#E02B1D]/30 bg-[#E02B1D]/5 px-3 py-2 text-xs text-[#E02B1D]">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{gradingError}</span>
            </div>
          )}
          {grading && (
            <GradingProgress phase={gradingPhase} />
          )}
          <button
            onClick={async () => {
              if (!selectedBuilder || !merchantName.trim() || !menuResult) return;
              setGrading(true);
              setGradingError('');
              setGradingPhase(0);
              const phaseTimer = setInterval(() => {
                setGradingPhase((p) => Math.min(p + 1, 5));
              }, 5000);
              try {
                const report = await api.ai.grade({
                  upload_id: menuResult.id,
                  catalog_items: catalogResult?.items ?? [],
                  market,
                  merchant_name: merchantName.trim(),
                  builder_name: selectedBuilder.name,
                  builder_email: selectedBuilder.email,
                  builder_team: selectedBuilder.team || '',
                  builder_id: selectedBuilder.id,
                  special_requests: specialRequests,
                });
                clearInterval(phaseTimer);
                navigate(`/reports/${report.id}`);
              } catch (e: unknown) {
                clearInterval(phaseTimer);
                setGradingError(e instanceof Error ? e.message : 'Failed to grade menu');
              } finally {
                setGrading(false);
                setGradingPhase(0);
              }
            }}
            disabled={!selectedBuilderId || !merchantName.trim() || !menuResult || grading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#006AFF] px-6 py-3 text-sm font-medium text-white hover:bg-[#0056CC] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {grading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Running multipass analysis...
              </>
            ) : (
              'Start AI Grading'
            )}
          </button>
          {!grading && !menuResult && (
            <p className="text-center text-xs text-[#8A8A8A]">Upload a menu file to start grading</p>
          )}
          {!grading && menuResult && (!merchantName.trim() || !selectedBuilderId) && (
            <p className="text-center text-xs text-[#8A8A8A]">
              {!merchantName.trim() ? 'Enter a merchant name' : 'Select a builder'} to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
