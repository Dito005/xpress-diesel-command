import { useState, Suspense, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useSession } from "@/components/SessionProvider";
import { supabase } from "@/integrations/supabase/client";
import { JobDetailsModal } from "@/components/JobDetailsModal";
import { useToast } from "@/hooks/use-toast";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { Sidebar } from "@/components/Sidebar";
import React from "react";

const DashboardPage = React.lazy(() => import('./DashboardPage').then(module => ({ default: module.DashboardPage })));
const ReportsAnalytics = React.lazy(() => import('@/components/ReportsAnalytics').then(module => ({ default: module.ReportsAnalytics })));
const ShopSettings = React.lazy(() => import('@/components/ShopSettings').then(module => ({ default: module.ShopSettings })));

const Index = () => {
  const { userRole } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isInvoiceEditorOpen, setIsInvoiceEditorOpen] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);

  useEffect(() => {
    const handlePaymentSuccess = async (invoiceId: string) => {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoiceId);

      if (error) {
        toast({ variant: "destructive", title: "Payment Update Failed", description: error.message });
      } else {
        toast({ title: "Payment Successful!", description: `Invoice #${invoiceId.slice(0, 8)} has been marked as paid.` });
      }
      navigate(location.pathname, { replace: true });
    };

    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get('payment_status');
    const invoiceId = params.get('invoice_id');

    if (paymentStatus === 'success' && invoiceId) {
      handlePaymentSuccess(invoiceId);
    }
  }, [location, navigate, toast]);

  const handleJobClick = (job) => {
    setSelectedJob(job);
  };

  const handleGenerateInvoice = (job) => {
    setEditingInvoice({ job_id: job.id, ...job });
    setIsInvoiceEditorOpen(true);
  };
  
  const handleOpenInvoiceEditor = (invoice) => {
    setEditingInvoice(invoice);
    setIsInvoiceEditorOpen(true);
  };

  if (!userRole) {
    return <div className="flex items-center justify-center h-screen bg-background"><LoadingSkeleton /></div>;
  }

  const getPageTitle = () => {
    const path = location.pathname.split('/')[1];
    switch (path) {
      case 'reports':
        return 'Reports';
      case 'settings':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-card md:block">
        <Sidebar userRole={userRole} />
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6 sticky top-0 z-10">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
              <Sidebar userRole={userRole} onLinkClick={() => setIsSidebarOpen(false)} />
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Suspense fallback={<LoadingSkeleton />}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="reports" element={<ReportsAnalytics />} />
              <Route path="settings" element={<ShopSettings />} />
            </Routes>
          </Suspense>
        </main>
      </div>
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          userRole={userRole}
          onGenerateInvoice={handleGenerateInvoice}
        />
      )}
    </div>
  );
};

export default Index;