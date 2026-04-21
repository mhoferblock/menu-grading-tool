import type {
  Builder,
  BuilderQualityMetrics,
  FeedbackPreview,
  Grader,
  GraderQualityMetrics,
  GradingReport,
} from '@/types';

const BASE_URL = '/api/v1';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || 'Request failed');
  }
  const json = await res.json();
  return json.data ?? json;
}

export const api = {
  reports: {
    list: () => request<GradingReport[]>('/reports'),
    get: (id: string) => request<GradingReport>(`/reports/${id}`),
    create: (data: Record<string, unknown>) =>
      request<GradingReport>('/reports', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  builders: {
    list: () => request<Builder[]>('/builders'),
    search: (q: string) => request<Builder[]>(`/builders?q=${q}`),
    get: (id: string) => request<Builder>(`/builders/${id}`),
    getTrend: (id: string) => request<unknown>(`/builders/${id}/trend`),
    create: (data: { name: string; email: string; team?: string }) =>
      request<Builder>('/builders', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<Builder>(`/builders/${id}`, { method: 'DELETE' }),
  },
  graders: {
    list: () => request<Grader[]>('/graders'),
    create: (data: { name: string; email: string; team?: string; role?: string }) =>
      request<Grader>('/graders', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<Grader>(`/graders/${id}`, { method: 'DELETE' }),
  },
  quality: {
    graders: () => request<GraderQualityMetrics[]>('/quality/graders'),
    builders: () => request<BuilderQualityMetrics[]>('/quality/builders'),
    team: () => request<unknown>('/quality/team'),
  },
  feedback: {
    preview: (reportId: string) =>
      request<FeedbackPreview>(`/reports/${reportId}/feedback`),
    send: (reportId: string, notes?: string) =>
      request<unknown>(`/reports/${reportId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ personal_notes: notes }),
      }),
  },
  ai: {
    insights: () => request<unknown>('/ai/insights'),
    rules: () => request<unknown>('/ai/rules'),
    grade: (data: {
      upload_id: string;
      catalog_items: { name: string; price?: number; category?: string; description?: string }[];
      market: string;
      merchant_name: string;
      builder_name: string;
      builder_email: string;
      builder_team: string;
      builder_id: string;
      special_requests?: string;
    }) =>
      request<GradingReport>('/ai/grade', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  catalog: {
    fetch: async (merchantId: string, market: string) => {
      const form = new FormData();
      form.append('merchant_id', merchantId);
      form.append('market', market);
      const res = await fetch(`${BASE_URL}/catalog/fetch`, { method: 'POST', body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Catalog fetch failed');
      }
      const json = await res.json();
      return json.data;
    },
    upload: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${BASE_URL}/catalog/upload`, { method: 'POST', body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Catalog upload failed');
      }
      const json = await res.json();
      return json.data;
    },
  },
  uploads: {
    menu: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${BASE_URL}/uploads/menu`, { method: 'POST', body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Menu upload failed');
      }
      const json = await res.json();
      return json.data;
    },
  },
};
