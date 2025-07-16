"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, Pause, CheckCircle, User, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { JobDetailsModal } from "./JobDetailsModal";

export const TechnicianDashboard = ({ userRole }: { userRole: string }) => {
  const { toast } = useToast();
  const [technicianJobs, setTechnicianJobs] = useState([]);
  const [currentShiftLog, setCurrentShiftLog] = useState(null);
  const [currentJobLog, setCurrentJobLog] = useState(null);
  const [todaysLogs, setTodaysLogs] = useState([]);
  const [technicianProfile, setTechnicianProfile] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, [supabase.auth]);

  const fetchTechnicianData = async (techId: string) => {
    if (!techId) return;

    const techProfilePromise = supabase.from('techs').select('*').eq('id', techId).single();
    const assignmentsPromise = supabase.from('job_assignments').select(`job_id, jobs(*)`).eq('tech_id', techId);
    const shiftLogPromise = supabase.from('time_logs').select('*').eq('tech_id', techId).is('clock_out', null).is('job_id', null).single();
    const jobLogPromise = supabase.from('time_logs').select('*').eq('tech_id', techId).is('clock_out', null).not('job_id', 'is', null).single();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysLogsPromise = supabase.from('time_logs').select('*, jobs(status)').eq('tech_id', techId).gte('clock_in', today.toISOString());

    const [
      { data: techProfileData, error: techProfileError },
      { data: assignmentsData, error: assignmentsError },
      { data: shiftLog, error: shiftError },
      { data: jobLog, error: jobLogError },
      { data: todaysLogsData, error: todaysLogsError }
    ] = await Promise.all([techProfilePromise, assignmentsPromise, shiftLogPromise, jobLogPromise, todaysLogsPromise]);

    if (techProfileError) console.error("Error fetching technician profile:", techProfileError); else setTechnicianProfile(techProfileData);
    if (assignmentsError) console.error("Error fetching assignments:", assignmentsError); else setTechnicianJobs(assignmentsData.map((a: any) => a.jobs).filter(Boolean));
    if (shiftError && shiftError.code !== 'PGRST116') console.error("Error fetching shift log:", shiftError); else setCurrentShiftLog(shiftLog);
    if (jobLogError && jobLogError.code !== 'PGRST116') console.error("Error fetching job log:", jobLogError); else setCurrentJobLog(jobLog);
    if (todaysLogsError) console.error("Error fetching today's logs:", todaysLogsError); else setTodaysLogs(todaysLogsData || []);
  };

  useEffect(() => {
    if (!userId) return;
    fetchTechnicianData(userId);
    const channel = supabase.channel(`technician_dashboard_changes_${userId}`).on('postgres_changes', { event: '*', schema: 'public' }, () => fetchTechnicianData(userId)).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const { todaysHours, jobsCompletedToday, jobsWorkedOnToday, averageEfficiency, hoursWorkedPerJob } = useMemo(() => {
    let totalDuration = 0;
    const workedOnJobIds = new Set<string>();
    const completedJobIds = new Set<string>();
    const jobHours = new Map<string, number>();
    
    todaysLogs.forEach((log: any) => {
      if (log.clock_out) {
        const duration = new Date(log.clock_out).getTime() - new IDate(log.clock_in).getTime();
        totalDuration += duration;
        if (log.job_id) {
          const currentHours = jobHours.get(log.job_id) || 0;
          jobHours.set(log.job_id, currentHours + duration);
        }
      }
      if (log.job_id) {
        workedOnJobIds.add(log.job_id);
        if (log.jobs?.status === 'completed') completedJobIds.add(log.job_id);
      }
    });

    const hours = (totalDuration / 3600000).toFixed(1);
    let avgEfficiency = 0;
    if (technicianProfile?.efficiency_by_type) {
      const efficiencies = Object.values(technicianProfile.efficiency_by_type).map(Number).filter(n => !isNaN(n) && n > 0);
      if (efficiencies.length > 0) avgEfficiency = efficiencies.reduce((sum, val) => sum + val, 0) / efficiencies.length;
    }
    const jobHoursInHours = new Map<string, string>();
    for (const [jobId, durationMs] of jobHours.entries()) jobHoursInHours.set(jobId, (durationMs / 3600000).toFixed(1));

    return { todaysHours: hours, jobsCompletedToday: completedJobIds.size, jobsWorkedOnToday: workedOnJobIds.size, averageEfficiency: avgEfficiency.toFixed(0), hoursWorkedPerJob: jobHoursInHours };
  }, [todaysLogs, technicianProfile]);

  const handleClockInOutShift = async () => {
    if (!userId) { toast({ variant: "destructive", title: "Error", description: "Technician not identified." }); return; }
    if (currentShiftLog) {
      const { error } = await supabase.from('time_logs').update({ clock_out: new Date().toISOString() }).eq('id', currentShiftLog.id);
      if (error) toast({ variant: "destructive", title: "Error", description: "Failed to clock out." }); else toast({ title: "Clocked Out", description: "You have clocked out of your shift." });
    } else {
      const { error } = await supabase.from('time_logs').insert({ tech_id: userId, clock_in: new Date().toISOString(), type: 'shift' });
      if (error) toast({ variant: "destructive", title: "Error", description: "Failed to clock in." }); else toast({ title: "Clocked In", description: "You have clocked in for your shift." });
    }
  };

  const handleClockInOutJob = async (jobId: string) => {
    if (!userId) { toast({ variant: "destructive", title: "Error", description: "Technician not identified." }); return; }
    if (currentJobLog && currentJobLog.job_id === jobId) {
      const { error } = await supabase.from('time_logs').update({ clock_out: new Date().toISOString() }).eq('id', currentJobLog.id);
      if (error) toast({ variant: "destructive", title: "Error", description: "Failed to clock out of job." }); else toast({ title: "Job Clocked Out", description: "You have clocked out of the job." });
    } else {
      if (currentJobLog) await supabase.from('time_logs').update({ clock_out: new Date().toISOString() }).eq('id', currentJobLog.id);
      const { error } = await supabase.from('time_logs').insert({ tech_id: userId, job_id: jobId, clock_in: new Date().toISOString(), type: 'job' });
      if (error) toast({ variant: "destructive", title: "Error", description: "Failed to clock in to job." }); else toast({ title: "Job Clocked In", description: "You have clocked in to the job." });
    }
  };

  const handleJobClick = (job) => setSelectedJob(job);

  return (
    <>
      <div className="space-y-6">
        {/* ... existing JSX ... */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {technicianJobs.map((job: any) => (
            <Card key={job.id} className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-primary" onClick={() => handleJobClick(job)}>
              {/* ... card content ... */}
            </Card>
          ))}
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