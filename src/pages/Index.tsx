import React, { useState, Suspense } from "react";
import { useSession } from "@/components/SessionProvider";
import {
  LayoutDashboard,
  Users,
  Wrench,
  FileText,
  DollarSign,
  Settings,
  Bot,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { AIHelper } from "@/components/AIHelper";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const JobBoard = React.lazy(() => import("@/components/JobBoard").then(m => ({ default: m.JobBoard })));
const TechnicianDashboard = React.lazy(() => import("@/components/TechnicianDashboard").then(m => ({ default: m.TechnicianDashboard })));
const JobDetailsModal = React.lazy(() => import("@/components/JobDetailsModal").then(m => ({ default: m.JobDetailsModal })));
const ReportsAnalytics = React.lazy(() => import("@/components/ReportsAnalytics").then(m => ({ default: m.ReportsAnalytics })));
const InvoicingSystem = React.lazy(() => import("@/components/InvoicingSystem").then(m => ({ default: m.InvoicingSystem })));
const ShopSettings = React.lazy(() => import("@/components/ShopSettings").then(m => ({ default: m.ShopSettings })));
const TechnicianManagement = React.lazy(() => import("@/components/TechnicianManagement").then(m => ({ default: m.TechnicianManagement })));

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
  </div>
);

const Index = () => {
  const { userRole } = useSession();
  const [activeView, setActiveView] = useState(userRole === 'admin' || userRole === 'manager' ? "job_board" : "tech_dashboard");
  const [selectedJob, setSelectedJob] = useState(null);
  const [isInvoiceEditorOpen, setIsInvoiceEditorOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAiHelperOpen, setIsAiHelperOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const menuItems = [
    { id: "job_board", label: "Job Board", icon: Wrench, roles: ["admin", "manager"] },
    { id: "tech_dashboard", label: "My Jobs", icon: Wrench, roles: ["tech", "road", "parts"] },
    { id: "technicians", label: "Technicians", icon: Users, roles: ["admin", "manager"] },
    { id: "invoicing", label: "Invoicing", icon: FileText, roles: ["admin", "manager"] },
    { id: "reports", label: "Reports", icon: DollarSign, roles: ["admin", "manager"] },
    { id: "settings", label: "Settings", icon: Settings, roles: ["admin"] },
  ].filter(item => item.roles.includes(userRole || "unassigned"));

  const renderView = () => {
    switch (activeView) {
      case "job_board":
        return <JobBoard onJobClick={setSelectedJob} onGenerateInvoice={() => {}} />;
      case "tech_dashboard":
        return <TechnicianDashboard userRole={userRole} onJobClick={setSelectedJob} />;
      case "technicians":
        return <TechnicianManagement />;
      case "invoicing":
        return <InvoicingSystem isOpen={isInvoiceEditorOpen} setIsOpen={setIsInvoiceEditorOpen} editingInvoice={editingInvoice} onSuccess={() => setIsInvoiceEditorOpen(false)} onOpenEditor={(inv) => { setEditingInvoice(inv); setIsInvoiceEditorOpen(true); }} />;
      case "reports":
        return <ReportsAnalytics />;
      case "settings":
        return <ShopSettings />;
      default:
        return <JobBoard onJobClick={setSelectedJob} onGenerateInvoice={() => {}} />;
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card text-card-foreground">
      <div className="p-4 border-b border-border">
        <h1 className={`font-bold text-xl ${isSidebarCollapsed && !isMobile ? 'text-center' : ''}`}>
          {isSidebarCollapsed && !isMobile ? 'XD' : 'Xpress Diesel'}
        </h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant={activeView === item.id ? "secondary" : "ghost"}
            className={`w-full justify-start hover:bg-accent ${isSidebarCollapsed && !isMobile ? 'justify-center' : ''}`}
            onClick={() => setActiveView(item.id)}
          >
            <item.icon className={`h-5 w-5 ${isSidebarCollapsed && !isMobile ? '' : 'mr-3'}`} />
            {!isSidebarCollapsed || isMobile ? item.label : ''}
          </Button>
        ))}
      </nav>
      <div className="p-2 border-t border-border">
        <Button variant="ghost" className="w-full justify-start hover:bg-accent" onClick={handleLogout}>
          <LogOut className={`h-5 w-5 ${isSidebarCollapsed && !isMobile ? '' : 'mr-3'}`} />
          {!isSidebarCollapsed || isMobile ? 'Logout' : ''}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex h-screen bg-background">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-card border-r">
            <SidebarContent />
          </SheetContent>
        </Sheet>
        <main className="flex-1 p-4 pt-20 overflow-y-auto">
          <Suspense fallback={<LoadingSpinner />}>{renderView()}</Suspense>
        </main>
        <Dialog open={isAiHelperOpen} onOpenChange={setIsAiHelperOpen}>
            <DialogTrigger asChild>
                <Button className="fixed bottom-6 right-6 rounded-full h-14 w-14 bg-primary hover:bg-primary/90 shadow-lg shadow-glow-orange">
                    <Bot className="h-7 w-7" />
                </Button>
            </DialogTrigger>
            <DialogContent className="p-0 max-w-md h-[70vh] flex flex-col bg-card border-border">
                <AIHelper />
            </DialogContent>
        </Dialog>
        {selectedJob && <JobDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} userRole={userRole} onGenerateInvoice={() => {}} />}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <aside className={`transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <SidebarContent />
      </aside>
      <div className="relative flex-1 flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-border">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
            {isSidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </Button>
          <h2 className="text-xl font-semibold capitalize">{activeView.replace('_', ' ')}</h2>
          <div></div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          <Suspense fallback={<LoadingSpinner />}>{renderView()}</Suspense>
        </main>
      </div>
      <Dialog open={isAiHelperOpen} onOpenChange={setIsAiHelperOpen}>
          <DialogTrigger asChild>
              <Button className="fixed bottom-6 right-6 rounded-full h-16 w-16 bg-primary hover:bg-primary/90 shadow-lg shadow-glow-orange z-50">
                  <Bot className="h-8 w-8" />
              </Button>
          </DialogTrigger>
          <DialogContent className="p-0 max-w-md h-[70vh] flex flex-col bg-card border-border">
              <AIHelper />
          </DialogContent>
      </Dialog>
      {selectedJob && <JobDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} userRole={userRole} onGenerateInvoice={() => {}} />}
    </div>
  );
};

export default Index;