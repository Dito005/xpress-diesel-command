
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, Clock, DollarSign, Users, Wrench, MapPin, Plus, Bot, Package, FileText, Calculator, TrendingUp, Settings, Database, Brain, Workflow } from "lucide-react";
import { JobBoard } from "@/components/JobBoard";
import { TechnicianDashboard } from "@/components/TechnicianDashboard";
import { JobDetailsModal } from "@/components/JobDetailsModal";
import { PartsRunnerDashboard } from "@/components/PartsRunnerDashboard";
import { RoadServiceDashboard } from "@/components/RoadServiceDashboard";
import { ReportsAnalytics } from "@/components/ReportsAnalytics";
import { AIHelper } from "@/components/AIHelper";
import { AdminAIInsights } from "@/components/AdminAIInsights";
import { AIInsightsCompact } from "@/components/AIInsightsCompact";
import { InvoicingSystem } from "@/components/InvoicingSystem";
import { ShopSettings } from "@/components/ShopSettings";
import { TechnicianManagement } from "@/components/TechnicianManagement";
import { TechnicianList } from "@/components/TechnicianList";
import { BusinessCosts } from "@/components/BusinessCosts";
import { AIJobAnalyzer } from "@/components/AIJobAnalyzer";
import { WorkflowOrchestrator } from "@/components/WorkflowOrchestrator";

const Index = () => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [userRole, setUserRole] = useState("admin"); // admin, manager, mechanic, road, parts

  // Mock data for demonstration
  const kpiData = {
    todayJobs: { completed: 8, inProgress: 5, notStarted: 3 },
    dailyRevenue: 12450,
    laborCost: 3200,
    netProfit: 9250,
    techEfficiency: 87
  };

  const handleJobClick = (job) => {
    setSelectedJob(job);
  };

  const availableRoles = ["admin", "manager", "mechanic", "road", "parts"];
  const getRoleLabel = (role) => {
    switch(role) {
      case "admin": return "Administrator";
      case "manager": return "Service Manager";
      case "mechanic": return "Technician";
      case "road": return "Road Tech";
      case "parts": return "Parts Runner";
      default: return role;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 rounded-lg p-2">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Xpress Diesel Repair</h1>
                <p className="text-sm text-gray-500">Management System</p>
              </div>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI Dashboard - Admin/Manager Only */}
        {(userRole === "admin" || userRole === "manager") && (
          <div className="flex gap-6 mb-8">
            {/* KPI Cards */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-100">Today's Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-1">
                    {kpiData.todayJobs.completed + kpiData.todayJobs.inProgress + kpiData.todayJobs.notStarted}
                  </div>
                  <div className="text-xs text-blue-100">
                    ✅ {kpiData.todayJobs.completed} • 🔄 {kpiData.todayJobs.inProgress} • ⏳ {kpiData.todayJobs.notStarted}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-100 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Daily Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${kpiData.dailyRevenue.toLocaleString()}</div>
                  <div className="text-xs text-green-100">Net: ${kpiData.netProfit.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-orange-100 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Labor Cost
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${kpiData.laborCost.toLocaleString()}</div>
                  <div className="text-xs text-orange-100">Efficiency: {kpiData.techEfficiency}%</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Active Techs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">6</div>
                  <div className="text-xs text-purple-100">4 Shop • 2 Road</div>
                </CardContent>
              </Card>
            </div>

            {/* AI Insights Compact Box for Admin */}
            {userRole === "admin" && (
              <div className="w-80">
                <AIInsightsCompact />
              </div>
            )}
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue={getDefaultTab(userRole)} className="space-y-6">
          <div className="relative">
            <TabsList className="inline-flex h-12 items-center justify-start rounded-xl bg-white/20 backdrop-blur-md border border-white/30 shadow-lg p-1 text-muted-foreground overflow-x-auto min-w-0 max-w-full"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), inset 0 1px 0 rgba(255,255,255,0.2)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
            {(userRole === "admin" || userRole === "manager") && (
              <>
                <TabsTrigger value="ai-analyzer" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI Mission
                </TabsTrigger>
                <TabsTrigger value="jobs" className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Jobs
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="technician" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {userRole === "mechanic" ? "My Jobs" : "Techs"}
            </TabsTrigger>
            {userRole === "parts" && (
              <TabsTrigger value="parts" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Parts
              </TabsTrigger>
            )}
            <TabsTrigger value="road" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Road
            </TabsTrigger>
            {(userRole === "admin" || userRole === "manager") && (
              <>
                <TabsTrigger value="invoicing" className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Invoicing
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Reports
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Helper
            </TabsTrigger>
            {(userRole === "admin" || userRole === "manager") && (
              <>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </TabsTrigger>
                <TabsTrigger value="costs" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Costs
                </TabsTrigger>
              </>
            )}
            </TabsList>
          </div>

          {(userRole === "admin" || userRole === "manager") && (
            <>
              <TabsContent value="ai-analyzer" className="space-y-4">
                <Tabs defaultValue="analyzer" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="analyzer" className="flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      AI Job Analyzer
                    </TabsTrigger>
                    <TabsTrigger value="workflow" className="flex items-center gap-2">
                      <Workflow className="h-4 w-4" />
                      Workflow Orchestrator
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="analyzer">
                    <AIJobAnalyzer />
                  </TabsContent>
                  <TabsContent value="workflow">
                    <WorkflowOrchestrator />
                  </TabsContent>
                </Tabs>
              </TabsContent>
              
              <TabsContent value="jobs" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Live Job Board</h2>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    New Job
                  </Button>
                </div>
                <JobBoard onJobClick={handleJobClick} />
              </TabsContent>
            </>
          )}

          <TabsContent value="technician" className="space-y-4">
            {userRole === "mechanic" ? (
              <TechnicianDashboard userRole={userRole} onJobClick={handleJobClick} />
            ) : (
              <TechnicianList />
            )}
          </TabsContent>

          {userRole === "parts" && (
            <TabsContent value="parts" className="space-y-4">
              <PartsRunnerDashboard onJobClick={handleJobClick} />
            </TabsContent>
          )}

          <TabsContent value="road" className="space-y-4">
            <RoadServiceDashboard onJobClick={handleJobClick} />
          </TabsContent>

          {(userRole === "admin" || userRole === "manager") && (
            <>
              <TabsContent value="invoicing" className="space-y-4">
                <InvoicingSystem />
              </TabsContent>

              <TabsContent value="reports" className="space-y-4">
                <ReportsAnalytics />
              </TabsContent>
            </>
          )}

          <TabsContent value="ai" className="space-y-4">
            <AIHelper />
          </TabsContent>

          {(userRole === "admin" || userRole === "manager") && (
            <>
              <TabsContent value="settings" className="space-y-4">
                <Tabs defaultValue="shop" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="shop">Shop Settings</TabsTrigger>
                    <TabsTrigger value="technicians">Technicians</TabsTrigger>
                  </TabsList>
                  <TabsContent value="shop">
                    <ShopSettings />
                  </TabsContent>
                  <TabsContent value="technicians">
                    <TechnicianManagement />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="costs" className="space-y-4">
                <BusinessCosts />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <JobDetailsModal 
          job={selectedJob} 
          onClose={() => setSelectedJob(null)} 
          userRole={userRole}
        />
      )}
    </div>
  );
};

function getDefaultTab(userRole) {
  switch(userRole) {
    case "mechanic": return "technician";
    case "parts": return "parts";
    case "road": return "road";
    default: return "ai-analyzer";
  }
}

export default Index;
