import { useState } from 'react';
import { Steps } from '@/components/ui/steps';
import { Button } from '@/components/ui/button'; // Added Button import

const steps = [
  { title: 'Job Details', description: 'Select job and basic info' },
  { title: 'Labor Charges', description: 'Add work performed' },
  { title: 'Parts & Materials', description: 'Add parts used' },
  { title: 'Fees & Summary', description: 'Review and complete' }
];

interface InvoicingSystemProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  editingInvoice: any;
  onSuccess: () => void;
  onOpenEditor: (invoice: any) => void;
}

export const InvoicingSystem = ({
  isOpen,
  setIsOpen,
  editingInvoice,
  onSuccess,
  onOpenEditor
}: InvoicingSystemProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  // Placeholder components for each step
  const JobDetailsStep = ({ onNext }: { onNext: () => void }) => (
    <div>
      {/* Job selection form */}
      <Button onClick={onNext}>Next: Labor Charges</Button>
    </div>
  );

  const LaborChargesStep = ({ onNext, onBack }: { onNext: () => void; onBack: () => void }) => (
    <div>
      {/* Labor entry form */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext}>Next: Parts</Button>
      </div>
    </div>
  );

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

  return (
    <div className="space-y-6">
      <Steps steps={steps} currentStep={currentStep} />
      
      <div className="p-6 border rounded-lg bg-card">
        {currentStep === 0 && <JobDetailsStep onNext={nextStep} />}
        {currentStep === 1 && <LaborChargesStep onNext={nextStep} onBack={prevStep} />}
        {currentStep === 2 && <PartsStep onNext={nextStep} onBack={prevStep} />}
        {currentStep === 3 && <SummaryStep onBack={prevStep} />}
      </div>
    </div>
  );
};