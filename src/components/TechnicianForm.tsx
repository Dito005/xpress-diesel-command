import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export interface Technician {
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

interface TechnicianFormProps {
  technician?: Technician;
  onSave: (tech: Technician) => void;
  onCancel: () => void;
}

export const TechnicianForm = ({ technician, onSave, onCancel }: TechnicianFormProps) => {
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
    <div className="space-y-4 py-4">
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
            onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))}
          />
        </div>
        <div>
          <Label htmlFor="experience">Experience (years)</Label>
          <Input
            id="experience"
            type="number"
            value={formData.experience}
            onChange={(e) => setFormData(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
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
          {technician?.id ? 'Update' : 'Add'} Technician
        </Button>
      </div>
    </div>
  );
};