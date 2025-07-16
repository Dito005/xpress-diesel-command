import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Edit, Star, Clock, Wrench, Phone, Mail, MapPin, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TechnicianForm, Technician } from "./TechnicianForm";
import { TechnicianTimeLogModal } from "./TechnicianTimeLogModal";
import { createClient } from "@/lib/supabase/client"; // Updated import
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";

const fetchTechnicians = async (): Promise<Technician[]> => {
  const { data, error } = await supabase.from('techs').select('*');
  if (error) throw error;
  return data as Technician[];
};

export const TechnicianManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [viewingLogsFor, setViewingLogsFor] = useState<Technician | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const { data: technicians = [], isLoading } = useQuery({
    queryKey: ['technicians'],
    queryFn: fetchTechnicians,
  });

  useEffect(() => {
    const channel = supabase
      .channel('technicians_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'techs' }, () => {
        queryClient.invalidateQueries({ queryKey: ['technicians'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const saveMutation = useMutation({
    mutationFn: async (tech: Technician) => {
      const { id, ...updateData } = tech;
      if (id) {
        const { error } = await supabase.from('techs').update(updateData).eq('id', id);
        if (error) throw error;
        return tech;
      } else {
        const { data, error } = await supabase.from('techs').insert(updateData).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      toast({ title: `Technician ${data.id ? 'Updated' : 'Added'}`, description: `${data.name}'s profile has been saved.` });
      setSelectedTech(null);
      setShowAddDialog(false);
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error saving technician", description: error.message });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (techId: string) => {
      const { error } = await supabase.from('techs').delete().eq('id', techId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Technician Deleted", description: `Technician has been removed.` });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error deleting technician", description: error.message });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
    }
  });

  const handleDeleteTechnician = (techId: string, techName: string) => {
    if (window.confirm(`Are you sure you want to delete ${techName}? This action cannot be undone.`)) {
      deleteMutation.mutate(techId);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'lead': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
      case 'senior': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'junior': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'apprentice': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-500';
    if (efficiency >= 80) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Technician Management
        </h2>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Technician
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle>Add New Technician</DialogTitle>
            </DialogHeader>
            <TechnicianForm
              onSave={(tech) => saveMutation.mutate(tech)}
              onCancel={() => setShowAddDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/80 backdrop-blur-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Total Technicians</p><p className="text-2xl font-bold">{technicians.length}</p></div><Users className="h-8 w-8 text-blue-500 dark:text-blue-400" /></div></CardContent></Card>
        <Card className="bg-card/80 backdrop-blur-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Active</p><p className="text-2xl font-bold text-green-600 dark:text-green-500">{technicians.filter(t => t.active).length}</p></div><Star className="h-8 w-8 text-green-600 dark:text-green-500" /></div></CardContent></Card>
        <Card className="bg-card/80 backdrop-blur-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Avg Efficiency</p><p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">{technicians.length > 0 ? Math.round(technicians.reduce((sum, t) => sum + t.efficiency, 0) / technicians.length) : 0}%</p></div><Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-500" /></div></CardContent></Card>
        <Card className="bg-card/80 backdrop-blur-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Road Techs</p><p className="text-2xl font-bold text-purple-600 dark:text-purple-500">{technicians.filter(t => t.location === 'road' || t.location === 'both').length}</p></div><Wrench className="h-8 w-8 text-purple-600 dark:text-purple-500" /></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {technicians.map((tech) => (
              <div key={tech.id} className="flex items-center justify-between p-4 bg-card/80 backdrop-blur-sm rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{tech.name}</h3>
                    <Badge className={getRoleBadgeColor(tech.role)}>
                      {tech.role}
                    </Badge>
                    {!tech.active && (
                      <Badge variant="outline" className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{tech.phone}</div>
                    <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{tech.email}</div>
                    <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />{tech.location}</div>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm"><span className="font-medium">${tech.hourly_rate}/hr</span></span>
                    <span className="text-sm"><span className="font-medium">{tech.experience} years</span></span>
                    <span className={`text-sm font-medium ${getEfficiencyColor(tech.efficiency)}`}>{tech.efficiency}% efficiency</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setViewingLogsFor(tech); setIsLogModalOpen(true); }}>
                    <Clock className="h-3 w-3 mr-1" /> Time Log
                  </Button>
                  <Dialog open={selectedTech?.id === tech.id} onOpenChange={(isOpen) => !isOpen && setSelectedTech(null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedTech(tech)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-sm">
                      <DialogHeader><DialogTitle>Edit Technician</DialogTitle></DialogHeader>
                      {selectedTech && (
                        <TechnicianForm
                          technician={selectedTech}
                          onSave={(techData) => saveMutation.mutate(techData)}
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

      {viewingLogsFor && (
        <TechnicianTimeLogModal
          isOpen={isLogModalOpen}
          onClose={() => setIsLogModalOpen(false)}
          technician={viewingLogsFor}
        />
      )}
    </div>
  );
};