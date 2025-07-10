import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, DollarSign, Trash2, Loader2, Search, Edit, Printer, Mail, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "./SessionProvider";
import { InvoiceTemplate } from "./InvoiceTemplate";
import { renderToString } from 'react-dom/server';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const invoiceSchema = z.object({
  id: z.string().optional(),
  jobId: z.string().min(1, "Job is required"),
  status: z.string().default('pending'),
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
  grandTotal: z.number().min(0.01, "Grand Total must be greater than zero."),
});

const fetchInvoicingData = async () => {
  const [invPromise, jobPromise, partPromise, techPromise, settingsPromise] = [
    supabase.from('invoices').select('*, jobs(*), invoice_parts(*, parts(*)), invoice_labor(*, techs(*)), payments(*)').order('created_at', { ascending: false }),
    supabase.from('jobs').select('*'),
    supabase.from('parts').select('*'),
    supabase.from('techs').select('*'),
    supabase.from('invoice_settings').select('*').single(),
  ];
  const [{ data: invoices }, { data: jobs }, { data: parts }, { data: techs }, { data: invoiceSettings }] = await Promise.all([invPromise, jobPromise, partPromise, techPromise, settingsPromise]);
  return { invoices: invoices || [], jobs: jobs || [], parts: parts || [], techs: techs || [], invoiceSettings };
};

interface InvoicingSystemProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  editingInvoice: any;
  onSuccess: () => void;
  onOpenEditor: (invoice?: any) => void;
}

