import { useState, useEffect } => {
  const { toast } = useToast();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchTechnicians();
    const channel = supabase
      .channel('technicians_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'techs' }, fetchTechnicians)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTechnicians = async () => {
    const { data, error } = await supabase
      .from('techs')
      .select('*');

    if (error) {
      console.error("Error fetching technicians:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load technicians.",
      });
    } else {
      setTechnicians(data as Technician[]);
    }
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

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600';
    if (efficiency >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleSaveTechnician = async (tech: Technician) => {
    if (tech.id) {
      // Update existing technician
      const { error } = await supabase
        .from('techs')
        .update({
          name: tech.name,
          role: tech.role,
          hourly_rate: tech.hourly_rate,
          phone: tech.phone,
          email: tech.email,
          active: tech.active,
          experience: tech.experience,
          efficiency: tech.efficiency,
          location: tech.location,
          specialties: tech.specialties,
          certifications: tech.certifications,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tech.id);

      if (error) {
        toast({ variant: "destructive", title: "Error updating technician", description: error.message });
      } else {
        toast({ title: "Technician Updated", description: `${tech.name}'s profile has been updated successfully.` });
        fetchTechnicians(); // Re-fetch to ensure UI is up-to-date
      }
    } else {
      // Add new technician - this should ideally be linked to auth.users creation
      // For this demo, we'll simulate adding to the 'techs' table directly.
      // In a real app, you'd create the auth.user first, then insert into techs with auth.uid()
      // For now, we'll generate a dummy ID or expect it to be passed if linked to auth.signup
      const { data: newTechData, error } = await supabase
        .from('techs')
        .insert({
          // In a real app, 'id' would come from auth.uid() after user signup
          // For this demo, we'll let DB generate if not provided, or use a dummy for testing
          id: tech.id || crypto.randomUUID(), // Generate a new UUID if not provided (for demo purposes)
          name: tech.name,
          role: tech.role,
          hourly_rate: tech.hourly_rate,
          phone: tech.phone,
          email: tech.email,
          active: tech.active,
          experience: tech.experience,
          efficiency: tech.efficiency,
          location: tech.location,
          specialties: tech.specialties,
          certifications: tech.certifications,
        }).select().single();


      if (error) {
        toast({ variant: "destructive", title: "Error adding technician", description: error.message });
      } else {
        toast({ title: "Technician Added", description: `${newTechData.name} has been added to the team.` });
        fetchTechnicians();
      }
    }
    setSelectedTech(null);
    setShowAddDialog(false);
  };

  const handleDeleteTechnician = async (techId: string, techName: string) => {
    if (window.confirm(`Are you sure you want to delete ${techName}? This action cannot be undone.`)) {
      const { error } = await supabase
        .from('techs')
        .delete()
        .eq('id', techId);

      if (error) {
        toast({ variant: "destructive", title: "Error deleting technician", description: error.message });
      } else {
        toast({ title: "Technician Deleted", description: `${techName} has been removed.` });
        fetchTechnicians();
      }
    }
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
                  {technicians.length > 0 ? Math.round(technicians.reduce((sum, t) => sum + t.efficiency, 0) / technicians.length) : 0}%
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
                      <span className="font-medium">${tech.hourly_rate}/hr</span>
                    </span>
                    <span className="text-sm">
                      <span className="font-medium">{tech.experience} years</span>
                    </span>
                    <span className={`text-sm font-medium ${getEfficiencyColor(tech.efficiency)}`}>
                      {tech.efficiency}% efficiency
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
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
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteTechnician(tech.id, tech.name)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};