
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Clock, DollarSign, User, Truck, FileText, Camera, Save } from "lucide-react";

export const JobDetailsModal = ({ job, onClose, userRole }) => {
  const [notes, setNotes] = useState("");
  const [jobStatus, setJobStatus] = useState(job?.status || "not_started");

  if (!job) return null;

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

  const getProfitColor = (margin) => {
    if (margin >= 80) return "text-green-600";
    if (margin >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Dialog open={!!job} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Truck className="h-6 w-6 text-blue-600" />
            Job Details - {job.unitNumber}
            <Badge className={getStatusColor(job.status)} variant="outline">
              {job.status === "not_started" ? "Not Started" :
               job.status === "in_progress" ? "In Progress" :
               job.status === "waiting_parts" ? "Waiting Parts" :
               job.status === "waiting_approval" ? "Waiting Approval" : "Completed"}
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
                    <label className="text-sm font-medium text-gray-600">Unit Number</label>
                    <div className="font-semibold">{job.unitNumber}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Job Type</label>
                    <div className="font-semibold">{job.jobType}</div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Customer</label>
                  <div className="font-semibold">{job.customerName}</div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Complaint</label>
                  <div className="text-gray-900">{job.complaint}</div>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Assigned to:</span>
                  <span className="font-medium">{job.assignedTech}</span>
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
                    <label className="text-sm font-medium text-gray-600">Estimated Hours</label>
                    <div className="text-xl font-bold text-blue-600">{job.estimatedHours}h</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Clocked Hours</label>
                    <div className="text-xl font-bold text-green-600">{job.clockedHours || 0}h</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Progress</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(((job.clockedHours || 0) / job.estimatedHours) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round(((job.clockedHours || 0) / job.estimatedHours) * 100)}% Complete
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
                      <label className="text-sm font-medium text-gray-600">Est. Revenue</label>
                      <div className="text-xl font-bold text-green-600">
                        ${job.estimatedRevenue?.toLocaleString() || '0'}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Actual Cost</label>
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
                  Job Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Add job notes, findings, or updates..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Add Photo
                  </Button>
                  <Button size="sm" className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Notes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {userRole === "mechanic" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Start Job Timer
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
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {(userRole === "admin" || userRole === "manager") && (
            <Button className="bg-blue-600 hover:bg-blue-700">
              Save Changes
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
