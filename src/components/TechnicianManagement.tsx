import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Edit, Star, Clock, Wrench, Phone, Mail, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TechnicianForm, Technician } from "./TechnicianForm";

export const TechnicianManagement = () => {
  const { toast } = useToast();
  const [technicians, setTechnicians] = useState<Technician[]>([
    {
      id: "tech-001",
      name: "Mike Rodriguez",
      role: "lead",
      specialties: ["Engine Repair", "Transmission", "Electrical"],
      hourlyRate: 35,
      phone: "(555) 123-4567",
      email: "mike@xpressdiesel.com",
      active: true,
      certifications: ["ASE Master", "Cummins Certified"],
      experience: 15,
      efficiency: 92,
      location: "both"
    },
    {
      id: "tech-002",
      name: "Sarah Johnson",
      role: "senior",
      specialties: ["Brake Systems", "AC/Heating", "PM Service"],
      hourlyRate: 28,
      phone: "(555) 234-5678",
      email: "sarah@xpressdiesel.com",
      active: true,
      certifications: ["ASE Brakes", "EPA 609"],
      experience: 8,
      efficiency: 88,
      location: "shop"
    },
    {
      id: "tech-003",
      name: "Carlos Martinez",
      role: "junior",
      specialties: ["PM Service", "Basic Repairs"],
      hourlyRate: 22,
      phone: "(555) 345-6789",
      email: "carlos@xpressdiesel.com",
      active: true,
      certifications: ["ASE Entry Level"],
      experience: 3,
      efficiency: 75,
      location: "road"
    }
  ]);

  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'lead': return 'bg-purple-100 text-purple-800';
      case 'senior': return 'bg-blue-100 text-blue-800';
      case 'junior': return 'bg-green-100 text-green-800';
      case 'apprentice': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600';
    if (efficiency >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleSaveTechnician = (tech: Technician) => {
    if (tech.id) {
      setTechnicians(prev => prev.map(t => t.id === tech.id ? tech : t));
      toast({
        title: "Technician Updated",
        description: `${tech.name}'s profile has been updated successfully.`,
      });
    } else {
      const newTech = { ...tech, id: `tech-${Date.now()}` };
      setTechnicians(prev => [...prev, newTech]);
      toast({
        title: "Technician Added",
        description: `${tech.name} has been added to the team.`,
      });
    }
    setSelectedTech(null);
    setShowAddDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="h-6 w-6" />
          Technician Management
        </h2>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Technician
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Technician</DialogTitle>
            </DialogHeader>
            <TechnicianForm
              onSave={handleSaveTechnician}
              onCancel={() => setShowAddDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Technicians</p>
                <p className="text-2xl font-bold">{technicians.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{technicians.filter(t => t.active).length}</p>
              </div>
              <Star className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Efficiency</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {Math.round(technicians.reduce((sum, t) => sum + t.efficiency, 0) / technicians.length)}%
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Road Techs</p>
                <p className="text-2xl font-bold text-purple-600">
                  {technicians.filter(t => t.location === 'road' || t.location === 'both').length}
                </p>
              </div>
              <Wrench className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Technician List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {technicians.map((tech) => (
              <div key={tech.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{tech.name}</h3>
                    <Badge className={getRoleBadgeColor(tech.role)}>
                      {tech.role}
                    </Badge>
                    {!tech.active && (
                      <Badge variant="outline" className="bg-gray-100 text-gray-600">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {tech.phone}
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {tech.email}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {tech.location}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm">
                      <span className="font-medium">${tech.hourlyRate}/hr</span>
                    </span>
                    <span className="text-sm">
                      <span className="font-medium">{tech.experience} years</span>
                    </span>
                    <span className={`text-sm font-medium ${getEfficiencyColor(tech.efficiency)}`}>
                      {tech.efficiency}% efficiency
                    </span>
                  </div>
                </div>
                
                <Dialog open={selectedTech?.id === tech.id} onOpenChange={(isOpen) => !isOpen && setSelectedTech(null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setSelectedTech(tech)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Edit Technician</DialogTitle>
                    </DialogHeader>
                    {selectedTech && (
                      <TechnicianForm
                        technician={selectedTech}
                        onSave={handleSaveTechnician}
                        onCancel={() => setSelectedTech(null)}
                      />
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};