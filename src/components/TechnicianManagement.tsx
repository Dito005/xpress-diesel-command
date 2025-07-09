import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Edit, Star, Clock, Wrench, Phone, Mail, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Technician {
  id: string;
  name: string;
  role: 'lead' | 'senior' | 'junior' | 'apprentice';
  specialties: string[];
  hourlyRate: number;
  phone: string;
  email: string;
  active: boolean;
  certifications: string[];
  experience: number;
  efficiency: number;
  location: 'shop' | 'road' | 'both';
}

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
    if (selectedTech) {
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

  const TechnicianForm = ({ technician, onSave, onCancel }: {
    technician?: Technician;
    onSave: (tech: Technician) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState<Technician>(technician || {
      id: '',
      name: '',
      role: 'junior',
      specialties: [],
      hourlyRate: 20,
      phone: '',
      email: '',
      active: true,
      certifications: [],
      experience: 0,
      efficiency: 75,
      location: 'shop'
    });

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as any }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apprentice">Apprentice</SelectItem>
                <SelectItem value="junior">Junior Technician</SelectItem>
                <SelectItem value="senior">Senior Technician</SelectItem>
                <SelectItem value="lead">Lead Technician</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
            <Input
              id="hourlyRate"
              type="number"
              value={formData.hourlyRate}
              onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) }))}
            />
          </div>
          <div>
            <Label htmlFor="experience">Experience (years)</Label>
            <Input
              id="experience"
              type="number"
              value={formData.experience}
              onChange={(e) => setFormData(prev => ({ ...prev, experience: parseInt(e.target.value) }))}
            />
          </div>
          <div>
            <Label htmlFor="location">Work Location</Label>
            <Select value={formData.location} onValueChange={(value) => setFormData(prev => ({ ...prev, location: value as any }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shop">Shop Only</SelectItem>
                <SelectItem value="road">Road Only</SelectItem>
                <SelectItem value="both">Shop & Road</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label>Active Status</Label>
          <Switch
            checked={formData.active}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={onCancel} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button onClick={() => onSave(formData)} className="flex-1 bg-blue-600 hover:bg-blue-700">
            {technician ? 'Update' : 'Add'} Technician
          </Button>
        </div>
      </div>
    );
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
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setSelectedTech(tech)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Edit Technician</DialogTitle>
                    </DialogHeader>
                    <TechnicianForm
                      technician={tech}
                      onSave={handleSaveTechnician}
                      onCancel={() => setSelectedTech(null)}
                    />
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