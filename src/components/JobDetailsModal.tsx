import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Clock, DollarSign, User, Truck, FileText, Camera, Save, Play, Pause } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "./SessionProvider";

interface JobDetailsModalProps {
  job: {
    id: string;
    notes?: string;
    actual_service?: string;
    status?: string;
    estimated_hours?: number;
    truck_vin?: string;
    job_type?: string;
    customer_name?: string;
    customer_concern?: string;
    estimatedRevenue?: number;
    actualCost?: number;
    profitMargin?: number;
    [key: string]: any;
  } | null;
  onClose: () => void;
  userRole: string;
  onGenerateInvoice: (job: any) => void;
}

interface TimeLog {
  id: string;
  clock_in?: string;
  clock_out?: string;
  [key: string]: any;
}

export const JobDetailsModal = ({ job, onClose, userRole, onGenerateInvoice }: JobDetailsModalProps) => {
  const { toast } = useToast();
  const supabase = createClient();
  const [notes, setNotes] = useState(job?.notes || "");
  const [actualService, setActualService] = useState(job?.actual_service || "");
  const [jobStatus, setJobStatus] = useState(job?.status || "open");
  const [currentJobTimeLog, setCurrentJobTimeLog] = useState<TimeLog | null>(null);
  const { session } = useSession();
  const [currentTechId, setCurrentTechId] = useState<string | null>(null);
  const [assignedTechNames, setAssignedTechNames] = useState('');
  const [timeTracking, setTimeTracking] = useState({ estimated: 0, actual: 0 });

  useEffect(() => {
    if (!job) return;

    setNotes(job.notes || "");
    setActualService(job.actual_service || "");
    setJobStatus(job.status || "open");

    const fetchDetails = async () => {
      const techId = session?.user?.id;
      if (techId) setCurrentTechId(techId);

      const timeLogsPromise = supabase.from('time_logs').select('clock_in, clock_out').eq('job_id', job.id);
      const assignmentsPromise = supabase.from('job_assignments').select('techs(name)').eq('job_id', job.id);
      let currentLogPromise: PromiseLike<{ data: any; error: any; }> = Promise.resolve({ data: null, error: null });
      if (techId) {
        currentLogPromise = supabase.from('time_logs').select('*').eq('tech_id', techId).eq('job_id', job.id).is('clock_out', null).single();
      }

      const [
        { data: timeLogs, error: timeLogsError },
        { data: assignments, error: assignError },
        { data: currentLog, error: currentLogError }
      ] = await Promise.all([timeLogsPromise, assignmentsPromise, currentLogPromise]);

      if (timeLogsError) console.error("Error fetching time logs for job:", timeLogsError);
      else {
        const actualHours = timeLogs.reduce((total, log) => {
          if (log.clock_in && log.clock_out) {
            const duration = new Date(log.clock_out).getTime() - new Date(log.clock_in).getTime();
            return total + (duration / 3600000);
          }
          return total;
        }, 0);
        setTimeTracking({ estimated: job.estimated_hours || 0, actual: actualHours });
      }

      if (assignError) console.error("Error fetching job assignments:", assignError);
      else {
        const names = assignments.map((a: any) => a.techs?.name).filter(Boolean).join(', ');
        setAssignedTechNames(names);
      }

      if (currentLogError && currentLogError.code !== 'PGRST116') console.error("Error fetching current job time log:", currentLogError);
      else setCurrentJobTimeLog(currentLog);
    };

    fetchDetails();
  }, [job, session]);

  if (!job) return null;

  const getStatusColor = (status: string) => {
    switch(status) {
      case "open": return "bg-gray-100 text-gray-800 border-gray-300";
      case "in_progress": return "bg-blue-100 text-blue-800 border-blue-300";
      case "waiting_parts": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "waiting_approval": return "bg-orange-100 text-orange-800 border-orange-300";
      case "completed": return "bg-green-100 text-green-800 border-green-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getProfitColor = (margin: number) => {
    if (margin >= 80) return "text-green-500";
    if (margin >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const handleClockInOutJob = async () => {
    if (!currentTechId || !job?.id) {
      toast({ variant: "destructive", title: "Error", description: "Technician not identified or job ID missing." });
      return;
    }

    if (currentJobTimeLog) {
      const { error } = await supabase
        .from('time_logs')
        .update({ clock_out: new Date().toISOString() })
        .eq('id', currentJobTimeLog.id);

      if (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to clock out of job." });
      } else {
        toast({ title: "Job Clocked Out", description: "You have clocked out of this job." });
        setCurrentJobTimeLog(null);
      }
    } else {
      const { data: newLog, error } = await supabase
        .from('time_logs')
        .insert({ tech_id: currentTechId, job_id: job.id, clock_in: new Date().toISOString(), type: 'job' })
        .select()
        .single();

      if (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to clock in to job." });
      } else {
        toast({ title: "Job Clocked In", description: "You have clocked in to this job." });
        setCurrentJobTimeLog(newLog);
      }
    }
  };

  const handleSaveChanges = async () => {
    if (!job?.id) return;

    const { error } = await supabase
      .from('jobs')
      .update({
        notes: notes,
        actual_service: actualService,
        status: jobStatus,
      })
      .eq('id', job.id);

    if (error) {
      toast({ variant: "destructive", title: "Error saving changes", description: error.message });
    } else {
      toast({ title: "Changes Saved", description: "Job details updated successfully." });
      onClose();
    }
  };

  return (
    <Dialog open={!!job} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Truck className="h-6 w-6 text-primary" />
            Job Details - {job.truck_vin?.slice(-6) || 'N/A'}
            <Badge className={getStatusColor(job.status || '')} variant="outline">
              {job.status?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'N/A'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <Card className="bg-card/80">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Job Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Unit Number</Label>
                    <div className="font-semibold">{job.truck_vin?.slice(-6) || 'N/A'}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Job Type</Label>
                    <div className="font-semibold">{job.job_type || 'N/A'}</div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Customer</Label>
                  <div className="font-semibold">{job.customer_name || 'N/A'}</div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Complaint</Label>
                  <div className="text-foreground/90">{job.customer_concern || job.notes || 'N/A'}</div>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Assigned to:</span>
                  <span className="font-medium">{assignedTechNames || 'Unassigned'}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/80">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Time Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Estimated Hours</Label>
                    <div className="text-xl font-bold text-blue-500">{timeTracking.estimated.toFixed(1)}h</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Clocked Hours</Label>
                    <div className="text-xl font-bold text-green-500">{timeTracking.actual.toFixed(1)}h</div>
                  </div>
                </div>
                
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Progress</div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min((timeTracking.actual / (timeTracking.estimated || 1)) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {Math.round((timeTracking.actual / (timeTracking.estimated || 1)) * 100)}% Complete
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {(userRole === "admin" || userRole === "manager") && (
              <Card className="bg-card/80">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Profitability
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Est. Revenue</Label>
                      <div className="text-xl font-bold text-green-500">
                        ${job.estimatedRevenue?.toLocaleString() || '0'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Actual Cost</Label>
                      <div className="text-xl font-bold text-red-500">
                        ${job.actualCost?.toLocaleString() || '0'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 p-3 rounded-lg border border-border/50">
                    <div className="text-sm text-muted-foreground mb-1">Profit Margin</div>
                    <div className={`text-2xl font-bold ${getProfitColor(job.profitMargin || 0)}`}>
                      {job.profitMargin || 0}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Net: ${((job.estimatedRevenue || 0) - (job.actualCost || 0)).toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-card/80">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Job Notes & Work Performed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="jobNotes">Internal Notes</Label>
                  <Textarea
                    id="jobNotes"
                    placeholder="Add internal job notes, findings, or updates..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="actualService">Actual Work Performed</Label>
                  <Textarea
                    id="actualService"
                    placeholder="Describe the actual work performed on the job..."
                    value={actualService}
                    onChange={(e) => setActualService(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Add Photo
                  </Button>
                  <Button size="sm" className="flex items-center gap-2" onClick={handleSaveChanges}>
                    <Save className="h-4 w-4" />
                    Save Updates
                  </Button>
                </div>
              </CardContent>
            </Card>

            {userRole === "tech" && (
              <Card className="bg-card/80">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={handleClockInOutJob}
                  >
                    {currentJobTimeLog ? (
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
                  <Button variant="outline" className="w-full">
                    Request Parts
                  </Button>
                  <Button variant="outline" className="w-full">
                    Mark Complete
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          {(userRole === "admin" || userRole === "manager") && (
            <Button variant="outline" onClick={() => onGenerateInvoice(job)}>
              Generate Invoice
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {(userRole === "admin" || userRole === "manager") && (
            <Button className="bg-primary hover:bg-primary/90" onClick={handleSaveChanges}>
              Save Changes
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};