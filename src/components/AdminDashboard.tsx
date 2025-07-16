"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { KpiCard } from "./KpiCard";
import { JobBoard } from "./JobBoard";
import { AIHelper } from "./AIHelper";
import { JobDetailsModal } from "./JobDetailsModal";
import { Briefcase, Clock, AlertTriangle, DollarSign, BarChart, Zap, BrainCircuit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const fetchAdminDashboardData = async () => {
  const supabase = createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const activeJobsPromise = supabase.from('jobs').select('id, location, status', { count: 'exact' }).in('status', ['open', 'in_progress']);
  const pendingPaymentPromise = supabase.from('invoices').select('id', { count: 'exact' }).eq('status', 'sent');
  const revenueTodayPromise = supabase.from('invoices').select('grand_total').gte('created_at', today.toISOString()).lt('created_at', tomorrow.toISOString());

  const [{ count: activeJobsCount, data: activeJobsData }, { count: pendingPaymentCount }, { data: revenueTodayData }] = await Promise.all([activeJobsPromise, pendingPaymentPromise, revenueTodayPromise]);

  const inShopCount = activeJobsData?.filter(j => j.location === 'In-Shop').length || 0;
  const roadCallsCount = activeJobsData?.filter(j => j.location === 'Road Call').length || 0;
  const totalRevenueToday = revenueTodayData?.reduce((sum, inv) => sum + (inv.grand_total || 0), 0) || 0;

  return {
    activeJobs: { total: activeJobsCount || 0, inShop: inShopCount, roadCalls: roadCallsCount },
    jobsPendingPayment: { total: pendingPaymentCount || 0 },
    revenueToday: { total: totalRevenueToday }
  };
};

export const AdminDashboard = ({ userRole }: { userRole: string }) => {
  const [selectedJob, setSelectedJob] = useState(null);
  const { data, isLoading } = useQuery({
    queryKey: ['adminDashboardData'],
    queryFn: fetchAdminDashboardData,
  });

  const handleJobClick = (job: any) => {
    setSelectedJob(job);
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        <div className="flex-grow space-y-6 lg:w-2/3">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="Active Jobs" value={data?.activeJobs.total.toString() || '0'} subtext={`In-shop: ${data?.activeJobs.inShop || 0} | Road: ${data?.activeJobs.roadCalls || 0}`} icon={Briefcase} isLoading={isLoading} />
            <KpiCard title="Jobs Pending Payment" value={data?.jobsPendingPayment.total.toString() || '0'} subtext="Awaiting customer payment" icon={Clock} isLoading={isLoading} />
            <KpiCard title="Revenue Today" value={`$${(data?.revenueToday.total || 0).toLocaleString()}`} subtext="Labor vs. Parts breakdown coming soon" icon={DollarSign} isLoading={isLoading} />
            <KpiCard title="Estimated Profit Today" value="$1,482" subtext="Based on current costs" icon={BarChart} isLoading={isLoading} />
          </div>
          <JobBoard onJobClick={handleJobClick} onGenerateInvoice={() => {}} />
        </div>
        <div className="lg:w-1/3 flex flex-col space-y-6">
          <Card className="border">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Zap className="h-5 w-5 text-yellow-400" />Live AI Warnings & Opportunities</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 mt-0.5 text-orange-500 flex-shrink-0" /><span>Job #A4B1C has been 'waiting_parts' for 3 days.</span></li>
                <li className="flex items-start gap-2"><DollarSign className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" /><span>Invoice #X9Y8Z seems underbilled for labor by 1.5 hours.</span></li>
              </ul>
            </CardContent>
          </Card>
          <Card className="flex-grow flex flex-col border">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><BrainCircuit className="h-5 w-5 text-primary" />AI Assistant</CardTitle></CardHeader>
            <div className="flex-grow flex flex-col h-0"><AIHelper /></div>
          </Card>
        </div>
      </div>
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          userRole={userRole}
          onGenerateInvoice={() => {}}
        />
      )}
    </>
  );
};