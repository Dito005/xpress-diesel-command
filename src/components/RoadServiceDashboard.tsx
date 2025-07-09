import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Phone, Clock, Navigation, AlertTriangle, Wrench, User, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client"; // Changed import path

export const RoadServiceDashboard = ({ onJobClick }) => {
  const [roadCalls, setRoadCalls] = useState([]);
  const [techNames, setTechNames] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState(""); // Added searchTerm state

  useEffect(() => {
    const fetchRoadCalls = async () => {
      // Fetch parts requests (simulated from jobs for now, or a dedicated parts_requests table)
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          *,
          job_assignments(techs(name))
        `)
        .eq('job_type', 'Road Service')
        .in('status', ['open', 'in_progress']);

      if (jobsError) {
        console.error("Error fetching road calls:", jobsError);
        return;
      }

      // Fetch techs for names
      const { data: techsData, error: techsError } = await supabase
        .from('techs')
        .select('id, name');
      if (techsError) {
        console.error("Error fetching techs for road service:", techsError);
        return;
      }
      const namesMap = techsData.reduce((acc, tech: { id: string; name: string }) => ({ ...acc, [tech.id]: tech.name }), {});
      setTechNames(namesMap);

      // Simulate additional road call data
      const enrichedRoadCalls = jobsData.map(job => ({
        id: job.id,
        callNumber: `RS-${job.created_at.substring(0, 4)}-${job.truck_vin?.slice(-4) || job.id.slice(0,4)}`,
        customerName: job.customer_name,
        driverName: job.customer_info?.driver_name || 'N/A',
        driverPhone: job.customer_phone || 'N/A',
        unitNumber: job.truck_vin || 'N/A',
        location: job.location || 'Unknown Location',
        coordinates: { lat: 40.7128, lng: -74.0060 }, // Placeholder
        issue: job.customer_concern || job.notes || 'No specific issue described',
        priority: job.priority || 'medium',
        status: job.status === 'in_progress' ? 'en_route' : 'assigned', // Map job status to road call status
        estimatedArrival: "25 minutes", // Placeholder
        assignedTech: job.job_assignments.map(assignment => assignment.techs?.name).filter(Boolean).join(', ') || 'Unassigned', // Get assigned tech from job_assignments
        callTime: "15 minutes ago", // Placeholder
        customerType: "Standard" // Placeholder
      }));
      setRoadCalls(enrichedRoadCalls);
    };

    fetchRoadCalls();

    const channel = supabase
      .channel('road_service_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, fetchRoadCalls)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_assignments' }, fetchRoadCalls) // Listen to assignment changes
      .on('postgres_changes', { event: '*', schema: 'public', table: 'techs' }, fetchRoadCalls)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getPriorityColor = (priority) => {
    switch(priority) {
      case "high": return "bg-red-100 text-red-800 border-red-300";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low": return "bg-green-100 text-green-800 border-green-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "assigned": return "bg-blue-100 text-blue-800 border-blue-300";
      case "en_route": return "bg-orange-100 text-orange-800 border-orange-300";
      case "on_site": return "bg-purple-100 text-purple-800 border-purple-300";
      case "completed": return "bg-green-100 text-green-800 border-green-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const filteredRequests = roadCalls.filter(request =>
    request.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Road Service Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-100">Active Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roadCalls.filter(call => call.status !== "completed").length}
            </div>
            <div className="text-xs text-red-100">1 High Priority</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-100 flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              En Route
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roadCalls.filter(call => call.status === "en_route").length}
            </div>
            <div className="text-xs text-orange-100">Avg ETA: 18m</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23m</div>
            <div className="text-xs text-blue-100">Target: 30m</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-100 flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Today's Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <div className="text-xs text-green-100">8 Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search calls by issue, unit, or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <MapPin className="h-4 w-4 mr-2" />
          Route Optimizer
        </Button>
      </div>

      {/* Road Calls List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Incoming & Active Road Calls ({filteredRequests.length})
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredRequests.map((call) => (
            <Card key={call.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-red-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    {call.unitNumber}
                    {call.priority === "high" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge className={getPriorityColor(call.priority)} variant="outline">
                      {call.priority.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(call.status)} variant="outline">
                      {call.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="font-medium text-gray-900">{call.issue}</div>
                  <div className="text-sm text-gray-600">Customer: {call.customerName}</div>
                  <div className="text-sm text-gray-600">Driver: {call.driverName} ({call.driverPhone})</div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-600">
                    Assigned: <span className="font-medium">{call.assignedTech}</span>
                  </div>
                  <div className="font-medium text-blue-600">
                    ETA: {call.estimatedArrival}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  {call.location}
                </div>

                <div className="text-xs text-gray-500">
                  Requested {call.requestTime}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Update Status
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onJobClick({ id: call.id })}>
                    View Job
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};