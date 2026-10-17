import { lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/lib/profile';
import { Skeleton } from '@/components/ui';
import Shell from '@/components/Shell';

const AuthPage = lazy(() => import('@/features/auth/AuthPage'));
const Setup = lazy(() => import('@/features/onboarding/Setup'));
const Home = lazy(() => import('@/features/home/Home'));
const Earnings = lazy(() => import('@/features/earnings/Earnings'));
const Chat = lazy(() => import('@/features/chat/Chat'));
const Documents = lazy(() => import('@/features/documents/Documents'));
const Complaint = lazy(() => import('@/features/grievance/Complaint'));
const Rights = lazy(() => import('@/features/rights/Rights'));
const Safety = lazy(() => import('@/features/safety/Safety'));
const Settings = lazy(() => import('@/features/settings/Settings'));

/** Signed-in area: sends new users through profile setup once. */
function Protected() {
  const { user, loading } = useAuth();
  const { hasProfile, loading: profileLoading } = useProfile();
  if (loading || (user && profileLoading)) return <div className="p-6"><Skeleton lines={4} /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!hasProfile) return <Navigate to="/setup" replace />;
  return <Shell />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/setup" element={<Setup />} />
        <Route element={<Protected />}>
          <Route index element={<Home />} />
          <Route path="earnings" element={<Earnings />} />
          <Route path="ask" element={<Chat />} />
          <Route path="docs" element={<Documents />} />
          <Route path="complaint" element={<Complaint />} />
          <Route path="rights" element={<Rights />} />
          <Route path="safety" element={<Safety />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
