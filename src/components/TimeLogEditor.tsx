import { useState } from 'react';
import { Input } from '@/components/ui/input'; // Added Input import
import { Button } from '@/components/ui/button'; // Added Button import

interface TimeLog {
  clock_in: Date;
  clock_out: Date | null;
  notes: string;
}

interface TimeLogEditorProps {
  log?: TimeLog;
  onSave: (log: TimeLog) => void;
}

export const TimeLogEditor = ({ log, onSave }: TimeLogEditorProps) => {
  const [editedLog, setEditedLog] = useState<TimeLog>(log || {
    clock_in: new Date(),
    clock_out: null,
    notes: ''
  });

  const handleTimeChange = (field: keyof TimeLog, value: any) => {
    setEditedLog(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">Notes</label>
        <Input
          value={editedLog.notes}
          onChange={e => handleTimeChange('notes', e.target.value)}
        />
      </div>
      <Button onClick={() => onSave(editedLog)}>
        {log ? 'Update' : 'Create'}
      </Button>
    </div>
  );
};