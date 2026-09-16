// ============================================
// HospitalChain - Main App Component
// Academic prototype for blood bag traceability using blockchain
// ============================================

import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';

// Layout Components
import { Layout } from './components/layout/Layout';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { BloodBagsPage } from './pages/blood-bags/BloodBagsPage';
import { BloodBagDetailPage } from './pages/blood-bags/BloodBagDetailPage';
import { DemandsPage } from './pages/demands/DemandsPage';
import { DemandDetailPage } from './pages/demands/DemandDetailPage';
import { TransfersPage } from './pages/transfers/TransfersPage';
import { TransferDetailPage } from './pages/transfers/TransferDetailPage';
import { InstitutionsPage } from './pages/institutions/InstitutionsPage';
import { AuditPage } from './pages/audit/AuditPage';
import { NetworkMapPage } from './pages/dashboard/NetworkMapPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Main App Component
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/blood-bags" element={<BloodBagsPage />} />
            <Route path="/blood-bags/:id" element={<BloodBagDetailPage />} />
            <Route path="/blood-bags/code/:codigo" element={<BloodBagDetailPage />} />
            <Route path="/demands" element={<DemandsPage />} />
            <Route path="/demands/:id" element={<DemandDetailPage />} />
            <Route path="/transfers" element={<TransfersPage />} />
            <Route path="/transfers/:id" element={<TransferDetailPage />} />
            <Route path="/institutions" element={<InstitutionsPage />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/network-map" element={<NetworkMapPage />} />
          </Route>
          
          {/* 404 Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        
        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--card)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
            },
          }}
        />
        
        {/* React Query Devtools */}
        <ReactQueryDevtools initialIsOpen={false} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
