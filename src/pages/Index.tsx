import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, DollarSign, Users, Wrench, MapPin, Plus, Bot, Package, FileText, Calculator, Settings, Database, Brain, Workflow, AlertTriangle, BarChart, Search, LogOut } from "lucide-react";
import { JobBoard } from "@/components/JobBoard";
import { TechnicianDashboard } from "@/components/TechnicianDashboard";
import { JobDetailsModal } from "@/components/JobDetailsModal";
import { PartsRunnerDashboard } from "@/components/PartsRunnerDashboard";
import { RoadServiceDashboard } from "@/components/RoadServiceDashboard";
import { ReportsAnalytics } from "@/components/ReportsAnalytics";
import { AIHelper } from "@/components/AIHelper";
import { InvoicingSystem } from "@/components/InvoicingSystem";
import { ShopSettings } from "@/components/ShopSettings";
import { TechnicianManagement } from "@/components/TechnicianManagement";
import { TechnicianList } from "@/components/TechnicianList";
import { BusinessCosts } from "@/components/BusinessCosts";
import { AIJobAnalyzer } from "@/components/AIJobAnalyzer";
import { WorkflowOrchestrator } from "@/components/WorkflowOrchestrator";
import { PartsLookupTool } from "@/components/PartsLookupTool";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionProvider";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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
            return 0;
        }

        const totalHourlyRate = clockedInTechs.reduce((sum, log) => {
            const techProfile = Array.isArray(log.techs) ? log.techs[0] : log.techs;
            return sum + (techProfile?.hourly_rate || 0);
        }, 0);
        return totalHourlyRate;
    };

    fetchKpis();
    
    const laborInterval = setInterval(async () => {
        const totalRate = await calculateLaborCost();
        const costPerSecond = totalRate / 3600;
        setLiveLaborCost(prev => prev + costPerSecond);
    }, 1000);

    const kpiInterval = setInterval(fetchKpis, 30000);

    return () => {
      clearInterval(laborInterval);
      clearInterval(kpiInterval);
    };
  }, [session]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900">Xpress Repair Software</h1>
            </div>
            <div className="flex items-center space-x-4">
              {userRole && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {getRoleLabel(userRole)}
                </Badge>
              )}
              <Dialog open={isAiHelperOpen} onOpenChange={setIsAiHelperOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Bot className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
                  <AIHelper />
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
            <TabsList>
              {visibleTabs.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                  <tab.icon className="h-4 w-4" /> {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="ai-analyzer"><Tabs defaultValue="analyzer" className="space-y-4"><TabsList><TabsTrigger value="analyzer">AI Job Analyzer</TabsTrigger><TabsTrigger value="workflow">Workflow Orchestrator</TabsTrigger></TabsList><TabsContent value="analyzer"><AIJobAnalyzer /></TabsContent><TabsContent value="workflow"><WorkflowOrchestrator /></TabsContent></Tabs></TabsContent>
          <TabsContent value="jobs"><JobBoard onJobClick={handleJobClick} /></TabsContent>
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
        </Tabs>
      </main>

      <JobDetailsModal 
        job={selectedJob} 
        onClose={() => setSelectedJob(null)} 
        userRole={userRole}
        onGenerateInvoice={handleGenerateInvoiceFromJob}
      />
    </div>
  );
};

export default Index;