import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, ChevronDown } from 'lucide-react';

const markets = ['US', 'EU', 'AU'] as const;
const teams = [
  { value: 'GT', label: 'GT Guatemala' },
  { value: 'MNL', label: 'MNL Manila' },
  { value: 'GSO', label: 'GSO Internal' },
  { value: 'EXT', label: 'External' },
];

export default function Upload() {
  const navigate = useNavigate();
  const [catalogSource, setCatalogSource] = useState('square');
  const [merchantId, setMerchantId] = useState('');
  const [activeMarket, setActiveMarket] = useState<string>('US');
  const [builderName, setBuilderName] = useState('Carlos Zamora');
  const [builderEmail, setBuilderEmail] = useState('czamora-bpo@bpofit.com');
  const [builderTeam, setBuilderTeam] = useState('GT');

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
          </div>
        </div>
      </div>

      {/* Builder Information */}
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
          <h2 className="text-sm font-semibold text-zinc-100">Builder Information</h2>
          <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
            Step 3
          </span>
        </div>
        <div className="p-5">
          <p className="mb-4 text-sm text-zinc-400">
            Who built this menu? Feedback will be emailed to the builder after grading.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Builder Name</label>
              <input
                type="text"
                value={builderName}
                onChange={(e) => setBuilderName(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Builder Email</label>
              <input
                type="email"
                value={builderEmail}
                onChange={(e) => setBuilderEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Builder Team</label>
              <div className="relative">
                <select
                  value={builderTeam}
                  onChange={(e) => setBuilderTeam(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 pr-8 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none"
                >
                  {teams.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-400">
              12 previous menus by this builder
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-400">
              Avg score: 76/100
            </span>
          </div>
        </div>
      </div>

      {/* Start Grading */}
      <div className="flex justify-end">
        <button
          onClick={() => navigate('/reports')}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-500"
        >
          Start Grading
        </button>
      </div>
    </div>
  );
}
