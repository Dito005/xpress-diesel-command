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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, DollarSign, Trash2, Loader2, Search, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "./SessionProvider";

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
    hoursWorked: z.preprocess(val => parseFloat(String(val) || '0'), z.number().min(0.1)),
    hourlyRate: z.preprocess(val => parseFloat(String(val) || '0'), z.number().min(0)),
  })).min(1, "At least one labor entry is required"),
  partEntries: z.array(z.object({
    partId: z.string().min(1, "Part is required"),
    quantity: z.preprocess(val => parseInt(String(val) || '0', 10), z.number().int().min(1)),
    unitPrice: z.preprocess(val => parseFloat(String(val) || '0'), z.number().min(0)),
    markupPercentage: z.preprocess(val => parseFloat(String(val) || '0'), z.number().min(0)),
    finalPrice: z.preprocess(val => parseFloat(String(val) || '0'), z.number().min(0)),
  })).optional(),
  miscFees: z.array(z.object({
    description: z.string().min(1, "Description is required"),
    amount: z.preprocess(val => parseFloat(String(val) || '0'), z.number()),
  })).optional(),
});

export const InvoicingSystem = () => {
  const { toast } = useToast();
  const { session } = useSession();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [techs, setTechs] = useState<any[]>([]);
  const [invoiceSettings, setInvoiceSettings] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [totals, setTotals] = useState({ subtotal: 0, tax: 0, grandTotal: 0, ccFee: 0 });

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

  const watchedValues = form.watch();

  useEffect(() => {
    if (!invoiceSettings) return;

    const laborTotal = watchedValues.laborEntries?.reduce((sum, l) => sum + (l.hoursWorked || 0) * (l.hourlyRate || 0), 0) || 0;
    const partsTotal = watchedValues.partEntries?.reduce((sum, p) => sum + (p.finalPrice || 0), 0) || 0;
    const subtotal = laborTotal + partsTotal;

    let taxableBase = 0;
    if (invoiceSettings.tax_applies_to === 'both') taxableBase = subtotal;
    else if (invoiceSettings.tax_applies_to === 'parts') taxableBase = partsTotal;
    else if (invoiceSettings.tax_applies_to === 'labor') taxableBase = laborTotal;

    const totalTax = taxableBase * (invoiceSettings.tax_rate / 100);
    const miscFeesTotal = watchedValues.miscFees?.reduce((sum, f) => sum + (f.amount || 0), 0) || 0;
    const totalBeforeCC = subtotal + totalTax + miscFeesTotal;
    
    let ccFee = 0;
    if (watchedValues.paymentMethod === 'stripe' || watchedValues.paymentMethod === 'cc_physical') {
      ccFee = totalBeforeCC * (invoiceSettings.credit_card_fee_percentage / 100);
    }
    
    const grandTotal = totalBeforeCC + ccFee;

    setTotals({ subtotal, tax: totalTax, grandTotal, ccFee });
  }, [watchedValues, invoiceSettings]);

  const fetchAllData = async () => {
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

  useEffect(() => {
    fetchAllData();
  }, []);

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
  }, [isModalOpen, form]);

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
      laborEntries: invoice.invoice_labor.map((l: any) => ({ techId: l.tech_id, hoursWorked: l.hours_worked, hourlyRate: l.hourly_rate })),
      partEntries: invoice.invoice_parts.map((p: any) => ({ partId: p.part_id, quantity: p.quantity, unitPrice: p.unit_price, markupPercentage: p.markup_percentage, finalPrice: p.final_price })),
      miscFees: invoice.misc_fees || [],
    });
    setIsModalOpen(true);
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!window.confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) return;
    await supabase.from('invoice_parts').delete().eq('invoice_id', invoiceId);
    await supabase.from('invoice_labor').delete().eq('invoice_id', invoiceId);
    await supabase.from('payments').delete().eq('invoice_id', invoiceId);
    const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else {
      toast({ title: "Success", description: "Invoice deleted." });
      setInvoices(invoices.filter(inv => inv.id !== invoiceId));
    }
  };

  const onSubmit = async (values: z.infer<typeof invoiceSchema>) => {
    const invoicePayload = {
      job_id: values.jobId,
      status: values.status,
      created_at: values.invoiceDate,
      customer_concern: values.customerConcern,
      recommended_service: values.recommendedService,
      actual_service: values.actualService,
      payment_method: values.paymentMethod,
      subtotal: totals.subtotal,
      total_tax: totals.tax,
      grand_total: totals.grandTotal,
      misc_fees: values.miscFees,
      tax_percentage: invoiceSettings.tax_rate,
      tax_applies_to: invoiceSettings.tax_applies_to,
      cc_fee_percentage: invoiceSettings.credit_card_fee_percentage,
      created_by: session?.user.id,
    };

    const { data: savedInvoice, error } = editingInvoice
      ? await supabase.from('invoices').update(invoicePayload).eq('id', editingInvoice.id).select().single()
      : await supabase.from('invoices').insert(invoicePayload).select().single();

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }

    await supabase.from('invoice_labor').delete().eq('invoice_id', savedInvoice.id);
    await supabase.from('invoice_parts').delete().eq('invoice_id', savedInvoice.id);
    if (values.laborEntries.length > 0) await supabase.from('invoice_labor').insert(values.laborEntries.map(l => ({ ...l, invoice_id: savedInvoice.id })));
    if (values.partEntries.length > 0) await supabase.from('invoice_parts').insert(values.partEntries.map(p => ({ ...p, invoice_id: savedInvoice.id })));

    toast({ title: "Success", description: `Invoice ${editingInvoice ? 'updated' : 'created'}.` });
    setIsModalOpen(false);
    fetchAllData();
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
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="jobId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job</FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      const selectedJob = jobs.find(j => j.id === value);
                      if (selectedJob) {
                        form.setValue("customerConcern", selectedJob.customer_concern);
                        form.setValue("recommendedService", selectedJob.recommended_service);
                      }
                    }} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a job" /></SelectTrigger></FormControl>
                      <SelectContent>{jobs.map(job => <SelectItem key={job.id} value={job.id}>{job.truck_vin?.slice(-6)} - {job.job_type}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="invoiceDate" render={({ field }) => (<FormItem><FormLabel>Invoice Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="final">Final</SelectItem><SelectItem value="paid">Paid</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="actualService" render={({ field }) => (<FormItem><FormLabel>Work Performed</FormLabel><FormControl><Textarea placeholder="Describe work performed..." {...field} /></FormControl><FormMessage /></FormItem>)} />
              
              {/* Labor Entries */}
              <Card><CardHeader><CardTitle>Labor</CardTitle></CardHeader><CardContent className="space-y-2">
                {laborFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4"><FormField control={form.control} name={`laborEntries.${index}.techId`} render={({ field }) => (<Select onValueChange={(val) => { field.onChange(val); const tech = techs.find(t => t.id === val); if (tech) form.setValue(`laborEntries.${index}.hourlyRate`, tech.hourly_rate || invoiceSettings.default_hourly_rate); }} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Tech" /></SelectTrigger></FormControl><SelectContent>{techs.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>)} /></div>
                    <div className="col-span-3"><FormField control={form.control} name={`laborEntries.${index}.hoursWorked`} render={({ field }) => (<Input type="number" placeholder="Hours" {...field} />)} /></div>
                    <div className="col-span-3"><FormField control={form.control} name={`laborEntries.${index}.hourlyRate`} render={({ field }) => (<Input type="number" placeholder="Rate" {...field} />)} /></div>
                    <div className="col-span-2"><Button type="button" variant="destructive" size="sm" onClick={() => removeLabor(index)}><Trash2 className="h-4 w-4" /></Button></div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendLabor({ techId: '', hoursWorked: 1, hourlyRate: invoiceSettings.default_hourly_rate })}>Add Labor</Button>
              </CardContent></Card>

              {/* Part Entries */}
              <Card><CardHeader><CardTitle>Parts</CardTitle></CardHeader><CardContent className="space-y-2">
                {partFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-3"><FormField control={form.control} name={`partEntries.${index}.partId`} render={({ field }) => (<Select onValueChange={(val) => { field.onChange(val); const part = parts.find(p => p.id === val); if (part) { form.setValue(`partEntries.${index}.unitPrice`, part.cost); const qty = form.getValues(`partEntries.${index}.quantity`); const markup = form.getValues(`partEntries.${index}.markupPercentage`); form.setValue(`partEntries.${index}.finalPrice`, qty * part.cost * (1 + markup / 100)); } }} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Part" /></SelectTrigger></FormControl><SelectContent>{parts.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>)} /></div>
                    <div className="col-span-2"><FormField control={form.control} name={`partEntries.${index}.quantity`} render={({ field }) => (<Input type="number" placeholder="Qty" {...field} onChange={(e) => { field.onChange(e); const partId = form.getValues(`partEntries.${index}.partId`); const part = parts.find(p => p.id === partId); if (part) { const markup = form.getValues(`partEntries.${index}.markupPercentage`); form.setValue(`partEntries.${index}.finalPrice`, Number(e.target.value) * part.cost * (1 + markup / 100)); } }} />)} /></div>
                    <div className="col-span-2"><FormField control={form.control} name={`partEntries.${index}.unitPrice`} render={({ field }) => (<Input type="number" placeholder="Unit Price" {...field} readOnly />)} /></div>
                    <div className="col-span-2"><FormField control={form.control} name={`partEntries.${index}.markupPercentage`} render={({ field }) => (<Input type="number" placeholder="Markup %" {...field} onChange={(e) => { field.onChange(e); const partId = form.getValues(`partEntries.${index}.partId`); const part = parts.find(p => p.id === partId); if (part) { const qty = form.getValues(`partEntries.${index}.quantity`); form.setValue(`partEntries.${index}.finalPrice`, qty * part.cost * (1 + Number(e.target.value) / 100)); } }} />)} /></div>
                    <div className="col-span-2"><FormField control={form.control} name={`partEntries.${index}.finalPrice`} render={({ field }) => (<Input type="number" placeholder="Final Price" {...field} readOnly />)} /></div>
                    <div className="col-span-1"><Button type="button" variant="destructive" size="sm" onClick={() => removePart(index)}><Trash2 className="h-4 w-4" /></Button></div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendPart({ partId: '', quantity: 1, unitPrice: 0, markupPercentage: invoiceSettings.default_markup_parts, finalPrice: 0 })}>Add Part</Button>
              </CardContent></Card>

              {/* Misc Fees & Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card><CardHeader><CardTitle>Fees & Payment</CardTitle></CardHeader><CardContent className="space-y-2">
                  {miscFeeFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-center">
                      <FormField control={form.control} name={`miscFees.${index}.description`} render={({ field }) => (<Input placeholder="Fee description" {...field} />)} />
                      <FormField control={form.control} name={`miscFees.${index}.amount`} render={({ field }) => (<Input type="number" placeholder="Amount" {...field} />)} />
                      <Button type="button" variant="destructive" size="sm" onClick={() => removeMiscFee(index)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => appendMiscFee({ description: 'Shop Supplies', amount: totals.subtotal * (invoiceSettings.shop_supply_fee_percentage / 100) })}>Add Shop Fee</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendMiscFee({ description: 'Disposal Fee', amount: invoiceSettings.disposal_fee })}>Add Disposal Fee</Button>
                  </div>
                  <FormField control={form.control} name="paymentMethod" render={({ field }) => (<FormItem className="pt-4"><FormLabel>Payment Method</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger></FormControl><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="check">Check</SelectItem><SelectItem value="cc_physical">Credit Card (Physical)</SelectItem><SelectItem value="stripe">Credit Card (Online)</SelectItem></SelectContent></Select></FormItem>)} />
                </CardContent></Card>
                <Card><CardHeader><CardTitle>Summary</CardTitle></CardHeader><CardContent className="space-y-1 text-sm">
                  <div className="flex justify-between"><span>Subtotal:</span><span>${totals.subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Tax ({invoiceSettings?.tax_rate}%):</span><span>${totals.tax.toFixed(2)}</span></div>
                  {watchedValues.miscFees?.map((fee, i) => <div key={i} className="flex justify-between"><span>{fee.description}:</span><span>${fee.amount.toFixed(2)}</span></div>)}
                  {totals.ccFee > 0 && <div className="flex justify-between"><span>CC Fee ({invoiceSettings?.credit_card_fee_percentage}%):</span><span>${totals.ccFee.toFixed(2)}</span></div>}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Grand Total:</span><span>${totals.grandTotal.toFixed(2)}</span></div>
                </CardContent></Card>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Invoice"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};