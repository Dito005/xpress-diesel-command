import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Activity, MapPin, Edit } from "lucide-react";
import { TechnicianTimeLogModal } from "./TechnicianTimeLogModal";
import { supabase } from "@/integrations/supabase/client"; // Changed import path

interface Technician {
  id: string;
  name: string;
  role: string;
  current_activity: string;
  location: string;
  status: 'active' | 'break' | 'offline';
  hourly_rate: number;
  email: string;
  phone: string;
  efficiency: number;
  experience: number;
  active: boolean;
  certifications: string[];
  specialties: string[];
}

export const TechnicianList = () => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [isTimeLogModalOpen, setIsTimeLogModal] = useState(false);

  useEffect(() => {
    fetchTechnicians();
    const channel = supabase
      .channel('technician_list_changes')
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
    } else {
      // Add mock current_activity and status for display purposes if not in DB
      const enrichedData = data.map(tech => ({
        ...tech,
        current_activity: tech.current_activity || "Idle",
        status: tech.status || (tech.active ? 'active' : 'offline'),
        hourly_rate: tech.hourly_rate || 0,
      }));
      setTechnicians(enrichedData as Technician[]);
    }
  };

  const handleTechClick = (tech: Technician) => {
    setSelectedTech(tech);
    setIsTimeLogModal(true);
  };

  const getRoleBadgeColor = (role: string) => ({
    lead: 'bg-purple-100 text-purple-800',
    senior: 'bg-blue-100 text-blue-800',
    junior: 'bg-green-100 text-green-800',
  }[role] || 'bg-gray-100 text-gray-800');

  const getStatusColor = (status: string) => ({
    active: 'bg-green-400',
    break: 'bg-yellow-400',
    offline: 'bg-red-400',
  }[status] || 'bg-gray-400');

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Technicians</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {technicians.map((tech) => (
              <div key={tech.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => handleTechClick(tech)}>
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-100 text-blue-700">{getInitials(tech.name)}</AvatarFallback>
                    </Avatar>
                    <div className={`absolute -top-1 -right-1 w-3 h-3 ${getStatusColor(tech.status)} rounded-full border-2 border-white`}></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{tech.name}</h3>
                      <Badge className={getRoleBadgeColor(tech.role)} variant="secondary">{tech.role}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1"><Activity className="h-3 w-3" />{tech.current_activity}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{tech.location}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm"><Edit className="h-3 w-3 mr-1" /> View Logs</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {selectedTech && (
        <TechnicianTimeLogModal
          isOpen={isTimeLogModalOpen}
          onClose={() => setIsTimeLogModal(false)}
          technician={selectedTech}
        />
      )}
    </>
  );
};