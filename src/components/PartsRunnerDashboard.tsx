import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Clock, Package, MapPin, CheckCircle, AlertTriangle, Search, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client"; // Changed import path

export const PartsRunnerDashboard = ({ onJobClick }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [partsRequests, setPartsRequests] = useState([]);
  const [techNames, setTechNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchPartsRequests = async () => {
      // Fetch parts requests (simulated from jobs for now, or a dedicated parts_requests table)
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          id,
          truck_vin,
          job_type,
          priority,
          status,
          customer_name,
          notes,
          job_assignments(techs(name))
        `)
        .in('status', ['waiting_parts', 'in_progress']); // Jobs that might need parts

      if (jobsError) {
        console.error("Error fetching jobs for parts requests:", jobsError);
        return;
      }

      // Fetch techs for names
      const { data: techsData, error: techsError } = await supabase
        .from('techs')
        .select('id, name');
      if (techsError) {
        console.error("Error fetching techs for parts runner:", techsError);
        return;
      }
      const namesMap = techsData.reduce((acc, tech: { id: string; name: string }) => ({ ...acc, [tech.id]: tech.name }), {});
      setTechNames(namesMap);

      // Simulate parts requests from jobs
      const simulatedRequests = jobsData.map(job => ({
        id: job.id,
        jobId: job.id,
        unitNumber: job.truck_vin || 'N/A',
        partName: `Part for ${job.job_type}`, // Placeholder
        partNumber: `PN-${job.id.slice(0,4)}`, // Placeholder
        quantity: Math.floor(Math.random() * 3) + 1,
        urgency: job.priority || 'medium',
        // Access name from the nested array structure
        requestedBy: job.job_assignments.map(assignment => assignment.techs?.[0]?.name).filter(Boolean).join(', ') || 'Unassigned', 
        supplier: "Local Supplier", // Placeholder
        estimatedCost: Math.floor(Math.random() * 300) + 50,
        status: job.status === 'waiting_parts' ? 'pending_pickup' : 'out_for_pickup', // Map job status
        requestTime: "2 hours ago", // Placeholder
        location: "Warehouse A" // Placeholder
      }));
      setPartsRequests(simulatedRequests);
    };

    fetchPartsRequests();

    const channel = supabase
      .channel('parts_runner_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, fetchPartsRequests)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_assignments' }, fetchPartsRequests) // Listen to assignment changes
      .on('postgres_changes', { event: '*', schema: 'public', table: 'techs' }, fetchPartsRequests)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getUrgencyColor = (urgency) => {
    switch(urgency) {
      case "high": return "bg-red-100 text-red-800 border-red-300";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low": return "bg-green-100 text-green-800 border-green-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "pending_pickup": return "bg-orange-100 text-orange-800 border-orange-300";
      case "out_for_pickup": return "bg-blue-100 text-blue-800 border-blue-300";
      case "delivered": return "bg-green-100 text-green-800 border-green-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const filteredRequests = partsRequests.filter(request =>
    request.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.unitNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Parts Runner Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Active Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {partsRequests.filter(r => r.status !== "delivered").length}
            </div>
            <div className="text-xs text-blue-100">2 High Priority</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-100 flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Out for Pickup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {partsRequests.filter(r => r.status === "out_for_pickup").length}
            </div>
            <div className="text-xs text-orange-100">ETA: 45 min</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-100 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Today's Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <div className="text-xs text-green-100">$2,340 Value</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Pickup Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32m</div>
            <div className="text-xs text-purple-100">Target: 30m</div>
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