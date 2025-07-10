interface InvoicingSystemProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  editingInvoice: any;
  onSuccess: () => void;
  onOpenEditor: (invoice: any) => void;
}

// Then update the component usage:
<InvoicingSystem 
  isOpen={isInvoiceEditorOpen} 
  setIsOpen={setIsInvoiceEditorOpen}
  editingInvoice={editingInvoice}
  onSuccess={() => setIsInvoiceEditorOpen(false)}
  onOpenEditor={handleOpenInvoiceEditor}
/>