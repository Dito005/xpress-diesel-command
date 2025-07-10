import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobBoard } from "@/components/JobBoard";
import { TechnicianManagement } from "@/components/TechnicianManagement";
import { InvoicingSystem } from "@/components/InvoicingSystem";
import { ReportsAnalytics } from "@/components/ReportsAnalytics";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Wrench, Users, FileText, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const KpiCard = ({ title, value, subtext, icon: Icon, color, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="p-6 bg-card/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
        <div className="mt-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-40 mt-1" />
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 hover:shadow-lg transition-shadow duration-300 ease-in-out hover:shadow-${color}-500/20 bg-card/80 backdrop-blur-sm`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
      </div>
      <div className="mt-2">
        <p className="text-3xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{subtext}</p>
      </div>
    </Card>
  );
};

const fetchDashboardData = async () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const jobsPromise = supabase.from('jobs').select('id, status, location');
  const invoicesPromise = supabase.from('invoices').select('id, status, job_id');
  const paymentsPromise = supabase.from('payments').select('amount, invoice_id').gte('paid_at', todayStart.toISOString());
  const timeLogsPromise = supabase.from('time_logs').select('clock_in, clock_out, job_id, techs(hourly_rate)');
  const partsUsedPromise = supabase.from('parts_used').select('quantity, job_id, parts(cost)');

  const [
    { data: jobs, error: jobsError },
    { data: invoices, error: invoicesError },
    { data: payments, error: paymentsError },
    { data: timeLogs, error: timeLogsError },
    { data: partsUsed, error: partsUsedError }
  ] = await Promise.all([
    jobsPromise, invoicesPromise, paymentsPromise, timeLogsPromise, partsUsedPromise
  ]);

  if (jobsError || invoicesError || paymentsError || timeLogsError || partsUsedError) {
    console.error("Error fetching dashboard data:", jobsError || invoicesError || paymentsError || timeLogsError || partsUsedError);
    throw new Error("Failed to fetch dashboard data");
  }

  return { jobs, invoices, payments, timeLogs, partsUsed };
};

const DashboardKpis = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboardKpiData'],
    queryFn: fetchDashboardData,
  });

  const kpis = useMemo(() => {
    if (!data) return {
      activeJobs: 0,
      inShop: 0,
      onRoad: 0,
      pendingPayment: 0,
      approvalsNeeded: 0,
      revenueToday: '$0',
      profitToday: '$0',
      hoursClockedToday: '0h',
    };

    const { jobs, invoices, payments, timeLogs, partsUsed } = data;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const activeJobsList = jobs.filter(j => ['open', 'in_progress', 'waiting_parts'].includes(j.status));
    
    const revenueToday = payments.reduce((sum, p) => sum + p.amount, 0);

    const invoiceIdsPaidToday = payments.map(p => p.invoice_id);
    const jobsForPaidInvoices = invoices.filter(i => invoiceIdsPaidToday.includes(i.id)).map(i => i.job_id);

    const laborCostForPaidInvoices = timeLogs
      .filter(tl => jobsForPaidInvoices.includes(tl.job_id) && tl.clock_out && tl.techs)
      .reduce((sum, tl) => {
        const durationMs = new Date(tl.clock_out).getTime() - new Date(tl.clock_in).getTime();
        const durationHours = durationMs / 3600000;
        return sum + (durationHours * (tl.techs as any).hourly_rate);
      }, 0);

    const partsCostForPaidInvoices = partsUsed
      .filter(pu => jobsForPaidInvoices.includes(pu.job_id) && pu.parts)
      .reduce((sum, pu) => sum + (pu.quantity * (pu.parts as any).cost), 0);

    const totalCostToday = laborCostForPaidInvoices + partsCostForPaidInvoices;
    const profitToday = revenueToday - totalCostToday;

    const hoursClockedToday = timeLogs
      .filter(tl => new Date(tl.clock_in) >= todayStart && tl.clock_out)
      .reduce((sum, tl) => {
        const durationMs = new Date(tl.clock_out).getTime() - new Date(tl.clock_in).getTime();
        return sum + (durationMs / 3600000);
      }, 0);

    return {
      activeJobs: activeJobsList.length,
      inShop: activeJobsList.filter(j => j.location !== 'road').length,
      onRoad: activeJobsList.filter(j => j.location === 'road').length,
      pendingPayment: invoices.filter(i => ['pending', 'sent'].includes(i.status)).length,
      approvalsNeeded: jobs.filter(j => j.status === 'waiting_approval').length,
      revenueToday: `$${revenueToday.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      profitToday: `$${profitToday.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      hoursClockedToday: `${hoursClockedToday.toFixed(1)}h`,
    };
  }, [data]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      <KpiCard title="Active Jobs" value={kpis.activeJobs} subtext={`In Shop: ${kpis.inShop} • Road: ${kpis.onRoad}`} icon={Wrench} color="blue" isLoading={isLoading} />
      <KpiCard title="Jobs Pending Payment" value={kpis.pendingPayment} subtext="Awaiting customer payment" icon={FileText} color="yellow" isLoading={isLoading} />
      <KpiCard title="Approvals Needed" value={kpis.approvalsNeeded} subtext="Waiting on parts/customer" icon={AlertCircle} color="orange" isLoading={isLoading} />
      <KpiCard title="Revenue Today" value={kpis.revenueToday} subtext="From all payments received" icon={DollarSign} color="green" isLoading={isLoading} />
      <KpiCard title="Profit Today" value={kpis.profitToday} subtext="Revenue minus labor & parts cost" icon={CheckCircle} color="green" isLoading={isLoading} />
      <KpiCard title="Hours Clocked Today" value={kpis.hoursClockedToday} subtext="Total hours from all techs" icon={Users} color="purple" isLoading={isLoading} />
    </div>
  );
};

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
        <div className="space-y-6">
          <DashboardKpis />
          <JobBoard onJobClick={onJobClick} onGenerateInvoice={onGenerateInvoice} />
        </div>
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