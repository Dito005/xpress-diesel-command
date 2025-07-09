
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, Pause, CheckCircle, User, Wrench } from "lucide-react";

export const TechnicianDashboard = ({ userRole, onJobClick }) => {
  const [isWorking, setIsWorking] = useState(false);
  const [currentJobTimer, setCurrentJobTimer] = useState(0);

  const technicianJobs = [
    {
      id: 1,
      unitNumber: "T-2041",
      jobType: "PM Service", 
      status: "assigned",
      estimatedHours: 4,
      customerName: "ABC Transport",
      complaint: "Scheduled 10,000 mile service",
      priority: "medium"
    },
    {
      id: 2,
      unitNumber: "T-1507", 
      jobType: "AC Repair",
      status: "in_progress",
      estimatedHours: 3,
      clockedHours: 2.5,
      customerName: "XYZ Logistics", 
      complaint: "AC not cooling, possible compressor issue",
      priority: "high"
    }
  ];

  const handleClockInOut = () => {
    setIsWorking(!isWorking);
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
      {userRole === "mechanic" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-r from-slate-700 to-slate-800 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Work Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">
                  {isWorking ? "Clocked In" : "Clocked Out"}
                </div>
                <Button 
                  onClick={handleClockInOut}
                  variant={isWorking ? "destructive" : "default"}
                  size="sm"
                  className={isWorking ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                >
                  {isWorking ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                  {isWorking ? "Clock Out" : "Clock In"}
                </Button>
              </div>
              {isWorking && (
                <div className="text-xs text-slate-300 mt-2">
                  Shift started at 7:30 AM
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
              <div className="text-2xl font-bold text-gray-900">6.5</div>
              <div className="text-xs text-gray-500">Efficiency: 92%</div>
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
              <div className="text-2xl font-bold text-gray-900">3</div>
              <div className="text-xs text-gray-500">2 Completed</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            {userRole === "mechanic" ? "My Assigned Jobs" : "All Technician Jobs"}
          </h3>
          {userRole === "mechanic" && (
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
                    {job.unitNumber}
                  </CardTitle>
                  <Badge className={getStatusColor(job.status)} variant="outline">
                    {job.status === "assigned" ? "Assigned" : 
                     job.status === "in_progress" ? "In Progress" : "Completed"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="font-medium text-gray-900">{job.jobType}</div>
                  <div className="text-sm text-gray-600">{job.customerName}</div>
                </div>
                
                <div className="text-sm text-gray-700">
                  {job.complaint}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    Est. {job.estimatedHours}h
                    {job.clockedHours && ` • Worked: ${job.clockedHours}h`}
                  </div>
                  {job.priority === "high" && (
                    <Badge variant="destructive" className="text-xs">High Priority</Badge>
                  )}
                </div>

                {userRole === "mechanic" && (
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(`Starting job ${job.id}`);
                      }}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Start Work
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

      {userRole !== "mechanic" && (
        <div className="text-center py-8 text-gray-500">
          <User className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p>Advanced technician management features coming soon...</p>
        </div>
      )}
    </div>
  );
};
