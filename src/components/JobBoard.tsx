import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, DollarSign, User, AlertTriangle, Plus } from "lucide-react";
import { NewJobForm } from "./NewJobForm";
import { supabase } from "@/lib/supabase";

export const JobBoard = ({ onJobClick }) => {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          assigned_tech:users ( name )
        `);
      
      if (error) {
        console.error("Error fetching jobs:", error);
      } else {
        setJobs(data);
      }
    };

    fetchJobs();

    const channel = supabase
      .channel('realtime jobs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, fetchJobs)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case "pending": return "bg-gray-100 text-gray-800 border-gray-300";
      case "in_progress": return "bg-blue-100 text-blue-800 border-blue-300";
      case "waiting_parts": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "completed": return "bg-green-100 text-green-800 border-green-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusText = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const jobsByStatus = {
    pending: jobs.filter(job => job.status === "pending"),
    in_progress: jobs.filter(job => job.status === "in_progress"),
    waiting_parts: jobs.filter(job => job.status === "waiting_parts"),
    completed: jobs.filter(job => job.status === "completed")
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Live Job Board</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create New Job</DialogTitle>
            </DialogHeader>
            <NewJobForm />
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {Object.entries(jobsByStatus).map(([status, statusJobs]) => (
          <div key={status} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 capitalize">
                {getStatusText(status)}
              </h3>
              <Badge variant="outline" className="text-xs">
                {statusJobs.length}
              </Badge>
            </div>
            
            <div className="space-y-3">
              {statusJobs.map((job) => (
                <Card 
                  key={job.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
                  onClick={() => onJobClick(job)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        {job.vehicle_info.vin.slice(-6)}
                      </CardTitle>
                      <Badge className={getStatusColor(job.status)} variant="outline">
                        {getStatusText(job.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <div className="text-sm font-medium text-gray-900">{job.vehicle_info.make} {job.vehicle_info.model}</div>
                    <div className="text-xs text-gray-600">{job.customer_info.name}</div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <User className="h-3 w-3" />
                      {job.assigned_tech?.name || 'Unassigned'}
                    </div>
                    
                    <div className="text-xs text-gray-500 line-clamp-2">
                      {job.description}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};