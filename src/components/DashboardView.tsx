import { KpiCard } from "./KpiCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays } from 'date-fns';

const fetchKpiData = async () => {
  // This is a simplified version. A real implementation would use a dedicated DB function.
  const { data: jobs, error: jobsError } = await supabase.from('jobs').select('status, job_type');
  const { data: invoices, error: invoicesError } = await supabase.from('invoices').select('grand_total, status, created_at');
  const { data: techs, error: techsError } = await supabase.from('techs').select('name, efficiency').order('efficiency', { ascending: false });

  if (jobsError || invoicesError || techsError) {
    console.error(jobsError || invoicesError || techsError);
    return null;
  }

  const activeJobs = jobs.filter(j => ['open', 'in_progress', 'waiting_parts', 'waiting_approval'].includes(j.status));
  const roadCalls = activeJobs.filter(j => j.job_type === 'Road Service').length;

  const pendingInvoices = invoices.filter(i => ['unpaid', 'pending'].includes(i.status));
  const pendingTotal = pendingInvoices.reduce((sum, i) => sum + i.grand_total, 0);
  const avgAging = pendingInvoices.length > 0 ? pendingInvoices.reduce((sum, i) => sum + differenceInDays(new Date(), new Date(i.created_at)), 0) / pendingInvoices.length : 0;

  const approvalsNeeded = jobs.filter(j => j.status === 'waiting_approval').length;
  
  const topTech = techs.length > 0 ? techs[0] : { name: 'N/A', efficiency: 0 };
  const bottomTech = techs.length > 0 ? techs[techs.length - 1] : { name: 'N/A', efficiency: 0 };
  const avgEfficiency = techs.length > 0 ? techs.reduce((sum, t) => sum + t.efficiency, 0) / techs.length : 0;

  return {
    activeJobs: {
      metric: `${activeJobs.length} Active Jobs`,
      subtext: `${activeJobs.length - roadCalls} In-Shop / ${roadCalls} Road Calls`,
    },
    pendingPayments: {
      metric: `$${pendingTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Pending`,
      subtext: `${pendingInvoices.length} unpaid invoices / Avg aging: ${avgAging.toFixed(0)} days`,
    },
    approvalsNeeded: {
      metric: `${approvalsNeeded} Jobs Awaiting Approval`,
      subtext: `Mock: 2 need customer sign-off / 1 internal`,
    },
    techUtilization: {
        metric: `${avgEfficiency.toFixed(0)}% Avg Efficiency`,
        subtext: `Top: ${topTech.name} (${topTech.efficiency}%) / Bottom: ${bottomTech.name} (${bottomTech.efficiency}%)`,
    }
  };
};

export const DashboardView = () => {
  const { data: kpiData, isLoading } = useQuery({
    queryKey: ['dashboardKpis'],
    queryFn: fetchKpiData,
  });

  if (isLoading) {
    return <div className="text-center p-8">Loading dashboard data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-50">Dashboard</h2>
        <div className="flex items-center gap-2">
          <Select defaultValue="today">
            <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-slate-300">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard title="Active Jobs" metric={kpiData?.activeJobs.metric || '...'} subtext={kpiData?.activeJobs.subtext || '...'} color="blue" />
        <KpiCard title="Jobs Pending Payment" metric={kpiData?.pendingPayments.metric || '...'} subtext={kpiData?.pendingPayments.subtext || '...'} color="purple" />
        <KpiCard title="Approvals Needed" metric={kpiData?.approvalsNeeded.metric || '...'} subtext={kpiData?.approvalsNeeded.subtext || '...'} color="blue" />
        <KpiCard title="Today’s Revenue" metric="$2,400 Earned Today" subtext="Labor: $1,800 / Parts: $600" color="green" />
        <KpiCard title="Estimated Profit" metric="$865 Profit So Far" subtext="Includes shop fees / Excludes taxes" color="green" />
        <KpiCard title="Technician Utilization" metric={kpiData?.techUtilization.metric || '...'} subtext={kpiData?.techUtilization.subtext || '...'} color="purple" />
      </div>
    </div>
  );
};