import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Clock, DollarSign, Activity, Wrench, MapPin, Phone, Star, Edit } from "lucide-react";
import { TechnicianForm, Technician as TechnicianData } from "./TechnicianForm";
import { useToast } from "@/hooks/use-toast";

interface Technician extends TechnicianData {
  currentActivity: string;
  dailyPay: number;
  weeklyPay: number;
  status: 'active' | 'break' | 'offline';
  completedJobsToday: number;
}

export const TechnicianList = () => {
  const { toast } = useToast();
  const [technicians, setTechnicians] = useState<Technician[]>([
    {
      id: "tech-001",
      name: "Mike Rodriguez",
      role: "lead",
      currentActivity: "Engine overhaul - Freightliner",
      location: "both",
      efficiency: 92,
      dailyPay: 280,
      weeklyPay: 1400,
      phone: "(555) 123-4567",
      status: "active",
      completedJobsToday: 3,
      specialties: ["Engine Repair", "Transmission", "Electrical"],
      hourlyRate: 35,
      email: "mike@xpressdiesel.com",
      active: true,
      certifications: ["ASE Master", "Cummins Certified"],
      experience: 15,
    },
    {
      id: "tech-002", 
      name: "Sarah Johnson",
      role: "senior",
      currentActivity: "Brake inspection - Peterbilt",
      location: "shop",
      efficiency: 88,
      dailyPay: 224,
      weeklyPay: 1120,
      phone: "(555) 234-5678",
      status: "active",
      completedJobsToday: 4,
      specialties: ["Brake Systems", "AC/Heating", "PM Service"],
      hourlyRate: 28,
      email: "sarah@xpressdiesel.com",
      active: true,
      certifications: ["ASE Brakes", "EPA 609"],
      experience: 8,
    },
    {
      id: "tech-003",
      name: "Carlos Martinez", 
      role: "junior",
      currentActivity: "On route to customer site",
      location: "road",
      efficiency: 75,
      dailyPay: 176,
      weeklyPay: 880,
      phone: "(555) 345-6789",
      status: "active",
      completedJobsToday: 2,
      specialties: ["PM Service", "Basic Repairs"],
      hourlyRate: 22,
      email: "carlos@xpressdiesel.com",
      active: true,
      certifications: ["ASE Entry Level"],
      experience: 3,
    },
    {
      id: "tech-004",
      name: "Jessica Chen",
      role: "senior",
      currentActivity: "Taking break",
      location: "shop",
      efficiency: 85,
      dailyPay: 224,
      weeklyPay: 1120,
      phone: "(555) 456-7890", 
      status: "break",
      completedJobsToday: 2,
      specialties: ["Tire Service"],
      hourlyRate: 28,
      email: "jessica@xpressdiesel.com",
      active: true,
      certifications: ["Tire Industry Association"],
      experience: 7,
    }
  ]);
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleSaveTechnician = (techData: TechnicianData) => {
    setTechnicians(prev => prev.map(t => t.id === techData.id ? { ...t, ...techData } : t));
    toast({
      title: "Technician Updated",
      description: `${techData.name}'s profile has been updated successfully.`,
    });
    setIsEditModalOpen(false);
    setSelectedTech(null);
  };

  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'lead': return 'bg-purple-100 text-purple-800';
      case 'senior': return 'bg-blue-100 text-blue-800';
      case 'junior': return 'bg-green-100 text-green-800';
      case 'apprentice': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-400';
      case 'break': return 'bg-yellow-400';
      case 'offline': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="h-6 w-6" />
          Team Overview
        </h2>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {technicians.filter(t => t.status === 'active').length} Active
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Jobs Today</p>
                <p className="text-2xl font-bold">{technicians.reduce((sum, t) => sum + t.completedJobsToday, 0)}</p>
              </div>
              <Wrench className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Daily Pay</p>
                <p className="text-2xl font-bold">${technicians.reduce((sum, t) => sum + t.dailyPay, 0)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Efficiency</p>
                <p className="text-2xl font-bold">{Math.round(technicians.reduce((sum, t) => sum + t.efficiency, 0) / technicians.length)}%</p>
              </div>
              <Activity className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">On Road</p>
                <p className="text-2xl font-bold">{technicians.filter(t => t.location === 'road').length}</p>
              </div>
              <MapPin className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Technician List */}
      <Card>
        <CardHeader>
          <CardTitle>Technicians</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {technicians.map((tech) => (
              <div key={tech.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div 
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => { setSelectedTech(tech); setIsViewModalOpen(true); }}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {getInitials(tech.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -top-1 -right-1 w-3 h-3 ${getStatusColor(tech.status)} rounded-full border-2 border-white`}></div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{tech.name}</h3>
                      <Badge className={getRoleBadgeColor(tech.role)} variant="secondary">
                        {tech.role}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        {tech.currentActivity}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {tech.location}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">${tech.dailyPay}</div>
                    <div className="text-xs text-gray-500">today</div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => { setSelectedTech(tech); setIsEditModalOpen(true); }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* View Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          {selectedTech && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-lg">
                      {getInitials(selectedTech.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      {selectedTech.name}
                      <Badge className={getRoleBadgeColor(selectedTech.role)} variant="secondary">
                        {selectedTech.role}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500 font-normal">{selectedTech.phone}</div>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-6 mt-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Current Activity</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedTech.currentActivity}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Location</label>
                    <p className="text-sm text-gray-900 mt-1 capitalize">{selectedTech.location}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-2 h-2 ${getStatusColor(selectedTech.status)} rounded-full`}></div>
                      <span className="text-sm text-gray-900 capitalize">{selectedTech.status}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Performance</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-gray-900">{selectedTech.efficiency}% efficiency</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Jobs Completed Today</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedTech.completedJobsToday} jobs</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Pay Summary</label>
                    <div className="mt-1 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Today:</span>
                        <span className="text-gray-900 font-medium">${selectedTech.dailyPay}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">This Week:</span>
                        <span className="text-gray-900 font-medium">${selectedTech.weeklyPay}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <Button variant="outline" className="flex-1">
                  Call {selectedTech.name}
                </Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Assign Job
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Details Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Technician</DialogTitle>
          </DialogHeader>
          {selectedTech && (
            <TechnicianForm
              technician={selectedTech}
              onSave={handleSaveTechnician}
              onCancel={() => setIsEditModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};