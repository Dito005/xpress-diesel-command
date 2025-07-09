import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, DollarSign, User, AlertTriangle, Plus } from "lucide-react";
import { NewJobForm } from "./NewJobForm";

export const JobBoard = ({ onJobClick }) => {
  const [jobs] = useState([
    {
      id: 1,
      unitNumber: "T-2041",
      jobType: "PM Service",
      assignedTech: "Miguel Rodriguez",
      status: "not_started",
      estimatedHours: 4,
      clockedHours: 0,
      estimatedRevenue: 650,
      actualCost: 0,
      profitMargin: 100,
      priority: "medium",
      customerName: "ABC Transport",
      complaint: "Scheduled 10,000 mile service"
    },
    {
      id: 2, 
      unitNumber: "T-1507",
      jobType: "AC Repair",
      assignedTech: "Carlos Martinez",
      status: "in_progress",
      estimatedHours: 3,
      clockedHours: 2.5,
      estimatedRevenue: 450,
      actualCost: 125,
      profitMargin: 72,
      priority: "high",
      customerName: "XYZ Logistics",
      complaint: "AC not cooling, possible compressor issue"
    },
    {
      id: 3,
      unitNumber: "T-3302",
      jobType: "Brake Service", 
      assignedTech: "David Thompson",
      status: "waiting_parts",
      estimatedHours: 5,
      clockedHours: 1.5,
      estimatedRevenue: 850,
      actualCost: 87.50,
      profitMargin: 85,
      priority: "medium",
      customerName: "Fleet Masters",
      complaint: "Brake pedal going to floor, air leak suspected"
    },
    {
      id: 4,
      unitNumber: "T-4419",
      jobType: "Engine Diagnostic",
      assignedTech: "Roberto Silva",
      status: "waiting_approval", 
      estimatedHours: 2,
      clockedHours: 1.8,
      estimatedRevenue: 325,
      actualCost: 90,
      profitMargin: 72,
      priority: "low",
      customerName: "City Transport",
      complaint: "Check engine light, poor fuel economy"
    },
    {
      id: 5,
      unitNumber: "T-5001",
      jobType: "Transmission Service",
      assignedTech: "Juan Hernandez", 
      status: "completed",
      estimatedHours: 6,
      clockedHours: 5.5,
      estimatedRevenue: 1200,
      actualCost: 275,
      profitMargin: 77,
      priority: "medium",
      customerName: "Metro Freight",
      complaint: "Transmission slipping, needs rebuild"
    }
  ]);

  const getStatusColor = (status) => {
    switch(status) {
      case "not_started": return "bg-gray-100 text-gray-800 border-gray-300";
      case "in_progress": return "bg-blue-100 text-blue-800 border-blue-300";
      case "waiting_parts": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "waiting_approval": return "bg-orange-100 text-orange-800 border-orange-300";
      case "completed": return "bg-green-100 text-green-800 border-green-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case "not_started": return "Not Started";
      case "in_progress": return "In Progress";
      case "waiting_parts": return "Waiting Parts";
      case "waiting_approval": return "Waiting Approval";
      case "completed": return "Completed";
      default: return status;
    }
  };

  const getProfitColor = (margin) => {
    if (margin >= 80) return "text-green-600";
    if (margin >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getPriorityIcon = (priority) => {
    if (priority === "high") return <AlertTriangle className="h-4 w-4 text-red-500" />;
    return null;
  };

  const jobsByStatus = {
    not_started: jobs.filter(job => job.status === "not_started"),
    in_progress: jobs.filter(job => job.status === "in_progress"),
    waiting_parts: jobs.filter(job => job.status === "waiting_parts"),
    waiting_approval: jobs.filter(job => job.status === "waiting_approval"),
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
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
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
                        {job.unitNumber}
                        {getPriorityIcon(job.priority)}
                      </CardTitle>
                      <Badge className={getStatusColor(job.status)} variant="outline">
                        {getStatusText(job.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <div className="text-sm font-medium text-gray-900">{job.jobType}</div>
                    <div className="text-xs text-gray-600">{job.customerName}</div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <User className="h-3 w-3" />
                      {job.assignedTech}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-3 w-3" />
                        {job.clockedHours}h / {job.estimatedHours}h
                      </div>
                      <div className={`flex items-center gap-1 font-medium ${getProfitColor(job.profitMargin)}`}>
                        <DollarSign className="h-3 w-3" />
                        {job.profitMargin}%
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 line-clamp-2">
                      {job.complaint}
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