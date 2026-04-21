import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';

const Upload = lazy(() => import('./pages/Upload'));
const ReportsList = lazy(() => import('./pages/ReportsList'));
const Report = lazy(() => import('./pages/Report'));
const Quality = lazy(() => import('./pages/Quality'));
const AIInsights = lazy(() => import('./pages/AIInsights'));
const History = lazy(() => import('./pages/History'));
const Settings = lazy(() => import('./pages/Settings'));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E5E5E5] border-t-[#006AFF]" />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/reports" element={<ReportsList />} />
              <Route path="/reports/:id" element={<Report />} />
              <Route path="/quality" element={<Quality />} />
              <Route path="/ai" element={<AIInsights />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
