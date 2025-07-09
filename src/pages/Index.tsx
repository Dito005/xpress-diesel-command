import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, DollarSign, Users, Wrench, MapPin, Plus, Bot, Package, FileText, Calculator, Settings, Database, Brain, Workflow, AlertTriangle, BarChart, Search } from "lucide-react";
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

type UserRole = "admin" | "manager" | "mechanic" | "road" | "parts";

const Index = () => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [userRole, setUserRole] = useState<UserRole>("admin");
  const [liveLaborCost, setLiveLaborCost] = useState(125.50);
  const [todaysProfit, setTodaysProfit] = useState(8430.25);

  // Mock data for demonstration
  const jobsData = [
    { status: "not_started" }, { status: "in_progress" }, { status: "waiting_parts" },
    { status: "waiting_approval" }, { status: "in_progress" }, { status: "completed" }
  ];
  const clockedInTechs = [
    { name: "Mike Rodriguez", hourlyRate: 35 },
    { name: "Sarah Johnson", hourlyRate: 28 },
    { name: "Carlos Martinez", hourlyRate: 22 },
  ];

  useEffect(() => {
    const totalHourlyRate = clockedInTechs.reduce((sum, tech) => sum + tech.hourlyRate, 0);
    const costPerSecond = totalHourlyRate / 3600;

    const laborInterval = setInterval(() => {
      setLiveLaborCost(prevCost => prevCost + costPerSecond);
    }, 1000);

    const profitInterval = setInterval(() => {
      setTodaysProfit(prevProfit => prevProfit + (costPerSecond * 2.5)); // Simulate profit increasing
    }, 5000);

    return () => {
      clearInterval(laborInterval);
      clearInterval(profitInterval);
    };
  }, []);

  const kpiData = {
    pendingJobs: jobsData.filter(j => ["not_started", "waiting_parts", "waiting_approval"].includes(j.status)).length,
    dailyRevenue: 12450,
    activeJobs: jobsData.filter(j => j.status === "in_progress").length,
    efficiency: { value: 87, change: 5 },
  };

  const handleJobClick = (job) => {
    setSelectedJob(job);
  };

  const availableRoles: UserRole[] = ["admin", "manager", "mechanic", "road", "parts"];
  const getRoleLabel = (role: UserRole) => {
    const labels: Record<UserRole, string> = {
      admin: "Administrator",
      manager: "Service Manager",
      mechanic: "Technician",
      road: "Road Tech",
      parts: "Parts Runner",
    };
    return labels[role];
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

  const visibleTabs = TABS_CONFIG.filter(tab => tab.roles.includes(userRole));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900">Xpress Diesel Repair</h1>
              <p className="text-sm font-medium text-blue-600 -mt-1">Software</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {getRoleLabel(userRole)}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => {
                const currentIndex = availableRoles.indexOf(userRole);
                const nextRole = availableRoles[(currentIndex + 1) % availableRoles.length];
                setUserRole(nextRole);
              }}>
                Switch Role
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
                <div className="text-3xl font-bold">${todaysProfit.toFixed(2)}</div>
                <div className="text-xs text-green-100">Est. Total: ${(todaysProfit * 1.2).toFixed(2)}</div>
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
                <div className="text-xs text-purple-100 mt-1">
                  {kpiData.efficiency.value}% efficiency <span className="text-green-300">(+{kpiData.efficiency.change}%)</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue={visibleTabs[0].value} className="space-y-6">
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