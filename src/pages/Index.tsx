import { useState } from "react";
import { NavLink, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Users,
  Wrench,
  FileText,
  BarChart2,
  Settings,
  Bot,
  LogOut,
  Menu,
} from "lucide-react";
import { useSession, type UserRole } from "@/components/SessionProvider";
import { supabase } from "@/integrations/supabase/client";
import { AIHelper } from "@/components/AIHelper";
import { JobBoard } from "@/components/JobBoard";
import { TechnicianManagement } from "@/components/TechnicianManagement";
import { ReportsAnalytics } from "@/components/ReportsAnalytics";
import { InvoicingSystem } from "@/components/InvoicingSystem";
import { ShopSettings } from "@/components/ShopSettings";
import { TechnicianDashboard } from "@/components/TechnicianDashboard";
import { JobDetailsModal } from "@/components/JobDetailsModal";
import { useToast } from "@/hooks/use-toast";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "tech", "road", "parts", "unassigned"] },
  { href: "/jobs", label: "Job Board", icon: Wrench, roles: ["admin", "manager"] },
  { href: "/technicians", label: "Technicians", icon: Users, roles: ["admin", "manager"] },
  { href: "/invoicing", label: "Invoicing", icon: FileText, roles: ["admin", "manager"] },
  { href: "/reports", label: "Reports", icon: BarChart2, roles: ["admin", "manager"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["admin"] },
];

interface SidebarProps {
  userRole: UserRole;
  onLinkClick?: () => void;
}

const Sidebar = ({ userRole, onLinkClick }: SidebarProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ variant: "destructive", title: "Logout failed", description: error.message });
    } else {
      navigate('/login');
    }
  };

  const filteredNavItems = navItems.filter(item => userRole && item.roles.includes(userRole));

  return (
    <div className="flex flex-col h-full bg-card text-card-foreground border-r">
      <div className="p-4 border-b flex items-center gap-2">
        <img src="/xpress-logo.png" alt="Xpress Diesel Logo" className="h-8 w-8" />
        <h1 className="text-xl font-bold text-primary">Xpress Diesel</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === "/"}
            onClick={onLinkClick}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                isActive && "bg-accent text-primary"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t mt-auto">
        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
};

interface DashboardContentProps {
  onJobClick: (job: any) => void;
  userRole: UserRole;
}

const DashboardContent = ({ onJobClick, userRole }: DashboardContentProps) => {
  if (userRole === 'tech' || userRole === 'road') {
    return <TechnicianDashboard userRole={userRole} onJobClick={onJobClick} />;
  }
  return <JobBoard onJobClick={onJobClick} onGenerateInvoice={() => {}} />;
};

const Index = () => {
  const { userRole } = useSession();
  const location = useLocation();
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isInvoiceEditorOpen, setIsInvoiceEditorOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

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
    const currentPath = location.pathname === '/' ? '/' : `/${location.pathname.split('/')[1]}`;
    const item = navItems.find(nav => nav.href === currentPath);
    return item ? item.label : "Dashboard";
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <Sidebar userRole={userRole} />
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
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
          <div className="w-full flex-1">
            {/* Can add a search bar here */}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}>
            <Bot className="h-5 w-5" />
            <span className="sr-only">Toggle AI Assistant</span>
          </Button>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Routes>
            <Route path="/" element={<DashboardContent onJobClick={handleJobClick} userRole={userRole} />} />
            <Route path="/jobs" element={<JobBoard onJobClick={handleJobClick} onGenerateInvoice={handleGenerateInvoice} />} />
            <Route path="/technicians" element={<TechnicianManagement />} />
            <Route path="/invoicing" element={<InvoicingSystem isOpen={isInvoiceEditorOpen} setIsOpen={setIsInvoiceEditorOpen} editingInvoice={editingInvoice} onSuccess={() => setIsInvoiceEditorOpen(false)} onOpenEditor={handleOpenInvoiceEditor} />} />
            <Route path="/reports" element={<ReportsAnalytics />} />
            <Route path="/settings" element={<ShopSettings />} />
          </Routes>
        </main>
      </div>
      <Sheet open={isAiPanelOpen} onOpenChange={setIsAiPanelOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col">
          <AIHelper />
        </SheetContent>
      </Sheet>
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