import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Phone, Clock, Navigation, AlertTriangle, Wrench, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client"; // Changed import path

export const RoadServiceDashboard = ({ onJobClick }) => {
  const [roadCalls, setRoadCalls] = useState([]);
  const [techNames, setTechNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchRoadCalls = async () => {
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
            placeholder="Search parts or unit numbers..."
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

      {/* Parts Requests */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Parts Requests ({filteredRequests.length})
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    {request.unitNumber}
                    {request.urgency === "high" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge className={getUrgencyColor(request.urgency)} variant="outline">
                      {request.urgency.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(request.status)} variant="outline">
                      {request.status === "pending_pickup" ? "Pending" :
                       request.status === "out_for_pickup" ? "En Route" : "Delivered"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="font-medium text-gray-900">{request.partName}</div>
                  <div className="text-sm text-gray-600">Part #: {request.partNumber}</div>
                  <div className="text-sm text-gray-600">Qty: {request.quantity}</div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-600">
                    Requested by: <span className="font-medium">{request.requestedBy}</span>
                  </div>
                  <div className="font-medium text-green-600">
                    ${request.estimatedCost}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  {request.supplier} - {request.location}
                </div>

                <div className="text-xs text-gray-500">
                  Requested {request.requestTime}
                </div>

                <div className="flex gap-2 pt-2">
                  {request.status === "pending_pickup" && (
                    <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                      Start Pickup
                    </Button>
                  )}
                  {request.status === "out_for_pickup" && (
                    <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                      Mark Delivered
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => onJobClick({ id: request.jobId })}>
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