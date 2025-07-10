// Add these right before the export
const PartsStep = ({ onNext, onBack }: { onNext: () => void; onBack: () => void }) => (
  <div>
    {/* Parts form */}
    <div className="flex justify-between">
      <Button variant="outline" onClick={onBack}>Back</Button>
      <Button onClick={onNext}>Next: Summary</Button>
    </div>
  </div>
);

const SummaryStep = ({ onBack }: { onBack: () => void }) => (
  <div>
    {/* Summary content */}
    <Button variant="outline" onClick={onBack}>Back</Button>
    <Button className="ml-2">Submit Invoice</Button>
  </div>
);