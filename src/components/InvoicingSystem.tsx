import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FileText, Plus, DollarSign, Send, Printer, Bot, CreditCard, Check, Trash2, Loader2, Search, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "./SessionProvider";

// Zod schema for the new, detailed invoice form
const invoiceSchema = z.object({
  id: z.string().optional(),
  jobId: z.string().min(1, "Job is required"),
  status: z.string().default('draft'),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  customerConcern: z.string().optional(),
  recommendedService: z.string().optional(),
  actualService: z.string().min(1, "Actual work performed is required"),
  paymentMethod: z.string().optional(),
  laborEntries: z.array(z.object({
    techId: z.string().min(1, "Technician is required"),
    hoursWorked: z.preprocess(val => parseFloat(String(val)), z.number().min(0.1)),
    hourlyRate: z.preprocess(val => parseFloat(String(val)), z.number().min(0)),
  })).min(1, "At least one labor entry is required"),
  partEntries: z.array(z.object({
    partId: z.string().min(1, "Part is required"),
    quantity: z.preprocess(val => parseInt(String(val), 10), z.number().int().min(1)),
    unitPrice: z.preprocess(val => parseFloat(String(val)), z.number().min(0)),
    markupPercentage: z.preprocess(val => parseFloat(String(val)), z.number().min(0)),
    finalPrice: z.preprocess(val => parseFloat(String(val)), z.number().min(0)),
  })).optional(),
  miscFees: z.array(z.object({
    description: z.string().min(1, "Description is required"),
    amount: z.preprocess(val => parseFloat(String(val)), z.number()),
  })).optional(),
});

