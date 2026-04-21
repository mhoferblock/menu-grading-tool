import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';

const Upload = lazy(() => import('./pages/Upload'));
const Report = lazy(() => import('./pages/Report'));
const Quality = lazy(() => import('./pages/Quality'));
const AIInsights = lazy(() => import('./pages/AIInsights'));
const History = lazy(() => import('./pages/History'));
const Settings = lazy(() => import('./pages/Settings'));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
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
              <Route path="/reports" element={<Report />} />
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
