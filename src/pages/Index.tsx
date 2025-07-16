import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSession } from '@/components/SessionProvider';
import Sidebar from '@/components/ui/sidebar';
import JobBoard from '@/components/JobBoard';
import TechnicianManagement from '@/components/TechnicianManagement';
import InvoicingSystem from '@/components/InvoicingSystem';
import ReportsAnalytics from '@/components/ReportsAnalytics';
import ShopSettings from '@/components/ShopSettings';
import TechnicianDashboard from '@/components/TechnicianDashboard';
import NotFound from './NotFound';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { useMobile } from '@/hooks/use-mobile';

const Index = () => {
  const { userRole, isLoading } = useSession();
  const isMobile = useMobile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!userRole || userRole === 'unassigned') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <h1 className="text-2xl font-bold mb-4">Access Pending</h1>
        <p>Your account is pending role assignment. Please contact an administrator.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar userRole={userRole} isMobile={isMobile} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <Routes>
          {userRole === 'admin' && (
            <>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<JobBoard />} />
              <Route path="technicians" element={<TechnicianManagement />} />
              <Route path="invoicing" element={<InvoicingSystem />} />
              <Route path="reports" element={<ReportsAnalytics />} />
              <Route path="settings" element={<ShopSettings />} />
            </>
          )}
          {userRole === 'tech' && (
            <>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<TechnicianDashboard />} />
              <Route path="settings" element={<ShopSettings />} />
            </>
          )}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
};

export default Index;