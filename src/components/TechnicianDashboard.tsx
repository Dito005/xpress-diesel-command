"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, Pause, CheckCircle, User, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { JobDetailsModal } from "./JobDetailsModal";

// Define types for better readability
type Job = {
  id: string;
  truck_vin: string;
  job_type: string;
  status: string;
  description: string;
  customer_name: string;
  estimated_hours: number;
  priority: string;
};

type TimeLog = {
  id: string;
  job_id: string | null;
  clock_in: string;
  clock_out: string | null;
  jobs?: { status: string };
};

type TechnicianProfile = {
  efficiency_by_type: Record<string, number>;
};

export const TechnicianDashboard = ({ userRole, userId }: { userRole: string; userId: string }) => {
  const { toast } = useToast();
  const [technicianJobs, setTechnicianJobs] = useState<Job[]>([]);
  const [currentShiftLog, setCurrentShiftLog] = useState<TimeLog | null>(null);
  const [currentJobLog, setCurrentJobLog] = useState<TimeLog | null>(null);
  const [todaysLogs, setTodaysLogs] = useState<TimeLog[]>([]);
  const [technicianProfile, setTechnicianProfile] = useState<TechnicianProfile | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const supabase = createClient();

  useEffect(() => {
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

    if (userId) {
      fetchTechnicianData(userId);
      const channel = supabase.channel(`technician_dashboard_changes_${userId}`).on('postgres_changes', { event: '*', schema: 'public' }, () => fetchTechnicianData(userId)).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [userId, supabase]);

  const { todaysHours, jobsCompletedToday, jobsWorkedOnToday, averageEfficiency, hoursWorkedPerJob } = useMemo(() => {
    let totalDuration = 0;
    const workedOnJobIds = new Set<string>();
    const completedJobIds = new Set<string>();
    const jobHours = new Map<string, number>();
    
    todaysLogs.forEach((log) => {
      if (log.clock_out) {
        const duration = new Date(log.clock_out).getTime() - new Date(log.clock_in).getTime();
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

  const handleJobClick = (job: Job) => setSelectedJob(job);

  const getStatusColor = (status: string) => {
    switch(status) {
      case "assigned": return "bg-blue-100 text-blue-800 border-blue-300";
      case "in_progress": return "bg-green-100 text-green-800 border-green-300";
      case "completed": return "bg-gray-100 text-gray-800 border-gray-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <>
      <div className="space-y-6">
        {userRole === "tech" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-r from-secondary to-background text-foreground border">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Work Status</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">{currentShiftLog ? "Clocked In" : "Clocked Out"}</div>
                  <Button onClick={handleClockInOutShift} variant={currentShiftLog ? "destructive" : "default"} size="sm" className={currentShiftLog ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}>
                    {currentShiftLog ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                    {currentShiftLog ? "Clock Out" : "Clock In"}
                  </Button>
                </div>
                {currentShiftLog && (<div className="text-xs text-muted-foreground mt-2">Shift started at {new Date(currentShiftLog.clock_in).toLocaleTimeString()}</div>)}
              </CardContent>
            </Card>
            <Card className="border">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" />Today's Hours</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todaysHours}h</div>
                <div className="text-xs text-muted-foreground">Efficiency: {averageEfficiency}%</div>
              </CardContent>
            </Card>
            <Card className="border">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><CheckCircle className="h-4 w-4" />Jobs Today</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{jobsWorkedOnToday}</div>
                <div className="text-xs text-muted-foreground">{jobsCompletedToday} Completed</div>
              </CardContent>
            </Card>
          </div>
        )}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold flex items-center gap-2"><Wrench className="h-5 w-5" />My Assigned Jobs</h3>
            <Badge variant="secondary">{technicianJobs.length} Active</Badge>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {technicianJobs.map((job) => {
              const workedHours = hoursWorkedPerJob.get(job.id);
              return (
                <Card key={job.id} className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-primary" onClick={() => handleJobClick(job)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold">{job.truck_vin.slice(-6)} - {job.job_type}</CardTitle>
                      <Badge className={getStatusColor(job.status)} variant="outline">{job.status.replace('_', ' ')}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="font-medium">{job.description}</div>
                      <div className="text-sm text-muted-foreground">{job.customer_name}</div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" />Est. {job.estimated_hours || 0}h{workedHours && ` • Worked: ${workedHours}h`}</div>
                      {job.priority === "high" && (<Badge variant="destructive" className="text-xs">High Priority</Badge>)}
                    </div>
                    {userRole === "tech" && (
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); handleClockInOutJob(job.id); }} disabled={!!currentJobLog && currentJobLog.job_id !== job.id}>
                          {currentJobLog && currentJobLog.job_id === job.id ? (<><Pause className="h-4 w-4 mr-1" />Clock Out Job</>) : (<><Play className="h-4 w-4 mr-1" />Clock In Job</>)}
                        </Button>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleJobClick(job); }}>View Details</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
      {selectedJob && (
        <JobDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} userRole={userRole} onGenerateInvoice={() => {}} />
      )}
    </>
  );
};