export const InvoicingSystem = () => {
  const { toast } = useToast();
  const { session } = useSession();
  const [invoices, setInvoices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [jobs, setJobs] = useState([]);
  const [parts, setParts] = useState([]);
  const [techs, setTechs] = useState([]);
  const [invoiceSettings, setInvoiceSettings] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm<z.infer<typeof invoiceSchema>>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      status: 'draft',
      invoiceDate: new Date().toISOString().substring(0, 10),
      laborEntries: [],
      partEntries: [],
      miscFees: [],
    },
  });

  const { fields: laborFields, append: appendLabor, remove: removeLabor } = useFieldArray({ control: form.control, name: "laborEntries" });
  const { fields: partFields, append: appendPart, remove: removePart } = useFieldArray({ control: form.control, name: "partEntries" });
  const { fields: miscFeeFields, append: appendMiscFee, remove: removeMiscFee } = useFieldArray({ control: form.control, name: "miscFees" });

  // Fetch all necessary data on component mount
  useEffect(() => {
    const fetchData = async () => {
      const { data: invData } = await supabase.from('invoices').select('*, jobs(*), invoice_parts(*, parts(*)), invoice_labor(*, techs(*)), payments(*)').order('created_at', { ascending: false });
      setInvoices(invData || []);
      const { data: jobData } = await supabase.from('jobs').select('*').not('status', 'eq', 'completed');
      setJobs(jobData || []);
      const { data: partData } = await supabase.from('parts').select('*');
      setParts(partData || []);
      const { data: techData } = await supabase.from('techs').select('*');
      setTechs(techData || []);
      const { data: settingsData } = await supabase.from('invoice_settings').select('*').single();
      setInvoiceSettings(settingsData);
    };
    fetchData();
  }, []);

  // Reset form and state when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setEditingInvoice(null);
      form.reset({
        status: 'draft',
        invoiceDate: new Date().toISOString().substring(0, 10),
        laborEntries: [],
        partEntries: [],
        miscFees: [],
      });
    }
  }, [isModalOpen]);

  // Pre-fill form when editing an invoice
  const handleEditInvoice = (invoice: any) => {
    setEditingInvoice(invoice);
    form.reset({
      id: invoice.id,
      jobId: invoice.job_id,
      status: invoice.status,
      invoiceDate: new Date(invoice.created_at).toISOString().substring(0, 10),
      customerConcern: invoice.customer_concern,
      recommendedService: invoice.recommended_service,
      actualService: invoice.actual_service,
      paymentMethod: invoice.payment_method,
      laborEntries: invoice.invoice_labor.map((l: any) => ({
        techId: l.tech_id,
        hoursWorked: l.hours_worked,
        hourlyRate: l.hourly_rate,
      })),
      partEntries: invoice.invoice_parts.map((p: any) => ({
        partId: p.part_id,
        quantity: p.quantity,
        unitPrice: p.unit_price,
        markupPercentage: p.markup_percentage,
        finalPrice: p.final_price,
      })),
      miscFees: invoice.misc_fees || [],
    });
    setIsModalOpen(true);
  };

  // Delete an invoice
  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!window.confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) return;
    
    // Must delete from child tables first if no cascade is set up
    await supabase.from('invoice_parts').delete().eq('invoice_id', invoiceId);
    await supabase.from('invoice_labor').delete().eq('invoice_id', invoiceId);
    await supabase.from('payments').delete().eq('invoice_id', invoiceId);
    
    const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Success", description: "Invoice deleted." });
      setInvoices(invoices.filter(inv => inv.id !== invoiceId));
    }
  };

  // Form submission for both create and update
  const onSubmit = async (values: z.infer<typeof invoiceSchema>) => {
    if (!invoiceSettings) {
      toast({ variant: "destructive", title: "Error", description: "Invoice settings not loaded." });
      return;
    }

    const laborTotal = values.laborEntries.reduce((sum, l) => sum + l.hoursWorked * l.hourlyRate, 0);
    const partsTotal = values.partEntries.reduce((sum, p) => sum + p.finalPrice, 0);
    
    let taxableBase = 0;
    if (invoiceSettings.tax_applies_to === 'both') {
      taxableBase = partsTotal + laborTotal;
    } else if (invoiceSettings.tax_applies_to === 'parts') {
      taxableBase = partsTotal;
    } else if (invoiceSettings.tax_applies_to === 'labor') {
      taxableBase = laborTotal;
    }

    const subtotal = laborTotal + partsTotal;
    const totalTax = taxableBase * (invoiceSettings.tax_rate / 100);
    const miscFeesTotal = values.miscFees?.reduce((sum, f) => sum + f.amount, 0) || 0;
    
    let grandTotal = subtotal + totalTax + miscFeesTotal;
    
    let ccFee = 0;
    if (values.paymentMethod === 'stripe' || values.paymentMethod === 'cc_physical') {
      ccFee = grandTotal * (invoiceSettings.credit_card_fee_percentage / 100);
      grandTotal += ccFee;
    }

    const invoicePayload = {
      job_id: values.jobId,
      status: values.status,
      created_at: values.invoiceDate,
      customer_concern: values.customerConcern,
      recommended_service: values.recommendedService,
      actual_service: values.actualService,
      payment_method: values.paymentMethod,
      subtotal,
      total_tax: totalTax,
      grand_total: grandTotal,
      misc_fees: values.miscFees,
      tax_percentage: invoiceSettings.tax_rate,
      tax_applies_to: invoiceSettings.tax_applies_to,
      cc_fee_percentage: invoiceSettings.credit_card_fee_percentage,
      created_by: session?.user.id,
    };

    // Update or Insert
    const { data: savedInvoice, error } = editingInvoice
      ? await supabase.from('invoices').update(invoicePayload).eq('id', editingInvoice.id).select().single()
      : await supabase.from('invoices').insert(invoicePayload).select().single();

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }

    // Handle line items (delete old and insert new for simplicity on update)
    await supabase.from('invoice_labor').delete().eq('invoice_id', savedInvoice.id);
    await supabase.from('invoice_parts').delete().eq('invoice_id', savedInvoice.id);

    const laborToInsert = values.laborEntries.map(l => ({ ...l, invoice_id: savedInvoice.id }));
    const partsToInsert = values.partEntries.map(p => ({ ...p, invoice_id: savedInvoice.id }));

    await supabase.from('invoice_labor').insert(laborToInsert);
    await supabase.from('invoice_parts').insert(partsToInsert);

    toast({ title: "Success", description: `Invoice ${editingInvoice ? 'updated' : 'created'}.` });
    setIsModalOpen(false);
    const { data: invData } = await supabase.from('invoices').select('*, jobs(*), invoice_parts(*, parts(*)), invoice_labor(*, techs(*)), payments(*)').order('created_at', { ascending: false });
    setInvoices(invData || []);
  };

  const filteredInvoices = invoices.filter(invoice =>
    (invoice.id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (invoice.jobs?.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (invoice.jobs?.truck_vin?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="h-6 w-6" /> Invoicing System
        </h2>
        <Button onClick={() => setIsModalOpen(true)}><Plus className="h-4 w-4 mr-2" /> New Invoice</Button>
      </div>

      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
        <Input
          placeholder="Search invoices by ID, customer name, or VIN..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full md:w-1/2 lg:w-1/3"
        />
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Invoices</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold">Invoice #{invoice.id?.slice(0, 8)}</h3>
                  <p className="text-sm text-gray-600">{invoice.jobs?.customer_name || 'N/A'}</p>
                  <Badge>{invoice.status}</Badge>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">${invoice.grand_total?.toLocaleString()}</p>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" onClick={() => handleEditInvoice(invoice)}><Edit className="h-3 w-3" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteInvoice(invoice.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Invoice Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              {/* Form fields for job, date, status etc. */}
              {/* Labor, Parts, Misc Fees Field Arrays */}
              {/* Summary and Submit Button */}
              <p className="text-center text-gray-500">Invoice form with new logic would be here.</p>
               <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Invoice"}
                </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};