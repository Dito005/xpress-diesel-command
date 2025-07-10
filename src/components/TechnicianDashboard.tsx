import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, Pause, CheckCircle, User, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/components/SessionProvider";

export const TechnicianDashboard = ({ userRole, onJobClick }) => {
  const { toast } = useToast();
  const [technicianJobs, setTechnicianJobs] = useState([]);
  const [currentShiftLog, setCurrentShiftLog] = useState(null);
  const [currentJobLog, setCurrentJobLog] = useState(null);
  const { session } = useSession();

  const fetchTechnicianData = async (techId: string) => {
    if (!techId) return;

    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from('job_assignments')
      .select(`job_id, jobs(*)`)
      .eq('tech_id', techId);

    if (assignmentsError) {
      console.error("Error fetching technician assignments:", assignmentsError);
    } else {
      const assignedJobs = assignmentsData.map(assignment => assignment.jobs).filter(Boolean);
      setTechnicianJobs(assignedJobs);
    }

    const { data: shiftLog, error: shiftError } = await supabase
      .from('time_logs')
      .select('*')
      .eq('tech_id', techId)
      .is('clock_out', null)
      .is('job_id', null)
      .single();

    if (shiftError && shiftError.code !== 'PGRST116') {
      console.error("Error fetching current shift log:", shiftError);
    } else {
      setCurrentShiftLog(shiftLog);
    }

    const { data: jobLog, error: jobLogError } = await supabase
      .from('time_logs')
      .select('*')
      .eq('tech_id', techId)
      .is('clock_out', null)
      .not('job_id', 'is', null)
      .single();

    if (jobLogError && jobLogError.code !== 'PGRST116') {
      console.error("Error fetching current job log:", jobLogError);
    } else {
      setCurrentJobLog(jobLog);
    }
  };

  useEffect(() => {
    const techId = session?.user?.id;
    if (!techId) return;

    fetchTechnicianData(techId);

    const channel = supabase
      .channel(`technician_dashboard_changes_${techId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => fetchTechnicianData(techId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_logs' }, () => fetchTechnicianData(techId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_assignments' }, () => fetchTechnicianData(techId))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const handleClockInOutShift = async () => {
    const techId = session?.user?.id;
    if (!techId) {
      toast({ variant: "destructive", title: "Error", description: "Technician not identified." });
      return;
    }

    if (currentShiftLog) {
      const { error } = await supabase
        .from('time_logs')
        .update({ clock_out: new Date().toISOString() })
        .eq('id', currentShiftLog.id);

      if (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to clock out." });
      } else {
        toast({ title: "Clocked Out", description: "You have clocked out of your shift." });
        fetchTechnicianData(techId);
      }
    } else {
      const { error } = await supabase
        .from('time_logs')
        .insert({ tech_id: techId, clock_in: new Date().toISOString(), type: 'shift' });

      if (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to clock in." });
      } else {
        toast({ title: "Clocked In", description: "You have clocked in for your shift." });
        fetchTechnicianData(techId);
      }
    }
  };

  const handleClockInOutJob = async (jobId: string) => {
    const techId = session?.user?.id;
    if (!techId) {
      toast({ variant: "destructive", title: "Error", description: "Technician not identified." });
      return;
    }

    if (currentJobLog && currentJobLog.job_id === jobId) {
      const { error } = await supabase
        .from('time_logs')
        .update({ clock_out: new Date().toISOString() })
        .eq('id', currentJobLog.id);

      if (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to clock out of job." });
      } else {
        toast({ title: "Job Clocked Out", description: "You have clocked out of the job." });
        fetchTechnicianData(techId);
      }
    } else {
      if (currentJobLog) {
        await supabase
          .from('time_logs')
          .update({ clock_out: new Date().toISOString() })
          .eq('id', currentJobLog.id);
      }

      const { error } = await supabase
        .from('time_logs')
        .insert({ tech_id: techId, job_id: jobId, clock_in: new Date().toISOString(), type: 'job' });

      if (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to clock in to job." });
      } else {
        toast({ title: "Job Clocked In", description: "You have clocked in to the job." });
        fetchTechnicianData(techId);
      }
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "assigned": return "bg-blue-100 text-blue-800 border-blue-300";
      case "in_progress": return "bg-green-100 text-green-800 border-green-300";
      case "completed": return "bg-gray-100 text-gray-800 border-gray-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      {userRole === "tech" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-r from-slate-700 to-slate-800 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Work Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">
                  {currentShiftLog ? "Clocked In" : "Clocked Out"}
                </div>
                <Button 
                  onClick={handleClockInOutShift}
                  variant={currentShiftLog ? "destructive" : "default"}
                  size="sm"
                  className={currentShiftLog ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                >
                  {currentShiftLog ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                  {currentShiftLog ? "Clock Out" : "Clock In"}
                </Button>
              </div>
              {currentShiftLog && (
                <div className="text-xs text-slate-300 mt-2">
                  Shift started at {new Date(currentShiftLog.clock_in).toLocaleTimeString()}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Today's Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">N/A</div>
              <div className="text-xs text-gray-500">Efficiency: N/A</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Jobs Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">N/A</div>
              <div className="text-xs text-gray-500">N/A Completed</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            {userRole === "tech" ? "My Assigned Jobs" : "All Technician Jobs"}
          </h3>
          {userRole === "tech" && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {technicianJobs.length} Active
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {technicianJobs.map((job) => (
            <Card 
              key={job.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-blue-500"
              onClick={() => onJobClick(job)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {job.truck_vin.slice(-6)} - {job.job_type}
                  </CardTitle>
                  <Badge className={getStatusColor(job.status)} variant="outline">
                    {job.status === "assigned" ? "Assigned" : 
                     job.status === "in_progress" ? "In Progress" : "Completed"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="font-medium text-gray-900">{job.description}</div>
                  <div className="text-sm text-gray-600">{job.customer_name}</div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    Est. {job.estimated_hours || 0}h
                    {job.actual_hours && ` • Worked: ${job.actual_hours}h`}
                  </div>
                  {job.priority === "high" && (
                    <Badge variant="destructive" className="text-xs">High Priority</Badge>
                  )}
                </div>

                {userRole === "tech" && (
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClockInOutJob(job.id);
                      }}
                      disabled={currentJobLog && currentJobLog.job_id !== job.id}
                    >
                      {currentJobLog && currentJobLog.job_id === job.id ? (
                        <>
                          <Pause className="h-4 w-4 mr-1" />
                          Clock Out Job
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-1" />
                          Clock In Job
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onJobClick(job);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {userRole !== "tech" && (
        <div className="text-center py-8 text-gray-500">
          <User className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p>Advanced technician management features coming soon...</p>
        </div>
      )}
    </div>
  );
};