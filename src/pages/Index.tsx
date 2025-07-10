import React, { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, DollarSign, Users, Wrench, MapPin, Plus, Bot, Package, FileText, Calculator, Settings, Database, Brain, Workflow, AlertTriangle, BarChart, Search, LogOut, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionProvider";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Lazy load components for code splitting and faster initial load
const JobBoard = React.lazy(() => import("@/components/JobBoard").then(module => ({ default: module.JobBoard })));
const TechnicianDashboard = React.lazy(() => import("@/components/TechnicianDashboard").then(module => ({ default: module.TechnicianDashboard })));
const JobDetailsModal = React.lazy(() => import("@/components/JobDetailsModal").then(module => ({ default: module.JobDetailsModal })));
const PartsRunnerDashboard = React.lazy(() => import("@/components/PartsRunnerDashboard").then(module => ({ default: module.PartsRunnerDashboard })));
const RoadServiceDashboard = React.lazy(() => import("@/components/RoadServiceDashboard").then(module => ({ default: module.RoadServiceDashboard })));
const ReportsAnalytics = React.lazy(() => import("@/components/ReportsAnalytics").then(module => ({ default: module.ReportsAnalytics })));
const AIHelper = React.lazy(() => import("@/components/AIHelper").then(module => ({ default: module.AIHelper })));
const InvoicingSystem = React.lazy(() => import("@/components/InvoicingSystem").then(module => ({ default: module.InvoicingSystem })));
const ShopSettings = React.lazy(() => import("@/components/ShopSettings").then(module => ({ default: module.ShopSettings })));
const TechnicianManagement = React.lazy(() => import("@/components/TechnicianManagement").then(module => ({ default: module.TechnicianManagement })));
const TechnicianList = React.lazy(() => import("@/components/TechnicianList").then(module => ({ default: module.TechnicianList })));
const BusinessCosts = React.lazy(() => import("@/components/BusinessCosts").then(module => ({ default: module.BusinessCosts })));
const AIJobAnalyzer = React.lazy(() => import("@/components/AIJobAnalyzer").then(module => ({ default: module.AIJobAnalyzer })));
const WorkflowOrchestrator = React.lazy(() => import("@/components/WorkflowOrchestrator").then(module => ({ default: module.WorkflowOrchestrator })));
const PartsLookupTool = React.lazy(() => import("@/components/PartsLookupTool").then(module => ({ default: module.PartsLookupTool })));


type UserRole = "admin" | "manager" | "tech" | "road" | "parts" | "unassigned";

function isUserRole(role: string | null): role is UserRole {
  if (role === null) return false;
  const validRoles: UserRole[] = ["admin", "manager", "tech", "road", "parts", "unassigned"];
  return (validRoles as string[]).includes(role);
}

const Index = () => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [activeTab, setActiveTab] = useState("jobs");
  const { userRole, session } = useSession();
  const [liveLaborCost, setLiveLaborCost] = useState(0);
  const [totalHourlyRate, setTotalHourlyRate] = useState(0);
  const [kpiData, setKpiData] = useState({
    pendingJobs: 0,
    todaysProfit: 0,
    activeJobs: 0,
    efficiency: 0,
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAiHelperOpen, setIsAiHelperOpen] = useState(false);

  useEffect(() => {
    if (!session) return;

    const fetchKpis = async () => {
      const { data: jobs, error: jobsError } = await supabase.from('jobs').select('status');
      if (jobsError) console.error('Error fetching jobs for KPIs', jobsError);

      const today = new Date().toISOString().split('T')[0];
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('grand_total')
        .gte('created_at', `${today}T00:00:00.000Z`);
      if (invoicesError) console.error('Error fetching invoices for KPIs', invoicesError);

      const pendingJobs = jobs?.filter(j => j.status === 'open' || j.status === 'waiting_parts').length || 0;
      const activeJobs = jobs?.filter(j => j.status === 'in_progress').length || 0;
      const todaysProfit = invoices?.reduce((sum, inv) => sum + inv.grand_total, 0) || 0;

      setKpiData(prev => ({ ...prev, pendingJobs, activeJobs, todaysProfit }));
    };

    const calculateLaborCost = async () => {
        const { data: clockedInTechs, error } = await supabase
            .from('time_logs')
            .select('techs(hourly_rate)')
            .is('clock_out', null)
            .eq('type', 'shift');

        if (error) {
            console.error("Error fetching clocked in techs:", error);
            setTotalHourlyRate(0);
            return;
        }

        const newTotalRate = clockedInTechs.reduce((sum, log) => {
            const techProfile = Array.isArray(log.techs) ? log.techs[0] : log.techs;
            return sum + (techProfile?.hourly_rate || 0);
        }, 0);
        setTotalHourlyRate(newTotalRate);
    };

    fetchKpis();
    calculateLaborCost();
    
    const kpiInterval = setInterval(fetchKpis, 30000);

    const timeLogChannel = supabase.channel('public:time_logs:labor_cost')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_logs' }, payload => {
        // Fix for TS2339: Explicitly type the payload records
        const newRecord = payload.new as { id?: string; type?: string };
        const oldRecord = payload.old as { id?: string; type?: string };
        const record = newRecord.id ? newRecord : oldRecord;
        if (record && record.type === 'shift') {
          calculateLaborCost();
        }
      })
      .subscribe();

    return () => {
      clearInterval(kpiInterval);
      supabase.removeChannel(timeLogChannel);
    };
  }, [session]);

  useEffect(() => {
    const costPerSecond = totalHourlyRate / 3600;
    const laborInterval = setInterval(() => {
      setLiveLaborCost(prev => prev + costPerSecond);
    }, 1000);

    return () => {
      clearInterval(laborInterval);
    };
  }, [totalHourlyRate]);

  const handleJobClick = (job: any) => {
    setSelectedJob(job);
  };

  const handleOpenInvoiceEditor = (invoice: any = null) => {
    setEditingInvoice(invoice);
    setIsInvoiceModalOpen(true);
  };

  const handleGenerateInvoiceFromJob = async (job: any) => {
    if (!job) return;

    const { data: newInvoice, error } = await supabase
      .from('invoices')
      .insert({
        job_id: job.id,
        customer_name: job.customer_name,
        customer_email: job.customer_email,
        status: 'pending',
        customer_concern: job.customer_concern,
        recommended_service: job.recommended_service,
        actual_service: job.actual_service || '',
        grand_total: 0,
      })
      .select('*, jobs(*), invoice_parts(*, parts(*)), invoice_labor(*, techs(*)), payments(*)')
      .single();

    if (error) {
      toast({ variant: "destructive", title: "Failed to create draft invoice", description: error.message });
      return;
    }

    setSelectedJob(null);
    setActiveTab("invoicing");
    handleOpenInvoiceEditor(newInvoice);
    
    toast({ title: "Draft Invoice Created", description: "Now editing the new invoice." });
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ variant: "destructive", title: "Logout Failed", description: error.message });
    } else {
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      navigate('/login');
    }
  };

  const getRoleLabel = (role: UserRole | null) => {
    if (!role) return "Loading...";
    const labels: Record<UserRole, string> = {
      admin: "Administrator",
      manager: "Service Manager",
      tech: "Technician",
      road: "Road Tech",
      parts: "Parts Runner",
      unassigned: "Unassigned Role",
    };
    return labels[role] || "Unknown Role";
  };

  const TABS_CONFIG: { value: string; label: string; icon: React.ElementType; roles: UserRole[] }[] = [
    { value: "ai-analyzer", label: "AI Mission", icon: Brain, roles: ["admin", "manager", "unassigned"] },
    { value: "jobs", label: "Jobs", icon: Wrench, roles: ["admin", "manager", "unassigned"] },
    { value: "technician", label: userRole === "tech" ? "My Jobs" : "Techs", icon: Users, roles: ["admin", "manager", "tech", "unassigned"] },
    { value: "parts", label: "Parts", icon: Package, roles: ["admin", "manager", "parts", "unassigned"] },
    { value: "road", label: "Road", icon: MapPin, roles: ["admin", "manager", "road", "unassigned"] },
    { value: "invoicing", label: "Invoicing", icon: Calculator, roles: ["admin", "manager", "unassigned"] },
    { value: "reports", label: "Reports", icon: FileText, roles: ["admin", "manager", "unassigned"] },
    { value: "parts-lookup", label: "Parts Lookup", icon: Search, roles: ["admin", "manager", "parts", "tech", "unassigned"] },
    { value: "costs", label: "Costs", icon: Database, roles: ["admin", "manager", "unassigned"] },
    { value: "settings", label: "Settings", icon: Settings, roles: ["admin", "unassigned"] },
  ];

  const visibleTabs = TABS_CONFIG.filter(tab => {
    if (userRole === null) return false;
    if (isUserRole(userRole)) {
      return tab.roles.includes(userRole);
    }
    return false;
  });
  const defaultTabValue = visibleTabs.length > 0 ? visibleTabs[0].value : "jobs";

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-black/30 backdrop-blur-sm border-b border-primary/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-center">
              <h1 className="text-xl font-bold text-primary glow-hover cursor-pointer">Xpress Diesel Neo</h1>
            </div>
            <div className="flex items-center space-x-4">
              {userRole && (
                <Badge variant="outline" className="border-secondary text-secondary flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  {getRoleLabel(userRole)}
                </Badge>
              )}
              <Dialog open={isAiHelperOpen} onOpenChange={setIsAiHelperOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="glow-hover">
                    <Bot className="h-5 w-5 text-primary" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 bg-card/80 backdrop-blur-md border-primary/30">
                  <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
                    <AIHelper />
                  </Suspense>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {(userRole === "admin" || userRole === "manager" || userRole === "unassigned") && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-yellow-100 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Pending Jobs</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold">{kpiData.pendingJobs}</div></CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-red-100 flex items-center gap-2"><Clock className="h-4 w-4" /> Live Labor Cost</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold">${liveLaborCost.toFixed(2)}</div></CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-green-100 flex items-center gap-2"><DollarSign className="h-4 w-4" /> Today's Profit</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold">${kpiData.todaysProfit.toFixed(2)}</div></CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2"><BarChart className="h-4 w-4" /> Live Metrics</CardTitle></CardHeader>
              <CardContent><div className="text-lg font-bold">{kpiData.activeJobs} Active Jobs</div></CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="bg-black/30 border border-primary/20 p-1 rounded-lg">
              {visibleTabs.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2 data-[state=active]:bg-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/50">
                  <tab.icon className="h-4 w-4" /> {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <Suspense fallback={<div className="flex justify-center items-center p-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <TabsContent value="ai-analyzer"><Tabs defaultValue="analyzer" className="space-y-4"><TabsList><TabsTrigger value="analyzer">AI Job Analyzer</TabsTrigger><TabsTrigger value="workflow">Workflow Orchestrator</TabsTrigger></TabsList><TabsContent value="analyzer"><AIJobAnalyzer /></TabsContent><TabsContent value="workflow"><WorkflowOrchestrator /></TabsContent></Tabs></TabsContent>
            <TabsContent value="jobs"><JobBoard onJobClick={handleJobClick} onGenerateInvoice={handleGenerateInvoiceFromJob} /></TabsContent>
            <TabsContent value="technician">{userRole === "tech" ? <TechnicianDashboard userRole={userRole} onJobClick={handleJobClick} /> : <TechnicianList />}</TabsContent>
            <TabsContent value="parts"><PartsRunnerDashboard onJobClick={handleJobClick} /></TabsContent>
            <TabsContent value="road"><RoadServiceDashboard onJobClick={handleJobClick} /></TabsContent>
            <TabsContent value="invoicing">
              <InvoicingSystem 
                isOpen={isInvoiceModalOpen}
                setIsOpen={setIsInvoiceModalOpen}
                editingInvoice={editingInvoice}
                onSuccess={() => {
                  setIsInvoiceModalOpen(false);
                  setEditingInvoice(null);
                }}
                onOpenEditor={handleOpenInvoiceEditor} 
              />
            </TabsContent>
            <TabsContent value="reports"><ReportsAnalytics /></TabsContent>
            <TabsContent value="parts-lookup"><PartsLookupTool /></TabsContent>
            <TabsContent value="costs"><BusinessCosts /></TabsContent>
            <TabsContent value="settings"><Tabs defaultValue="shop" className="space-y-4"><TabsList><TabsTrigger value="shop">Shop Settings</TabsTrigger><TabsTrigger value="technicians">User Management</TabsTrigger></TabsList><TabsContent value="shop"><ShopSettings /></TabsContent><TabsContent value="technicians"><TechnicianManagement /></TabsContent></Tabs></TabsContent>
          </Suspense>
        </Tabs>
      </main>

      <Suspense fallback={<div />}>
        <JobDetailsModal 
          job={selectedJob} 
          onClose={() => setSelectedJob(null)} 
          userRole={userRole}
          onGenerateInvoice={handleGenerateInvoiceFromJob}
        />
      </Suspense>
    </div>
  );
};

export default Index;