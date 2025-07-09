import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { supabase } from "@/integrations/supabase/client"; // Changed import path
import { useSession } from "@/components/SessionProvider"; // Import useSession
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

type UserRole = "admin" | "manager" | "mechanic" | "road" | "parts" | "unassigned";

// Type guard function to check if a string is a valid UserRole
function isUserRole(role: string | null): role is UserRole {
  if (role === null) return false;
  const validRoles: UserRole[] = ["admin", "manager", "mechanic", "road", "parts", "unassigned"];
  return (validRoles as string[]).includes(role);
}

const Index = () => {
  const [selectedJob, setSelectedJob] = useState(null);
  const { userRole, session } = useSession(); // Get userRole and session from context
  const [liveLaborCost, setLiveLaborCost] = useState(0);
  const [kpiData, setKpiData] = useState({
    pendingJobs: 0,
    todaysProfit: 0,
    activeJobs: 0,
    efficiency: 0,
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!session) return; // Only fetch KPIs if session exists

    const fetchKpis = async () => {
      // Fetch jobs for pending/active counts
      const { data: jobs, error: jobsError } = await supabase.from('jobs').select('status');
      if (jobsError) console.error('Error fetching jobs for KPIs', jobsError);

      // Fetch invoices for profit calculation
      const today = new Date().toISOString().split('T')[0];
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('total')
        .gte('created_at', `${today}T00:00:00.000Z`);
      if (invoicesError) console.error('Error fetching invoices for KPIs', invoicesError);

      const pendingJobs = jobs?.filter(j => j.status === 'pending' || j.status === 'waiting_parts').length || 0;
      const activeJobs = jobs?.filter(j => j.status === 'in_progress').length || 0;
      const todaysProfit = invoices?.reduce((sum, inv) => sum + inv.total, 0) || 0;

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
            const techProfile = log.techs?.[0];
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
  }, [session]); // Re-run effect when session changes

  const handleJobClick = (job) => {
    setSelectedJob(job);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: error.message,
      });
    } else {
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      navigate('/login');
    }
  };

  const getRoleLabel = (role: UserRole | null) => {
    if (!role) return "Loading...";
    const labels: Record<UserRole, string> = {
      admin: "Administrator",
      manager: "Service Manager",
      mechanic: "Technician",
      road: "Road Tech",
      parts: "Parts Runner",
      unassigned: "Unassigned Role",
    };
    return labels[role] || "Unknown Role";
  };

  const TABS_CONFIG: { value: string; label: string; icon: React.ElementType; roles: UserRole[] }[] = [
    { value: "ai-analyzer", label: "AI Mission", icon: Brain, roles: ["admin", "manager"] },
    { value: "jobs", label: "Jobs", icon: Wrench, roles: ["admin", "manager"] },
    { value: "technician", label: userRole === "mechanic" ? "My Jobs" : "Techs", icon: Users, roles: ["admin", "manager", "mechanic"] },
    { value: "parts", label: "Parts", icon: Package, roles: ["admin", "manager", "parts"] },
    { value: "road", label: "Road", icon: MapPin, roles: ["admin", "manager", "road"] },
    { value: "invoicing", label: "Invoicing", icon: Calculator, roles: ["admin", "manager"] },
    { value: "reports", label: "Reports", icon: FileText, roles: ["admin", "manager"] },
    { value: "parts-lookup", label: "Parts Lookup", icon: Search, roles: ["admin", "manager", "parts", "mechanic"] },
    { value: "ai-helper", label: "AI Helper", icon: Bot, roles: ["admin", "manager", "mechanic", "road", "parts"] },
    { value: "costs", label: "Costs", icon: Database, roles: ["admin", "manager"] },
    { value: "settings", label: "Settings", icon: Settings, roles: ["admin"] },
  ];

  const visibleTabs = TABS_CONFIG.filter(tab => {
    if (!userRole) {
      return false;
    }
    // Use the type guard to narrow userRole
    if (isUserRole(userRole)) {
      // Explicitly cast userRole to UserRole for the comparison within some
      return tab.roles.some(role => role === (userRole as UserRole));
    }
    return false; // If userRole is a string but not a valid UserRole
  });
  const defaultTabValue = visibleTabs.length > 0 ? visibleTabs[0].value : "jobs";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900">Xpress Diesel Repair</h1>
              <p className="text-sm font-medium text-blue-600 -mt-1">Command Center</p>
            </div>
            <div className="flex items-center space-x-4">
              {userRole && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {getRoleLabel(userRole)}
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {(userRole === "admin" || userRole === "manager") && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-100 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Pending Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{kpiData.pendingJobs}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-100 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Live Labor Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${liveLaborCost.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-100 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Today's Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${kpiData.todaysProfit.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2">
                  <BarChart className="h-4 w-4" /> Live Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{kpiData.activeJobs} Active Jobs</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue={defaultTabValue} className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList>
              {visibleTabs.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                  <tab.icon className="h-4 w-4" /> {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="ai-analyzer">
            <Tabs defaultValue="analyzer" className="space-y-4">
              <TabsList>
                <TabsTrigger value="analyzer">AI Job Analyzer</TabsTrigger>
                <TabsTrigger value="workflow">Workflow Orchestrator</TabsTrigger>
              </TabsList>
              <TabsContent value="analyzer"><AIJobAnalyzer /></TabsContent>
              <TabsContent value="workflow"><WorkflowOrchestrator /></TabsContent>
            </Tabs>
          </TabsContent>
          <TabsContent value="jobs"><JobBoard onJobClick={handleJobClick} /></TabsContent>
          <TabsContent value="technician">
            {userRole === "mechanic" ? <TechnicianDashboard userRole={userRole} onJobClick={handleJobClick} /> : <TechnicianList />}
          </TabsContent>
          <TabsContent value="parts"><PartsRunnerDashboard onJobClick={handleJobClick} /></TabsContent>
          <TabsContent value="road"><RoadServiceDashboard onJobClick={handleJobClick} /></TabsContent>
          <TabsContent value="invoicing"><InvoicingSystem /></TabsContent>
          <TabsContent value="reports"><ReportsAnalytics /></TabsContent>
          <TabsContent value="parts-lookup"><PartsLookupTool /></TabsContent>
          <TabsContent value="ai-helper"><AIHelper /></TabsContent>
          <TabsContent value="costs"><BusinessCosts /></TabsContent>
          <TabsContent value="settings">
            <Tabs defaultValue="shop" className="space-y-4">
              <TabsList>
                <TabsTrigger value="shop">Shop Settings</TabsTrigger>
                <TabsTrigger value="technicians">User Management</TabsTrigger>
              </TabsList>
              <TabsContent value="shop"><ShopSettings /></TabsContent>
              <TabsContent value="technicians"><TechnicianManagement /></TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </main>

      {selectedJob && <JobDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} userRole={userRole} />}
    </div>
  );
};

export default Index;