// Replace the Input with label with:
<div className="space-y-1">
  <label className="text-sm font-medium">Notes</label>
  <Input
    value={editedLog.notes}
    onChange={e => handleTimeChange('notes', e.target.value)}
  />
</div>