import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Clock, DollarSign, User, Truck, FileText, Camera, Save, Play, Pause } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/components/SessionProvider";

export const JobDetailsModal = ({ job, onClose, userRole, onGenerateInvoice }) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState(job?.notes || "");
  const [actualService, setActualService] = useState(job?.actual_service || "");
  const [jobStatus, setJobStatus] = useState(job?.status || "open");
  const [currentJobTimeLog, setCurrentJobTimeLog] = useState(null);
  const { session } = useSession();
  const [currentTechId, setCurrentTechId] = useState(null);
  const [assignedTechNames, setAssignedTechNames] = useState('');

  useEffect(() => {
    const fetchUserAndLog = async () => {
      if (!session?.user?.id) return;

      setCurrentTechId(session.user.id);
      if (job?.id) {
        const { data: log, error } = await supabase
          .from('time_logs')
          .select('*')
          .eq('tech_id', session.user.id)
          .eq('job_id', job.id)
          .is('clock_out', null)
          .single();
        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching current job time log:", error);
        } else {
          setCurrentJobTimeLog(log);
        }

        const { data: assignments, error: assignError } = await supabase
          .from('job_assignments')
          .select('techs(name)')
          .eq('job_id', job.id);

        if (assignError) {
          console.error("Error fetching job assignments:", assignError);
        } else {
          const names = assignments.map((assign: { techs: Array<{ name: string | null }> | null }) => 
            assign.techs?.[0]?.name
          ).filter(Boolean).join(', ');
          setAssignedTechNames(names);
        }
      }
    };
    fetchUserAndLog();
  }, [job?.id, session]);

  if (!job) return null;

  const getStatusColor = (status) => {
    switch(status) {
      case "open": return "bg-gray-100 text-gray-800 border-gray-300";
      case "in_progress": return "bg-blue-100 text-blue-800 border-blue-300";
      case "waiting_parts": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "waiting_approval": return "bg-orange-100 text-orange-800 border-orange-300";
      case "completed": return "bg-green-100 text-green-800 border-green-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getProfitColor = (margin) => {
    if (margin >= 80) return "text-green-600";
    if (margin >= 60) return "text-yellow-600";
    return "text-red-600";
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
      const { error } = await supabase
        .from('time_logs')
        .insert({ tech_id: currentTechId, job_id: job.id, clock_in: new Date().toISOString(), type: 'job' });

      if (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to clock in to job." });
      } else {
        toast({ title: "Job Clocked In", description: "You have clocked in to this job." });
        const { data: newLog } = await supabase
          .from('time_logs')
          .select('*')
          .eq('tech_id', currentTechId)
          .eq('job_id', job.id)
          .is('clock_out', null)
          .single();
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Truck className="h-6 w-6 text-blue-600" />
            Job Details - {job.truck_vin?.slice(-6) || 'N/A'}
            <Badge className={getStatusColor(job.status)} variant="outline">
              {job.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Job Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Unit Number</Label>
                    <div className="font-semibold">{job.truck_vin?.slice(-6) || 'N/A'}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Job Type</Label>
                    <div className="font-semibold">{job.job_type || 'N/A'}</div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Customer</Label>
                  <div className="font-semibold">{job.customer_name || 'N/A'}</div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Complaint</Label>
                  <div className="text-gray-900">{job.customer_concern || job.notes || 'N/A'}</div>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Assigned to:</span>
                  <span className="font-medium">{assignedTechNames || 'Unassigned'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Time Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Estimated Hours</Label>
                    <div className="text-xl font-bold text-blue-600">{job.estimated_hours || 0}h</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Clocked Hours</Label>
                    <div className="text-xl font-bold text-green-600">{job.actual_hours || 0}h</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Progress</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(((job.actual_hours || 0) / (job.estimated_hours || 1)) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round(((job.actual_hours || 0) / (job.estimated_hours || 1)) * 100)}% Complete
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {(userRole === "admin" || userRole === "manager") && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Profitability
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Est. Revenue</Label>
                      <div className="text-xl font-bold text-green-600">
                        ${job.estimatedRevenue?.toLocaleString() || '0'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Actual Cost</Label>
                      <div className="text-xl font-bold text-red-600">
                        ${job.actualCost?.toLocaleString() || '0'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg border">
                    <div className="text-sm text-gray-600 mb-1">Profit Margin</div>
                    <div className={`text-2xl font-bold ${getProfitColor(job.profitMargin || 0)}`}>
                      {job.profitMargin || 0}%
                    </div>
                    <div className="text-xs text-gray-500">
                      Net: ${((job.estimatedRevenue || 0) - (job.actualCost || 0)).toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
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
              <Card>
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

        <div className="flex justify-end gap-3 pt-4 border-t">
          {(userRole === "admin" || userRole === "manager") && (
            <Button variant="outline" onClick={() => onGenerateInvoice(job)}>
              Generate Invoice
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {(userRole === "admin" || userRole === "manager") && (
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveChanges}>
              Save Changes
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};