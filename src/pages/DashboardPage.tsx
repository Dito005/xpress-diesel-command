import { JobBoard } from '@/components/JobBoard'; // Import JobBoard

// Changed to only a default export
const DashboardPage = ({
  onJobClick,
  onGenerateInvoice,
  onOpenInvoiceEditor,
  isInvoiceEditorOpen,
  setIsInvoiceEditorOpen,
  editingInvoice,
}: {
  onJobClick: (job: any) => void;
  onGenerateInvoice: (job: any) => void;
  onOpenInvoiceEditor: (invoice: any) => void;
  isInvoiceEditorOpen: boolean;
  setIsInvoiceEditorOpen: (open: boolean) => void;
  editingInvoice: any;
}) => {
  return (
    <div className="space-y-6">
      <JobBoard onJobClick={onJobClick} onGenerateInvoice={onGenerateInvoice} />
      
      {/* Placeholder for InvoiceList or other dashboard content */}
      <div className="p-6 border rounded-lg bg-card">
        <h3 className="text-xl font-semibold mb-4">Recent Invoices</h3>
        <p className="text-muted-foreground">Invoice list coming soon...</p>
      </div>
    </div>
  );
};

export default DashboardPage;