export const InvoicingSystem = ({ isOpen, setIsOpen, editingInvoice, onSuccess, onOpenEditor }: InvoicingSystemProps) => {
  const { toast } = useToast();
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [totals, setTotals] = useState({ subtotal: 0, tax: 0, grandTotal: 0, ccFee: 0 });
  const [clockedHours, setClockedHours] = useState(0);
  const printRef = useRef(null);

  const { data, isLoading } = useQuery({ queryKey: ['invoicingData'], queryFn: fetchInvoicingData });
  const { invoices = [], jobs = [], parts = [], techs = [], invoiceSettings = null } = data || {};

  const form = useForm<z.infer<typeof invoiceSchema>>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { status: 'pending', invoiceDate: new Date().toISOString().substring(0, 10), laborEntries: [], partEntries: [], miscFees: [], grandTotal: 0 },
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
    form.setValue('grandTotal', grandTotal);
  }, [watchedValues, invoiceSettings, form]);

  useEffect(() => {
    const channel = supabase.channel('invoicing-changes').on('postgres_changes', { event: '*', schema: 'public' }, () => queryClient.invalidateQueries({ queryKey: ['invoicingData'] })).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  useEffect(() => {
    if (isOpen && editingInvoice) {
      form.reset({
        id: editingInvoice.id,
        jobId: editingInvoice.job_id,
        status: editingInvoice.status,
        invoiceDate: new Date(editingInvoice.created_at).toISOString().substring(0, 10),
        customerConcern: editingInvoice.customer_concern,
        recommendedService: editingInvoice.recommended_service,
        actualService: editingInvoice.actual_service,
        paymentMethod: editingInvoice.payment_method,
        laborEntries: editingInvoice.invoice_labor.map((l: any) => ({ techId: l.tech_id, hoursWorked: l.hours_worked, hourlyRate: l.hourly_rate })),
        partEntries: editingInvoice.invoice_parts.map((p: any) => ({ partId: p.part_id, quantity: p.quantity, unitPrice: p.unit_price, markupPercentage: p.markup_percentage, finalPrice: p.final_price })),
        miscFees: editingInvoice.misc_fees || [],
      });
    } else if (!isOpen) {
      form.reset({ status: 'pending', invoiceDate: new Date().toISOString().substring(0, 10), laborEntries: [], partEntries: [], miscFees: [], grandTotal: 0 });
    }
  }, [isOpen, editingInvoice, form]);

  const upsertInvoiceMutation = useMutation({
    mutationFn: async (values: z.infer<typeof invoiceSchema>) => {
      const invoicePayload = { job_id: values.jobId, status: values.status, created_at: values.invoiceDate, customer_concern: values.customerConcern, recommended_service: values.recommendedService, actual_service: values.actualService, payment_method: values.paymentMethod, subtotal: totals.subtotal, tax: totals.tax, grand_total: totals.grandTotal, misc_fees: values.miscFees, created_by: session?.user.id };
      const { data: savedInvoice, error } = values.id ? await supabase.from('invoices').update(invoicePayload).eq('id', values.id).select().single() : await supabase.from('invoices').insert(invoicePayload).select().single();
      if (error) throw error;
      await supabase.from('invoice_labor').delete().eq('invoice_id', savedInvoice.id);
      await supabase.from('invoice_parts').delete().eq('invoice_id', savedInvoice.id);
      if (values.laborEntries.length > 0) await supabase.from('invoice_labor').insert(values.laborEntries.map(l => ({ ...l, invoice_id: savedInvoice.id })));
      if (values.partEntries.length > 0) await supabase.from('invoice_parts').insert(values.partEntries.map(p => ({ ...p, invoice_id: savedInvoice.id })));
      return savedInvoice;
    },
    onSuccess: (data) => {
      toast({ title: "Success", description: `Invoice ${data.id ? 'updated' : 'created'}.` });
      queryClient.invalidateQueries({ queryKey: ['invoicingData'] });
      onSuccess();
    },
    onError: (error: any) => toast({ variant: "destructive", title: "Error", description: error.message }),
  });

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      const invoiceHtml = renderToString(<InvoiceTemplate ref={printRef} invoice={editingInvoice} totals={totals} settings={invoiceSettings} companyInfo={{}} />);
      const { error } = await supabase.functions.invoke('send-invoice-email', { body: { toEmail: editingInvoice.jobs.customer_email, invoiceHtml, invoiceId: editingInvoice.id.slice(0, 8) } });
      if (error) throw error;
      await supabase.from('invoices').update({ status: 'sent' }).eq('id', editingInvoice.id);
    },
    onSuccess: () => {
      toast({ title: "Email Sent", description: "Invoice has been sent to the customer." });
      queryClient.invalidateQueries({ queryKey: ['invoicingData'] });
      onSuccess();
    },
    onError: (error: any) => toast({ variant: "destructive", title: "Email Failed", description: error.message }),
  });

  const handleJobSelect = async (jobId: string) => {
    const selectedJob = jobs.find(j => j.id === jobId);
    if (selectedJob) {
      form.setValue("customerConcern", selectedJob.customer_concern);
      form.setValue("recommendedService", selectedJob.recommended_service);
      const { data: logs } = await supabase.from('time_logs').select('*').eq('job_id', jobId);
      const totalMs = logs?.reduce((sum, log) => sum + (new Date(log.clock_out).getTime() - new Date(log.clock_in).getTime()), 0) || 0;
      setClockedHours(totalMs / 3600000);
    }
  };

  const handlePrint = async () => {
    const element = printRef.current;
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 2 });
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), (canvas.height * pdf.internal.pageSize.getWidth()) / canvas.width);
    pdf.save(`invoice-${editingInvoice.id.slice(0, 8)}.pdf`);
  };

  const filteredInvoices = invoices.filter(invoice =>
    (invoice.id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (invoice.jobs?.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (invoice.jobs?.truck_vin?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><FileText className="h-6 w-6" /> Invoicing System</h2>
        <Button onClick={() => onOpenEditor(null)}><Plus className="h-4 w-4 mr-2" /> New Invoice</Button>
      </div>
      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
        <Input placeholder="Search invoices by ID, customer, or VIN..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full md:w-1/2 lg:w-1/3" />
      </div>
      <Card>
        <CardHeader><CardTitle>All Invoices</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : filteredInvoices.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => onOpenEditor(invoice)}>
              <div>
                <h3 className="font-semibold text-foreground">Invoice #{invoice.id?.slice(0, 8)}</h3>
                <p className="text-sm text-muted-foreground">{invoice.jobs?.customer_name || 'N/A'}</p>
                <Badge>{invoice.status}</Badge>
              </div>
              <div className="text-right"><p className="text-xl font-bold text-foreground">${invoice.grand_total?.toLocaleString()}</p></div>
            </div>
          ))}
        </CardContent>
      </Card>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] bg-background/95 backdrop-blur-sm">
          <DialogHeader><DialogTitle>{editingInvoice ? `Edit Invoice #${editingInvoice.id.slice(0,8)}` : 'Create New Invoice'}</DialogTitle></DialogHeader>
          <div className="overflow-y-auto pr-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => upsertInvoiceMutation.mutate(v))} className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="jobId" render={({ field }) => (<FormItem><FormLabel>Job</FormLabel><Select onValueChange={(value) => { field.onChange(value); handleJobSelect(value); }} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a job" /></SelectTrigger></FormControl><SelectContent>{jobs.map(job => <SelectItem key={job.id} value={job.id}>{job.truck_vin?.slice(-6)} - {job.job_type}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="invoiceDate" render={({ field }) => (<FormItem><FormLabel>Invoice Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="sent">Sent</SelectItem><SelectItem value="paid">Paid</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="actualService" render={({ field }) => (<FormItem><FormLabel>Work Performed</FormLabel><FormControl><Textarea placeholder="Describe work performed..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                
                <Card className="bg-card/80"><CardHeader><CardTitle>Labor</CardTitle></CardHeader><CardContent className="space-y-2">
                  {clockedHours > 0 && <p className="text-sm text-muted-foreground">Total clocked hours for this job: {clockedHours.toFixed(2)}h</p>}
                  {laborFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4"><FormField control={form.control} name={`laborEntries.${index}.techId`} render={({ field }) => (<Select onValueChange={(val) => { field.onChange(val); const tech = techs.find(t => t.id === val); if (tech) form.setValue(`laborEntries.${index}.hourlyRate`, tech.hourly_rate || invoiceSettings.default_hourly_rate); }} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Tech" /></SelectTrigger></FormControl><SelectContent>{techs.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>)} /></div>
                      <div className="col-span-3"><FormField control={form.control} name={`laborEntries.${index}.hoursWorked`} render={({ field }) => (<Input type="number" placeholder="Hours" {...field} />)} /></div>
                      <div className="col-span-3"><FormField control={form.control} name={`laborEntries.${index}.hourlyRate`} render={({ field }) => (<Input type="number" placeholder="Rate" {...field} />)} /></div>
                      <div className="col-span-2"><Button type="button" variant="destructive" size="sm" onClick={() => removeLabor(index)}><Trash2 className="h-4 w-4" /></Button></div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => appendLabor({ techId: '', hoursWorked: 1, hourlyRate: invoiceSettings?.default_hourly_rate || 0 })}>Add Labor</Button>
                </CardContent></Card>

                <Card className="bg-card/80"><CardHeader><CardTitle>Parts</CardTitle></CardHeader><CardContent className="space-y-2">
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
                  <Button type="button" variant="outline" size="sm" onClick={() => appendPart({ partId: '', quantity: 1, unitPrice: 0, markupPercentage: invoiceSettings?.default_markup_parts || 0, finalPrice: 0 })}>Add Part</Button>
                </CardContent></Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-card/80"><CardHeader><CardTitle>Fees & Payment</CardTitle></CardHeader><CardContent className="space-y-2">
                    {miscFeeFields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-center">
                        <FormField control={form.control} name={`miscFees.${index}.description`} render={({ field }) => (<Input placeholder="Fee description" {...field} />)} />
                        <FormField control={form.control} name={`miscFees.${index}.amount`} render={({ field }) => (<Input type="number" placeholder="Amount" {...field} />)} />
                        <Button type="button" variant="destructive" size="sm" onClick={() => removeMiscFee(index)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => appendMiscFee({ description: 'Shop Supplies', amount: totals.subtotal * ((invoiceSettings?.shop_supply_fee_percentage || 0) / 100) })}>Add Shop Fee</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => appendMiscFee({ description: 'Disposal Fee', amount: invoiceSettings?.disposal_fee || 0 })}>Add Disposal Fee</Button>
                    </div>
                    <FormField control={form.control} name="paymentMethod" render={({ field }) => (<FormItem className="pt-4"><FormLabel>Payment Method</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger></FormControl><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="check">Check</SelectItem><SelectItem value="cc_physical">Credit Card (Physical)</SelectItem><SelectItem value="stripe">Credit Card (Online)</SelectItem></SelectContent></Select></FormItem>)} />
                  </CardContent></Card>
                  <Card className="bg-card/80"><CardHeader><CardTitle>Summary</CardTitle></CardHeader><CardContent className="space-y-1 text-sm">
                    <div className="flex justify-between"><span>Subtotal:</span><span>${totals.subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Tax ({invoiceSettings?.tax_rate}%):</span><span>${totals.tax.toFixed(2)}</span></div>
                    {watchedValues.miscFees?.map((fee, i) => <div key={i} className="flex justify-between"><span>{fee.description}:</span><span>${fee.amount.toFixed(2)}</span></div>)}
                    {totals.ccFee > 0 && <div className="flex justify-between"><span>CC Fee ({invoiceSettings?.credit_card_fee_percentage}%):</span><span>${totals.ccFee.toFixed(2)}</span></div>}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Grand Total:</span><span>${totals.grandTotal.toFixed(2)}</span></div>
                  </CardContent></Card>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={handlePrint} disabled={!editingInvoice}><Printer className="h-4 w-4 mr-2" /> Print</Button>
                    <Button type="button" variant="outline" onClick={() => sendEmailMutation.mutate()} disabled={!editingInvoice || sendEmailMutation.isPending}>{sendEmailMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />} Email</Button>
                    <Button type="button" variant="outline" onClick={() => form.setValue('status', 'paid')} disabled={!editingInvoice}><CheckCircle className="h-4 w-4 mr-2" /> Mark Paid</Button>
                  </div>
                  <Button type="submit" disabled={upsertInvoiceMutation.isPending}>
                    {upsertInvoiceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Invoice"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
          <div style={{ position: 'fixed', left: '-9999px', top: '-9999px' }}>
            <InvoiceTemplate ref={printRef} invoice={editingInvoice} totals={totals} settings={invoiceSettings} companyInfo={{}} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};