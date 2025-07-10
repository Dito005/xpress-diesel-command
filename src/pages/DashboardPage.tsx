import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobBoard } from "@/components/JobBoard";
import { TechnicianManagement } from "@/components/TechnicianManagement";
import { InvoicingSystem } from "@/components/InvoicingSystem";
import { ReportsAnalytics } from "@/components/ReportsAnalytics";
import { Card } from "@/components/ui/card";
import { DollarSign, Wrench, Users, FileText } from "lucide-react";

const KpiCard = ({ title, value, subtext, icon: Icon, color }) => (
  <Card className={`p-6 hover:shadow-lg transition-shadow duration-300 ease-in-out hover:shadow-${color}-500/20`}>
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <Icon className={`h-6 w-6 text-${color}-500`} />
    </div>
    <div className="mt-2">
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{subtext}</p>
    </div>
  </Card>
);

const DashboardOverview = ({ onJobClick, onGenerateInvoice }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      <KpiCard title="Active Jobs" value="12" subtext="In Shop: 8 • Road: 4" icon={Wrench} color="blue" />
      <KpiCard title="Jobs Pending Payment" value="3" subtext="Awaiting customer approval" icon={FileText} color="yellow" />
      <KpiCard title="Approvals Needed" value="2" subtext="Waiting on parts/customer" icon={Users} color="orange" />
      <KpiCard title="Revenue Today" value="$8,450" subtext="Labor: $5.2k • Parts: $3.2k" icon={DollarSign} color="green" />
      <KpiCard title="Estimated Profit" value="$3,120" subtext="Excludes taxes/fees" icon={DollarSign} color="green" />
      <KpiCard title="Tech Utilization" value="88%" subtext="Billed: 32h / Actual: 36h" icon={Users} color="purple" />
    </div>
    <JobBoard onJobClick={onJobClick} onGenerateInvoice={onGenerateInvoice} />
  </div>
);

export const DashboardPage = ({ onJobClick, onGenerateInvoice, onOpenInvoiceEditor, isInvoiceEditorOpen, setIsInvoiceEditorOpen, editingInvoice }) => {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="technicians">Technicians</TabsTrigger>
        <TabsTrigger value="invoicing">Invoicing</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <DashboardOverview onJobClick={onJobClick} onGenerateInvoice={onGenerateInvoice} />
      </TabsContent>
      <TabsContent value="technicians">
        <TechnicianManagement />
      </TabsContent>
      <TabsContent value="invoicing">
        <InvoicingSystem 
          isOpen={isInvoiceEditorOpen} 
          setIsOpen={setIsInvoiceEditorOpen} 
          editingInvoice={editingInvoice} 
          onSuccess={() => setIsInvoiceEditorOpen(false)} 
          onOpenEditor={onOpenInvoiceEditor} 
        />
      </TabsContent>
      <TabsContent value="reports">
        <ReportsAnalytics />
      </TabsContent>
    </Tabs>
  );
};