import type {
  Builder,
  BuilderQualityMetrics,
  FeedbackPreview,
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
    search: (q: string) => request<Builder[]>(`/builders?q=${q}`),
    get: (id: string) => request<Builder>(`/builders/${id}`),
    getTrend: (id: string) => request<unknown>(`/builders/${id}/trend`),
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
  },
};
