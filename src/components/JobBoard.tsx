import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Plus, FilePlus2 } from "lucide-react";
import { NewJobForm } from "./NewJobForm";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

export const JobBoard = ({ onJobClick, onGenerateInvoice }) => {
  const [jobs, setJobs] = useState([]);
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          job_assignments(techs(name))
        `);
      
      if (error) {
        console.error("Error fetching jobs:", error);
      } else {
        const jobsWithAssignedTechs = data.map(job => ({
          ...job,
          assigned_tech_names: job.job_assignments.map(assignment => assignment.techs?.name).filter(Boolean).join(', ')
        }));
        setJobs(jobsWithAssignedTechs);
      }
    };

    fetchJobs();

    const channel = supabase
      .channel('realtime jobs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, fetchJobs)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_assignments' }, fetchJobs)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case "open": return "border-gray-500";
      case "in_progress": return "border-primary animate-pulse";
      case "waiting_parts": return "border-yellow-500";
      case "completed": return "border-accent";
      default: return "border-gray-500";
    }
  };

  const getStatusText = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const jobsByStatus = {
    open: jobs.filter(job => job.status === "open"),
    in_progress: jobs.filter(job => job.status === "in_progress"),
    waiting_parts: jobs.filter(job => job.status === "waiting_parts"),
    completed: jobs.filter(job => job.status === "completed")
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Live Job Board</h2>
        <Dialog open={isNewJobModalOpen} onOpenChange={setIsNewJobModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 glow-hover" onClick={() => setIsNewJobModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl bg-card/80 backdrop-blur-md border-primary/30">
            <DialogHeader>
              <DialogTitle>Create New Job</DialogTitle>
            </DialogHeader>
            <NewJobForm onSuccess={() => setIsNewJobModalOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {Object.entries(jobsByStatus).map(([status, statusJobs]) => (
          <div key={status} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground capitalize">
                {getStatusText(status)}
              </h3>
              <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                {statusJobs.length}
              </Badge>
            </div>
            
            <div className="space-y-3">
              {statusJobs.map((job) => (
                <HoverCard key={job.id}>
                  <HoverCardTrigger asChild>
                    <Card 
                      className={`cursor-pointer bg-card/80 backdrop-blur-sm hover:bg-primary/10 transition-all border-l-4 ${getStatusColor(job.status)}`}
                      onClick={() => onJobClick(job)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2 font-orbitron">
                            {job.truck_vin.slice(-6)}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                            {getStatusText(job.status)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        <div className="text-sm font-medium text-foreground">{job.job_type}</div>
                        <div className="text-xs text-muted-foreground">{job.customer_name}</div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          {job.assigned_tech_names || 'Unassigned'}
                        </div>
                        
                        <div>
                          <Progress value={status === 'completed' ? 100 : status === 'in_progress' ? 66 : status === 'waiting_parts' ? 33 : 10} className="h-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80 bg-card/80 backdrop-blur-md border-primary/30">
                    <div className="space-y-2">
                      <h4 className="font-semibold">{job.job_type} for {job.customer_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {job.notes || "No notes for this job."}
                      </p>
                      <div className="flex items-center pt-2">
                        <span className="text-xs text-muted-foreground">
                          Created on {new Date(job.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <Button size="sm" className="w-full mt-2" onClick={(e) => { e.stopPropagation(); onGenerateInvoice(job); }}>
                        <FilePlus2 className="h-4 w-4 mr-2" />
                        Add to Invoice
                      </Button>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};