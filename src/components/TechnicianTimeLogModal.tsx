import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Save, Trash2, X, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TimeLog {
  id: string;
  job_id: string | null;
  clock_in: string;
  clock_out: string | null;
  notes: string | null;
  jobs?: { job_type: string; truck_vin: string | null } | null;
}

interface Technician {
  id: string;
  name: string;
  hourly_rate: number;
}

export const TechnicianTimeLogModal = ({ isOpen, onClose, technician }: { isOpen: boolean; onClose: () => void; technician: Technician }) => {
  const { toast } = useToast();
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newLog, setNewLog] = useState({ jobId: '', clockIn: '', clockOut: '', notes: '' });
  const [jobs, setJobs] = useState<any[]>([]);
  const [editingLog, setEditingLog] = useState<TimeLog | null>(null);

  useEffect(() => {
    if (isOpen && technician?.id) {
      fetchTimeLogs();
      fetchJobs();
    }
  }, [isOpen, technician?.id]);

  const fetchTimeLogs = async () => {
    const { data, error } = await supabase
      .from('time_logs')
      .select(`*, jobs(job_type, truck_vin)`)
      .eq('tech_id', technician.id)
      .order('clock_in', { ascending: false });

    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load time logs." });
    } else {
      setTimeLogs(data as TimeLog[]);
    }
  };

  const fetchJobs = async () => {
    const { data, error } = await supabase.from('jobs').select('id, job_type, truck_vin');
    if (error) console.error("Error fetching jobs:", error);
    else setJobs(data);
  };

  const handleSaveEdit = async () => {
    if (!editingLog) return;
    const { error } = await supabase
      .from('time_logs')
      .update({
        clock_in: new Date(editingLog.clock_in).toISOString(),
        clock_out: editingLog.clock_out ? new Date(editingLog.clock_out).toISOString() : null,
        notes: editingLog.notes,
      })
      .eq('id', editingLog.id);

    if (error) {
      toast({ variant: "destructive", title: "Error updating log", description: error.message });
    } else {
      toast({ title: "Log Updated", description: "Time log updated successfully." });
      setEditingLog(null);
      fetchTimeLogs();
    }
  };

  const handleAddLog = async () => {
    if (!newLog.clockIn) {
      toast({ variant: "destructive", title: "Missing Info", description: "Clock In time is required." });
      return;
    }
    const { error } = await supabase.from('time_logs').insert({
      tech_id: technician.id,
      job_id: newLog.jobId || null,
      clock_in: new Date(newLog.clockIn).toISOString(),
      clock_out: newLog.clockOut ? new Date(newLog.clockOut).toISOString() : null,
      notes: newLog.notes,
    });
    if (error) {
      toast({ variant: "destructive", title: "Error adding log", description: error.message });
    } else {
      toast({ title: "Log Added", description: "New time log added successfully." });
      setNewLog({ jobId: '', clockIn: '', clockOut: '', notes: '' });
      setIsAdding(false);
      fetchTimeLogs();
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (window.confirm("Are you sure you want to delete this time log?")) {
      const { error } = await supabase.from('time_logs').delete().eq('id', logId);
      if (error) {
        toast({ variant: "destructive", title: "Error deleting log", description: error.message });
      } else {
        toast({ title: "Log Deleted" });
        fetchTimeLogs();
      }
    }
  };

  const calculateDuration = (start: string, end: string | null) => {
    if (!end) return "In Progress";
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-slate-900/95 backdrop-blur-sm border-slate-800 text-slate-200">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Time Logs for {technician.name}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsAdding(!isAdding)}><Plus className="h-4 w-4 mr-2" /> Add Time Log</Button>
          </div>

          {isAdding && (
            <div className="p-4 border border-slate-700 rounded-lg space-y-4 bg-slate-800/50">
              <h3 className="font-semibold text-slate-100">Add New Log</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-slate-400">Job/Task</Label><select value={newLog.jobId} onChange={(e) => setNewLog(p => ({ ...p, jobId: e.target.value }))} className="w-full p-2 border rounded-md bg-slate-800 border-slate-600 text-slate-200"><option value="">General Shift</option>{jobs.map(job => (<option key={job.id} value={job.id}>{job.job_type} ({job.truck_vin?.slice(-6) || 'N/A'})</option>))}</select></div>
                <div><Label className="text-slate-400">Notes</Label><Input placeholder="e.g., Lunch break, Diagnostic" value={newLog.notes} onChange={(e) => setNewLog(p => ({ ...p, notes: e.target.value }))} className="bg-slate-800 border-slate-600" /></div>
                <div><Label className="text-slate-400">Clock In</Label><Input type="datetime-local" value={newLog.clockIn} onChange={(e) => setNewLog(p => ({ ...p, clockIn: e.target.value }))} className="bg-slate-800 border-slate-600" /></div>
                <div><Label className="text-slate-400">Clock Out</Label><Input type="datetime-local" value={newLog.clockOut} onChange={(e) => setNewLog(p => ({ ...p, clockOut: e.target.value }))} className="bg-slate-800 border-slate-600" /></div>
              </div>
              <Button size="sm" onClick={handleAddLog}><Save className="h-4 w-4 mr-2" /> Save Log</Button>
            </div>
          )}

          <div className="border border-slate-800 rounded-lg overflow-hidden">
            <Table>
              <TableHeader><TableRow className="border-slate-800 hover:bg-slate-800/50"><TableHead className="text-slate-300">Job/Task</TableHead><TableHead className="text-slate-300">Clock In</TableHead><TableHead className="text-slate-300">Clock Out</TableHead><TableHead className="text-slate-300">Duration</TableHead><TableHead className="text-slate-300">Notes</TableHead><TableHead className="text-slate-300 text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {timeLogs.map(log => (
                  <TableRow key={log.id} className="border-slate-800">
                    <TableCell className="text-slate-300">{log.jobs ? `${log.jobs.job_type} (${log.jobs.truck_vin?.slice(-6) || 'N/A'})` : 'General Shift'}</TableCell>
                    <TableCell>{editingLog?.id === log.id ? <Input type="datetime-local" value={editingLog.clock_in ? new Date(editingLog.clock_in).toISOString().substring(0, 16) : ''} onChange={e => setEditingLog({...editingLog, clock_in: e.target.value})} className="bg-slate-800 border-slate-600" /> : <span className="text-slate-300">{new Date(log.clock_in).toLocaleString()}</span>}</TableCell>
                    <TableCell>{editingLog?.id === log.id ? <Input type="datetime-local" value={editingLog.clock_out ? new Date(editingLog.clock_out).toISOString().substring(0, 16) : ''} onChange={e => setEditingLog({...editingLog, clock_out: e.target.value})} className="bg-slate-800 border-slate-600" /> : <span className="text-slate-300">{log.clock_out ? new Date(log.clock_out).toLocaleString() : 'N/A'}</span>}</TableCell>
                    <TableCell className="text-slate-400">{calculateDuration(log.clock_in, log.clock_out)}</TableCell>
                    <TableCell>{editingLog?.id === log.id ? <Input type="text" value={editingLog.notes || ''} onChange={e => setEditingLog({...editingLog, notes: e.target.value})} className="bg-slate-800 border-slate-600" /> : <span className="text-slate-300">{log.notes || '-'}</span>}</TableCell>
                    <TableCell className="text-right">
                      {editingLog?.id === log.id ? (
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="icon" onClick={handleSaveEdit}><Save className="h-4 w-4 text-green-400" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditingLog(null)}><X className="h-4 w-4 text-slate-400" /></Button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="icon" onClick={() => setEditingLog(log)}><Edit className="h-4 w-4 text-blue-400" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteLog(log.id)}><Trash2 className="h-4 w-4 text-red-400" /></Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};