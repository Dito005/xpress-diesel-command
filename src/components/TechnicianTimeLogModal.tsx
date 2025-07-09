import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface TimeLog {
  id: string;
  job_id: string | null;
  clock_in: string;
  clock_out: string | null;
  notes: string | null;
  jobs?: { description: string } | null; // Joined job description
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
  const [jobs, setJobs] = useState<any[]>([]); // For job dropdown

  useEffect(() => {
    if (isOpen && technician?.id) {
      fetchTimeLogs();
      fetchJobs();
    }
  }, [isOpen, technician?.id]);

  const fetchTimeLogs = async () => {
    const { data, error } = await supabase
      .from('time_logs')
      .select(`
        *,
        jobs(description)
      `)
      .eq('user_id', technician.id)
      .order('clock_in', { ascending: false });

    if (error) {
      console.error("Error fetching time logs:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load time logs." });
    } else {
      setTimeLogs(data as TimeLog[]);
    }
  };

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('id, description');
    if (error) {
      console.error("Error fetching jobs:", error);
    } else {
      setJobs(data);
    }
  };

  const handleUpdateTime = async (logId: string, field: 'clock_in' | 'clock_out' | 'notes', value: string) => {
    const updatedValue = field.includes('clock') ? new Date(value).toISOString() : value;
    const { error } = await supabase
      .from('time_logs')
      .update({ [field]: updatedValue })
      .eq('id', logId);

    if (error) {
      toast({ variant: "destructive", title: "Error updating log", description: error.message });
    } else {
      toast({ title: "Log Updated", description: "Time log updated successfully." });
      fetchTimeLogs();
    }
  };

  const handleAddLog = async () => {
    if (!newLog.clockIn) {
      toast({ variant: "destructive", title: "Missing Info", description: "Clock In time is required." });
      return;
    }

    const { error } = await supabase
      .from('time_logs')
      .insert({
        user_id: technician.id,
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
      const { error } = await supabase
        .from('time_logs')
        .delete()
        .eq('id', logId);

      if (error) {
        toast({ variant: "destructive", title: "Error deleting log", description: error.message });
      } else {
        toast({ title: "Log Deleted", description: "Time log deleted successfully." });
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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Time Logs for {technician.name}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setIsAdding(!isAdding)}><Plus className="h-4 w-4 mr-2" /> Add Time Log</Button>
          </div>

          {isAdding && (
            <div className="p-4 border rounded-lg mb-4 space-y-4">
              <h3 className="font-semibold">Add New Log</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Job/Task</Label>
                  <select
                    value={newLog.jobId}
                    onChange={(e) => setNewLog(prev => ({ ...prev, jobId: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">General Shift</option>
                    {jobs.map(job => (
                      <option key={job.id} value={job.id}>{job.description}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input
                    placeholder="e.g., Lunch break, Diagnostic"
                    value={newLog.notes}
                    onChange={(e) => setNewLog(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Clock In</Label>
                  <Input
                    type="datetime-local"
                    value={newLog.clockIn}
                    onChange={(e) => setNewLog(prev => ({ ...prev, clockIn: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Clock Out</Label>
                  <Input
                    type="datetime-local"
                    value={newLog.clockOut}
                    onChange={(e) => setNewLog(prev => ({ ...prev, clockOut: e.target.value }))}
                  />
                </div>
              </div>
              <Button size="sm" onClick={handleAddLog}><Save className="h-4 w-4 mr-2" /> Save Log</Button>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job/Task</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeLogs.map(log => (
                <TableRow key={log.id}>
                  <TableCell>{log.jobs?.description || 'General Shift'}</TableCell>
                  <TableCell>
                    <Input type="datetime-local" value={log.clock_in.substring(0, 16)} onChange={e => handleUpdateTime(log.id, 'clock_in', e.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Input type="datetime-local" value={log.clock_out?.substring(0, 16) || ''} onChange={e => handleUpdateTime(log.id, 'clock_out', e.target.value)} />
                  </TableCell>
                  <TableCell>{calculateDuration(log.clock_in, log.clock_out)}</TableCell>
                  <TableCell>
                    <Input type="text" value={log.notes || ''} onChange={e => handleUpdateTime(log.id, 'notes', e.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteLog(log.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};