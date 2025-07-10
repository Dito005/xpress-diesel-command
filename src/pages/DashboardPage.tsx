import { useState } from 'react';
import { InvoicingSystem } from '@/components/InvoicingSystem'; // Corrected named import

interface InvoicingSystemProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  editingInvoice: any;
  onSuccess: () => void;
  onOpenEditor: (invoice: any) => void;
}

export const DashboardPage = ({
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
  // The props passed to DashboardPage now contain the state and handlers
  // from Index.tsx, so we don't need to redefine them here.
  // The InvoicingSystem component is rendered conditionally in Index.tsx.
  // This component will primarily contain the JobBoard and InvoiceList.

  return (
    <>
      {/* Existing content of DashboardPage (e.g., JobBoard, InvoiceList) */}
      {/* The InvoicingSystem will be rendered in Index.tsx based on isInvoiceEditorOpen */}
    </>
  );
};

export default DashboardPage;