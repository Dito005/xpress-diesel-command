import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Save } from "lucide-react";

// Mock data for a single technician's time logs
const initialTimeLogs = [
  { id: 1, type: 'shift', clockIn: '2023-10-27T08:00:00', clockOut: '2023-10-27T17:00:00', job: 'General Shift' },
  { id: 2, type: 'job', clockIn: '2023-10-27T08:15:00', clockOut: '2023-10-27T11:30:00', job: 'Job #123 - PM Service' },
  { id: 3, type: 'job', clockIn: '2023-10-27T12:30:00', clockOut: '2023-10-27T16:45:00', job: 'Job #124 - Brake Repair' },
];

export const TechnicianTimeLogModal = ({ isOpen, onClose, technician }) => {
  const [timeLogs, setTimeLogs] = useState(initialTimeLogs);
  const [isAdding, setIsAdding] = useState(false);

  const handleUpdateTime = (logId: number, field: 'clockIn' | 'clockOut', value: string) => {
    setTimeLogs(logs => logs.map(log => log.id === logId ? { ...log, [field]: value } : log));
    // Here you would call an API to save the change
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
                <div><Label>Job/Task</Label><Input placeholder="e.g., Job #125 or General" /></div>
                <div><Label>Clock In</Label><Input type="datetime-local" /></div>
                <div><Label>Clock Out</Label><Input type="datetime-local" /></div>
              </div>
              <Button size="sm"><Save className="h-4 w-4 mr-2" /> Save Log</Button>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job/Task</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeLogs.map(log => (
                <TableRow key={log.id}>
                  <TableCell>{log.job}</TableCell>
                  <TableCell>
                    <Input type="datetime-local" value={log.clockIn.substring(0, 16)} onChange={e => handleUpdateTime(log.id, 'clockIn', e.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Input type="datetime-local" value={log.clockOut?.substring(0, 16)} onChange={e => handleUpdateTime(log.id, 'clockOut', e.target.value)} />
                  </TableCell>
                  <TableCell>{calculateDuration(log.clockIn, log.clockOut)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};