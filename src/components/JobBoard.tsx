import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Plus, Loader2 } from "lucide-react";
import { NewJobForm } from "./NewJobForm";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

const fetchJobs = async () => {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      id,
      truck_vin,
      status,
      job_type,
      customer_name,
      job_assignments(techs(name))
    `);
  
  if (error) throw error;

  return data.map(job => ({
    ...job,
    assigned_tech_names: job.job_assignments.map((assignment: any) => assignment.techs?.name).filter(Boolean).join(', ')
  }));
};

export const JobBoard = ({ onJobClick, onGenerateInvoice }) => {
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: fetchJobs,
  });

  useEffect(() => {
    const channel = supabase
      .channel('realtime jobs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => queryClient.invalidateQueries({ queryKey: ['jobs'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_assignments' }, () => queryClient.invalidateQueries({ queryKey: ['jobs'] }))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const jobsByStatus = useMemo(() => ({
    open: jobs.filter(job => job.status === "open"),
    in_progress: jobs.filter(job => job.status === "in_progress"),
    waiting_parts: jobs.filter(job => job.status === "waiting_parts"),
    completed: jobs.filter(job => job.status === "completed")
  }), [jobs]);

  const getStatusStyles = (status) => {
    switch(status) {
      case "open": return { border: "border-gray-500", progress: 10, progressClass: "bg-gray-400" };
      case "in_progress": return { border: "border-blue-500", progress: 50, progressClass: "bg-blue-500" };
      case "waiting_parts": return { border: "border-yellow-500", progress: 75, progressClass: "bg-yellow-500" };
      case "completed": return { border: "border-green-500", progress: 100, progressClass: "bg-green-500" };
      default: return { border: "border-gray-500", progress: 0, progressClass: "bg-gray-400" };
    }
  };

  const getStatusText = (status) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Live Job Board</h2>
        <Dialog open={isNewJobModalOpen} onOpenChange={setIsNewJobModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsNewJobModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl bg-background/95 backdrop-blur-sm border">
            <DialogHeader>
              <DialogTitle>Create New Job</DialogTitle>
            </DialogHeader>
            <NewJobForm onSuccess={() => setIsNewJobModalOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(jobsByStatus).map(([status, statusJobs]) => (
            <div key={status} className="space-y-4 bg-secondary/50 p-4 rounded-lg">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-semibold text-foreground capitalize">
                  {getStatusText(status)}
                </h3>
                <Badge variant="secondary">
                  {statusJobs.length}
                </Badge>
              </div>
              
              <div className="space-y-3 h-full">
                {statusJobs.map((job) => {
                  const statusStyles = getStatusStyles(job.status);
                  return (
                    <Card 
                      key={job.id}
                      className={`cursor-pointer hover:bg-accent transition-all border-l-4 bg-card ${statusStyles.border}`}
                      onClick={() => onJobClick(job)}
                    >
                      <CardHeader className="p-3 pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-bold">
                            {job.truck_vin.slice(-6)}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs capitalize">
                            {job.job_type}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 pt-0 space-y-3">
                        <div className="text-sm text-muted-foreground">{job.customer_name}</div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          {job.assigned_tech_names || 'Unassigned'}
                        </div>
                        
                        <div>
                          <Progress value={statusStyles.progress} className="h-1" indicatorClassName={statusStyles.progressClass} />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};