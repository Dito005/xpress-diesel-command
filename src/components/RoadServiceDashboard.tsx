
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Phone, Clock, Navigation, AlertTriangle, Wrench, User } from "lucide-react";

export const RoadServiceDashboard = ({ onJobClick }) => {
  const [activeCall, setActiveCall] = useState(null);

  const roadCalls = [
    {
      id: 1,
      callNumber: "RS-2024-001",
      customerName: "Express Logistics",
      driverName: "John Smith",
      driverPhone: "(555) 123-4567",
      unitNumber: "T-8901",
      location: "I-75 Mile Marker 234",
      coordinates: { lat: 40.7128, lng: -74.0060 },
      issue: "Engine overheating, steam from radiator",
      priority: "high",
      status: "assigned",
      estimatedArrival: "25 minutes",
      assignedTech: "Roberto Silva",
      callTime: "15 minutes ago",
      customerType: "Premium"
    },
    {
      id: 2,
      callNumber: "RS-2024-002",
      customerName: "City Transport",
      driverName: "Mike Johnson",
      driverPhone: "(555) 987-6543",
      unitNumber: "T-5432",
      location: "Rest Stop - Exit 45",
      coordinates: { lat: 40.7589, lng: -73.9851 },
      issue: "Flat tire, need roadside assistance",
      priority: "medium",
      status: "en_route",
      estimatedArrival: "12 minutes",
      assignedTech: "Carlos Martinez",
      callTime: "45 minutes ago",
      customerType: "Standard"
    }
  ];

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

      {/* Active Road Calls */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Active Road Calls ({roadCalls.length})
          </h3>
          <Button className="bg-red-600 hover:bg-red-700">
            Emergency Dispatch
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {roadCalls.map((call) => (
            <Card key={call.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-red-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    {call.callNumber}
                    {call.priority === "high" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge className={getPriorityColor(call.priority)} variant="outline">
                      {call.priority.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(call.status)} variant="outline">
                      {call.status === "assigned" ? "Assigned" :
                       call.status === "en_route" ? "En Route" :
                       call.status === "on_site" ? "On Site" : "Completed"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="font-medium text-gray-900">{call.customerName}</div>
                  <div className="text-sm text-gray-600">{call.customerType} Customer</div>
                  <div className="text-sm text-gray-600">Unit: {call.unitNumber}</div>
                </div>

                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <div className="text-sm font-medium text-red-800">Issue Description:</div>
                  <div className="text-sm text-red-700">{call.issue}</div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  {call.location}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Driver:</div>
                    <div className="font-medium">{call.driverName}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Tech Assigned:</div>
                    <div className="font-medium">{call.assignedTech}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-600">
                    Called {call.callTime}
                  </div>
                  <div className="font-medium text-blue-600">
                    ETA: {call.estimatedArrival}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Call Driver
                  </Button>
                  <Button size="sm" variant="outline" className="flex items-center gap-1">
                    <Navigation className="h-3 w-3" />
                    Directions
                  </Button>
                  <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Update Status
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
