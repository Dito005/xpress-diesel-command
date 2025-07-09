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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FileText, Plus, DollarSign, Send, Printer, Bot, CreditCard, Check, Trash2, Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// AI-powered suggestions for invoice descriptions
const getAISuggestedDescription = (jobType: string): string => {
  const suggestions: Record<string, string> = {
    "Brake Repair": "Performed complete brake system inspection. Replaced front and rear brake pads and rotors. Bled brake system and road-tested for safety.",
    "PM Service": "Completed scheduled preventive maintenance service. Changed engine oil and filter, replaced fuel filters, checked all fluid levels, and performed multi-point vehicle inspection.",
    "AC Repair": "Diagnosed and repaired air conditioning system. Replaced faulty AC compressor, evacuated and recharged system with refrigerant. Verified proper cooling operation.",
    "Engine Work": "Performed comprehensive engine diagnostics. Repaired cylinder head gasket and replaced spark plugs. Tested engine performance and ensured optimal operation.",
    "Transmission": "Conducted transmission fluid flush and filter replacement. Inspected transmission for leaks and wear. Road-tested vehicle for smooth gear shifts.",
    "Electrical": "Diagnosed and repaired electrical system fault. Replaced faulty wiring harness and tested all electrical components. Ensured proper functioning of lights and accessories.",
    "Road Service": "Provided emergency roadside assistance. Repaired flat tire and performed basic vehicle inspection. Ensured vehicle was safe for continued travel.",
    "Diagnostic": "Performed advanced diagnostic scan to identify vehicle issues. Provided detailed report of findings and recommended repairs.",
    "Other": "Performed general repair and maintenance services as requested by customer."
  };
  return suggestions[jobType] || "";
};

const newInvoiceSchema = z.object({
  jobId: z.string().min(1, "Job is required"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  customerConcern: z.string().optional(),
  recommendedService: z.string().optional(),
  actualService: z.string().min(1, "Actual work performed is required"),
  miscCharges: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().min(0, "Misc charges cannot be negative").optional().default(0)
  ),
  taxAreaId: z.string().optional(),
  paymentMethod: z.string().optional(),
  laborEntries: z.array(z.object({
    techId: z.string().min(1, "Technician is required"),
    hoursWorked: z.preprocess(
      (val) => parseFloat(String(val)),
      z.number().min(0.1, "Hours must be greater than 0")
    ),
    hourlyRate: z.preprocess(
      (val) => parseFloat(String(val)),
      z.number().min(0, "Hourly rate cannot be negative")
    ),
  })).min(1, "At least one labor entry is required"),
  partEntries: z.array(z.object({
    partId: z.string().min(1, "Part is required"),
    quantity: z.preprocess(
      (val) => parseInt(String(val), 10),
      z.number().int().min(1, "Quantity must be at least 1")
    ),
    markup: z.preprocess(
      (val) => parseFloat(String(val)),
      z.number().min(0, "Markup cannot be negative").optional().default(0.3)
    ),
    overriddenPrice: z.preprocess(
      (val) => (val === "" ? undefined : parseFloat(String(val))),
      z.number().min(0, "Price cannot be negative").optional()
    ),
  })).optional(),
});

export const InvoicingSystem = () => {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [parts, setParts] = useState([]);
  const [techs, setTechs] = useState([]);
  const [taxSettings, setTaxSettings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm<z.infer<typeof newInvoiceSchema>>({
    resolver: zodResolver(newInvoiceSchema),
    defaultValues: {
      invoiceDate: new Date().toISOString().substring(0, 10),
      miscCharges: 0,
      laborEntries: [],
      partEntries: [],
    },
  });

  const { fields: laborFields, append: appendLabor, remove: removeLabor } = useFieldArray({
    control: form.control,
    name: "laborEntries",
  });

  const { fields: partFields, append: appendPart, remove: removePart } = useFieldArray({
    control: form.control,
    name: "partEntries",
  });

  useEffect(() => {
    fetchInvoices();
    fetchJobs();
    fetchParts();
    fetchTechs();
    fetchTaxSettings();

    const channel = supabase
      .channel('invoicing_system_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, fetchInvoices)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoice_parts' }, fetchInvoices)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoice_labor' }, fetchInvoices)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, fetchInvoices)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, fetchJobs)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parts' }, fetchParts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'techs' }, fetchTechs) 
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tax_settings' }, fetchTaxSettings)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchInvoices = async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        jobs(customer_name, customer_email, customer_phone, job_type, truck_vin, notes, customer_concern, recommended_service, actual_service),
        invoice_parts(*, parts(name, cost, part_number)),
        invoice_labor(*, techs(name, hourly_rate)),
        payments(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching invoices:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load invoices." });
    } else {
      setInvoices(data);
    }
  };

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('id, job_type, customer_name, customer_email, customer_phone, truck_vin, notes, customer_concern, recommended_service, actual_service')
      .not('status', 'eq', 'completed'); // Only show jobs not yet completed/invoiced
    if (error) {
      console.error("Error fetching jobs for invoice creation:", error);
    } else {
      setJobs(data);
    }
  };

  const fetchParts = async () => {
    const { data, error } = await supabase
      .from('parts')
      .select('id, name, cost, part_number');
    if (error) {
      console.error("Error fetching parts:", error);
    } else {
      setParts(data);
    }
  };

  const fetchTechs = async () => {
    const { data, error } = await supabase
      .from('techs') 
      .select('id, name, hourly_rate');
    if (error) {
      console.error("Error fetching technicians:", error);
    } else {
      setTechs(data);
    }
  };

  const fetchTaxSettings = async () => {
    const { data, error } = await supabase
      .from('tax_settings')
      .select('*');
    if (error) {
      console.error("Error fetching tax settings:", error);
    } else {
      setTaxSettings(data);
    }
  };

  const handleJobSelectForNewInvoice = (jobId: string) => {
    const selectedJob = jobs.find(job => job.id === jobId);
    if (selectedJob) {
      form.setValue("jobId", jobId);
      form.setValue("customerConcern", selectedJob.customer_concern || selectedJob.notes || "");
      form.setValue("recommendedService", selectedJob.recommended_service || "");
      form.setValue("actualService", selectedJob.actual_service || getAISuggestedDescription(selectedJob.job_type));
      // You might want to pre-fill labor/parts based on job estimates here too
    }
  };

  const calculatePartPrice = (cost: number, markup: number, quantity: number, overriddenPrice?: number) => {
    if (overriddenPrice !== undefined && overriddenPrice !== null) {
      return overriddenPrice * quantity;
    }
    return cost * (1 + markup) * quantity;
  };

  const calculateInvoiceTotals = (invoiceData: z.infer<typeof newInvoiceSchema>) => {
    const laborTotal = invoiceData.laborEntries.reduce((sum, entry) => sum + (entry.hoursWorked * entry.hourlyRate), 0);
    const partsTotal = invoiceData.partEntries?.reduce((sum, entry) => {
      const part = parts.find(p => p.id === entry.partId);
      if (!part) return sum;
      return sum + calculatePartPrice(part.cost, entry.markup, entry.quantity, entry.overriddenPrice);
    }, 0) || 0;
    const subtotal = laborTotal + partsTotal + (invoiceData.miscCharges || 0);

    const selectedTaxSetting = taxSettings.find(ts => ts.id === invoiceData.taxAreaId);
    const taxRate = selectedTaxSetting?.tax_percent || 0;
    const cardFeeRate = selectedTaxSetting?.card_fee_percent || 0;

    const taxAmount = subtotal * (taxRate / 100);
    const cardFeeAmount = invoiceData.paymentMethod === 'stripe' || invoiceData.paymentMethod === 'cc_physical' ? subtotal * (cardFeeRate / 100) : 0;

    const total = subtotal + taxAmount + cardFeeAmount;

    return { laborTotal, partsTotal, subtotal, taxAmount, cardFeeAmount, total };
  };

  const handleCreateInvoice = async (values: z.infer<typeof newInvoiceSchema>) => {
    const selectedJob = jobs.find(job => job.id === values.jobId);
    if (!selectedJob) {
      toast({ variant: "destructive", title: "Invalid Job", description: "Selected job not found." });
      return;
    }

    const { total } = calculateInvoiceTotals(values);

    const { data: invoiceData, error: invoiceError } = await supabase.from('invoices').insert([
      {
        job_id: values.jobId,
        customer_name: selectedJob.customer_name,
        customer_email: selectedJob.customer_email,
        total: total,
        status: 'pending',
        created_at: values.invoiceDate,
        payment_method: values.paymentMethod,
        customer_info: {
          phone: selectedJob.customer_phone,
          truck_vin: selectedJob.truck_vin,
          job_type: selectedJob.job_type,
        },
        customer_concern: values.customerConcern,
        recommended_service: values.recommendedService,
        actual_service: values.actualService,
      }
    ]).select().single();

    if (invoiceError) {
      toast({ variant: "destructive", title: "Error creating invoice", description: invoiceError.message });
      return;
    }

    const invoiceId = invoiceData.id;

    // Insert labor entries
    const laborInserts = values.laborEntries.map(entry => ({
      invoice_id: invoiceId,
      tech_id: entry.techId,
      hours_worked: entry.hoursWorked,
      hourly_rate: entry.hourlyRate,
    }));
    const { error: laborError } = await supabase.from('invoice_labor').insert(laborInserts);
    if (laborError) {
      toast({ variant: "destructive", title: "Error adding labor", description: laborError.message });
      // Consider rolling back invoice or marking as incomplete
      return;
    }

    // Insert part entries
    const partInserts = values.partEntries?.map(entry => ({
      invoice_id: invoiceId,
      part_id: entry.partId,
      quantity: entry.quantity,
      markup: entry.markup,
      overridden_price: entry.overriddenPrice,
    })) || [];
    if (partInserts.length > 0) {
      const { error: partsError } = await supabase.from('invoice_parts').insert(partInserts);
      if (partsError) {
        toast({ variant: "destructive", title: "Error adding parts", description: partsError.message });
        // Consider rolling back invoice or marking as incomplete
        return;
      }
    }

    // Update job status to completed
    const { error: jobUpdateError } = await supabase
      .from('jobs')
      .update({ status: 'completed' })
      .eq('id', values.jobId);
    if (jobUpdateError) {
      console.error("Error updating job status:", jobUpdateError);
      toast({ variant: "destructive", title: "Job Status Update Failed", description: "Invoice created, but failed to update job status." });
    }

    toast({ title: "Invoice Created", description: `New invoice #${invoiceId.slice(0, 8)} has been added.` });
    form.reset();
    setIsNewInvoiceModalOpen(false);
    fetchInvoices();
    fetchJobs(); // Refresh jobs list as one might be invoiced
  };

  const handleProcessPayment = async (invoiceId: string, method: string, amount: number, reference: string) => {
    const { error } = await supabase
      .from('payments')
      .insert({
        invoice_id: invoiceId,
        method: method,
        amount: amount,
        transaction_id: reference,
        paid_at: new Date().toISOString(),
      });

    if (error) {
      toast({ variant: "destructive", title: "Payment Error", description: error.message });
    } else {
      const { error: invoiceUpdateError } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoiceId);

      if (invoiceUpdateError) {
        toast({ variant: "destructive", title: "Invoice Status Update Error", description: invoiceUpdateError.message });
      } else {
        toast({ title: "Payment Recorded", description: `Invoice ${invoiceId.slice(0, 8)} marked as paid.` });
        setIsPaymentModalOpen(false);
        setSelectedInvoice(null);
        fetchInvoices();
      }
    }
  };

  const generateInvoiceHtml = (invoice: any, payNowLink?: string) => {
    const customerName = invoice.jobs?.customer_name || invoice.customer_name || 'Valued Customer';
    const customerEmail = invoice.jobs?.customer_email || invoice.customer_email || 'N/A';
    const customerPhone = invoice.jobs?.customer_phone || invoice.customer_info?.phone || 'N/A';
    const truckVin = invoice.jobs?.truck_vin || invoice.customer_info?.truck_vin || 'N/A';
    const jobType = invoice.jobs?.job_type || invoice.customer_info?.job_type || 'Service';
    const customerConcern = invoice.jobs?.customer_concern || invoice.customer_concern || 'N/A';
    const recommendedService = invoice.jobs?.recommended_service || invoice.recommended_service || 'N/A';
    const actualService = invoice.jobs?.actual_service || invoice.actual_service || 'No specific notes.';

    const laborItems = invoice.invoice_labor?.map(item => {
      const techName = item.techs?.name || 'Unknown Tech';
      const totalLaborCost = item.hours_worked * item.hourly_rate;
      return `
        <tr>
          <td>Labor: ${techName} (${item.hours_worked} hrs @ $${item.hourly_rate.toFixed(2)}/hr)</td>
          <td class="amount">$${totalLaborCost.toFixed(2)}</td>
        </tr>
      `;
    }).join('') || '';

    const partItems = invoice.invoice_parts?.map(item => {
      const partName = item.parts?.name || 'Unknown Part';
      const partCost = item.parts?.cost || 0;
      const calculatedPrice = calculatePartPrice(partCost, item.markup, item.quantity, item.overridden_price);
      return `
        <tr>
          <td>Part: ${partName} (Qty: ${item.quantity})</td>
          <td class="amount">$${calculatedPrice.toFixed(2)}</td>
        </tr>
      `;
    }).join('') || '';

    const miscCharges = invoice.misc_charges || 0;
    // Ensure total is a number before calculations
    const invoiceTotal = typeof invoice.total === 'number' ? invoice.total : 0; 
    const taxAmount = typeof invoice.tax_amount === 'number' ? invoice.tax_amount : 0;
    const cardFeeAmount = typeof invoice.card_fee_amount === 'number' ? invoice.card_fee_amount : 0;

    // Recalculate subtotal from total if needed, or use a stored subtotal if available
    const subtotal = invoiceTotal - taxAmount - cardFeeAmount; 

    return `
      <html>
      <head>
        <title>Invoice ${invoice.id.slice(0, 8)}</title>
        <style>
          body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; color: #333; background-color: #f8f8f8; }
          .container { width: 100%; max-width: 800px; margin: 20px auto; background-color: #fff; border: 1px solid #eee; box-shadow: 0 0 15px rgba(0,0,0,0.05); padding: 30px; box-sizing: border-box; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #003366; padding-bottom: 20px; }
          .header img { height: 60px; margin-bottom: 10px; }
          .header h1 { color: #003366; margin: 0; font-size: 32px; letter-spacing: 1px; }
          .header p { font-size: 15px; color: #555; line-height: 1.6; }
          .section-title { color: #003366; font-size: 20px; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 20px; }
          .details-grid { display: flex; justify-content: space-between; margin-bottom: 30px; flex-wrap: wrap; }
          .details-grid > div { width: 48%; min-width: 280px; margin-bottom: 20px; }
          .details-grid p { margin: 5px 0; font-size: 15px; }
          .details-grid strong { color: #003366; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items-table th, .items-table td { border: 1px solid #eee; padding: 12px; text-align: left; font-size: 15px; }
          .items-table th { background-color: #f0f4f8; color: #003366; font-weight: bold; }
          .items-table td.amount { text-align: right; font-weight: bold; color: #cc0000; }
          .total-section { text-align: right; margin-top: 30px; }
          .total-section .total-label { font-size: 22px; font-weight: bold; color: #003366; }
          .total-section .total-amount { font-size: 28px; font-weight: bold; color: #cc0000; margin-left: 20px; }
          .pay-now-button { display: inline-block; background-color: #003366; color: #fff; padding: 12px 25px; border-radius: 5px; text-decoration: none; font-weight: bold; margin-top: 25px; transition: background-color 0.3s ease; }
          .pay-now-button:hover { background-color: #cc0000; }
          .footer { text-align: center; margin-top: 50px; font-size: 13px; color: #777; border-top: 1px solid #eee; padding-top: 20px; }
          .footer .slogan { font-style: italic; margin-top: 10px; color: #cc0000; font-weight: bold; }
          @media (max-width: 600px) {
            .container { padding: 15px; margin: 10px auto; }
            .details-grid { flex-direction: column; }
            .details-grid > div { width: 100%; }
            .header h1 { font-size: 26px; }
            .total-section .total-label, .total-section .total-amount { font-size: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://yrixrsthjntarzcyiryg.supabase.co/storage/v1/object/public/assets/xpress-diesel-logo.png" alt="Xpress Diesel Repair Logo" />
            <h1>Xpress Diesel Repair</h1>
            <p>123 Truck Way, Industrial District, Anytown, USA</p>
            <p>Phone: (555) 123-4567 | Email: service@xpressdiesel.com</p>
          </div>
          
          <div class="details-grid">
            <div>
              <div class="section-title">Invoice To:</div>
              <p><strong>${customerName}</strong></p>
              <p>${customerEmail}</p>
              <p>${customerPhone}</p>
            </div>
            <div>
              <div class="section-title">Invoice Details:</div>
              <p><strong>Invoice #:</strong> ${invoice.id.slice(0, 8)}</p>
              <p><strong>Job ID:</strong> ${invoice.job_id || 'N/A'}</p>
              <p><strong>Date:</strong> ${new Date(invoice.created_at).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${invoice.status.toUpperCase()}</p>
              <p><strong>Truck VIN:</strong> ${truckVin}</p>
            </div>
          </div>

          <div class="section-title">Customer Concern:</div>
          <p style="margin-bottom: 20px; font-size: 15px;">${customerConcern}</p>

          <div class="section-title">Recommended Services:</div>
          <p style="margin-bottom: 20px; font-size: 15px;">${recommendedService}</p>

          <div class="section-title">Actual Work Performed:</div>
          <p style="margin-bottom: 20px; font-size: 15px;">${actualService}</p>

          <div class="section-title">Services & Parts Breakdown:</div>
          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${laborItems}
              ${partItems}
              ${miscCharges > 0 ? `<tr><td>Miscellaneous Charges</td><td class="amount">$${miscCharges.toFixed(2)}</td></tr>` : ''}
              <tr>
                <td style="text-align: right; font-weight: bold;">Subtotal:</td>
                <td class="amount">$${subtotal.toFixed(2)}</td>
              </tr>
              ${taxAmount > 0 ? `<tr><td style="text-align: right; font-weight: bold;">Tax:</td><td class="amount">$${taxAmount.toFixed(2)}</td></tr>` : ''}
              ${cardFeeAmount > 0 ? `<tr><td style="text-align: right; font-weight: bold;">Card Processing Fee:</td><td class="amount">$${cardFeeAmount.toFixed(2)}</td></tr>` : ''}
            </tbody>
          </table>

          <div class="total-section">
            <span class="total-label">Total:</span>
            <span class="total-amount">$${invoiceTotal.toFixed(2)}</span>
          </div>

          ${!invoice.paid && payNowLink ? `<div style="text-align: center;"><a href="${payNowLink}" class="pay-now-button">Pay Now</a></div>` : ''}

          <div class="footer">
            <p>Thank you for your business!</p>
            <p class="slogan">Quality. Timeliness. Value.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleSendInvoice = async (invoice: any) => {
    toast({ title: "Sending Invoice", description: "Preparing to send invoice...", duration: 3000 });
    
    const customerEmail = invoice.jobs?.customer_email || invoice.customer_email;
    if (!customerEmail) {
      toast({ variant: "destructive", title: "Missing Email", description: "Customer email is required to send invoice." });
      return;
    }

    // Generate Stripe Checkout Session URL
    let payNowLink = null;
    if (invoice.status !== 'paid') {
      try {
        const { data, error } = await supabase.functions.invoke('create-stripe-checkout-session', {
          body: {
            invoiceId: invoice.id,
            amount: invoice.total,
            customerEmail: customerEmail,
            customerName: invoice.jobs?.customer_name || invoice.customer_name,
          },
        });

        if (error) throw error;
        payNowLink = data.url;
      } catch (error: any) {
        console.error("Error creating Stripe session:", error);
        toast({ variant: "destructive", title: "Payment Link Error", description: `Failed to create payment link: ${error.message}` });
        // Continue sending email without pay link if it fails
      }
    }

    const invoiceHtml = generateInvoiceHtml(invoice, payNowLink);

    try {
      const { error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          toEmail: customerEmail,
          customerName: invoice.jobs?.customer_name || invoice.customer_name,
          invoiceHtml: invoiceHtml,
          payNowLink: payNowLink,
          invoiceId: invoice.id,
        },
      });

      if (error) throw error;

      toast({ title: "Invoice Sent", description: `Invoice ${invoice.id.slice(0, 8)} sent to ${customerEmail}.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Email Send Failed", description: error.message });
    }
  };

  const handlePrintInvoice = (invoice: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ variant: "destructive", title: "Print Error", description: "Please allow pop-ups to print." });
      return;
    }

    const invoiceHtml = generateInvoiceHtml(invoice); // Generate HTML without pay link for printing

    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
    printWindow.print();
  };

  const handleStripePayment = async (invoice: any) => {
    if (!invoice.jobs?.customer_email && !invoice.customer_email) {
      toast({ variant: "destructive", title: "Missing Email", description: "Customer email is required for Stripe payment." });
      return;
    }
    
    toast({ title: "Redirecting to Stripe", description: "Please wait while we prepare your payment...", duration: 5000 });
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout-session', {
        body: {
          invoiceId: invoice.id,
          amount: invoice.total,
          customerEmail: invoice.jobs?.customer_email || invoice.customer_email,
          customerName: invoice.jobs?.customer_name || invoice.customer_name,
        },
      });

      if (error) throw error;

      window.location.href = data.url; // Redirect to Stripe Checkout
    } catch (error: any) {
      toast({ variant: "destructive", title: "Stripe Error", description: error.message });
    }
  };

  const getStatusColor = (status: string) => ({
    paid: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    overdue: "bg-red-100 text-red-800",
  }[status] || "bg-gray-100 text-gray-800");

  const filteredInvoices = invoices.filter(invoice =>
    (invoice.id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (invoice.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (invoice.jobs?.truck_vin?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const currentFormValues = form.watch();
  const { total: currentTotal } = calculateInvoiceTotals(currentFormValues);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="h-6 w-6" /> Invoicing System
        </h2>
        <Dialog open={isNewInvoiceModalOpen} onOpenChange={setIsNewInvoiceModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4 mr-2" /> New Invoice</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create New Invoice</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateInvoice)} className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="jobId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Job</FormLabel>
                        <Select onValueChange={(value) => { field.onChange(value); handleJobSelectForNewInvoice(value); }} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a job to invoice" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {jobs.map(job => (
                              <SelectItem key={job.id} value={job.id}>
                                {job.job_type} ({job.customer_name}) - VIN: {job.truck_vin?.slice(-6)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="invoiceDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="customerConcern"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Concern</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Customer's reported issue..." rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="recommendedService"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recommended Services</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Additional services recommended..." rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="actualService"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Actual Work Performed</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Detailed description of work performed..." rows={5} {...field} />
                      </FormControl>
                      <FormMessage />
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Bot className="h-3 w-3" /> AI-suggested description based on job type
                      </div>
                    </FormItem>
                  )}
                />

                {/* Labor Breakdown */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg">Labor Breakdown</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendLabor({ techId: '', hoursWorked: 0, hourlyRate: 0 })}>
                      <Plus className="h-4 w-4 mr-2" /> Add Labor
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {laborFields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-4 gap-4 items-end p-3 border rounded-md">
                        <FormField
                          control={form.control}
                          name={`laborEntries.${index}.techId`}
                          render={({ field: techField }) => (
                            <FormItem>
                              <FormLabel>Technician</FormLabel>
                              <Select onValueChange={(value) => {
                                techField.onChange(value);
                                const selectedTech = techs.find(t => t.id === value);
                                if (selectedTech) {
                                  form.setValue(`laborEntries.${index}.hourlyRate`, selectedTech.hourly_rate);
                                }
                              }} defaultValue={techField.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Tech" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {techs.map(tech => (
                                    <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`laborEntries.${index}.hoursWorked`}
                          render={({ field: hoursField }) => (
                            <FormItem>
                              <FormLabel>Hours</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.1" placeholder="0.0" {...hoursField} onChange={e => hoursField.onChange(parseFloat(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`laborEntries.${index}.hourlyRate`}
                          render={({ field: rateField }) => (
                            <FormItem>
                              <FormLabel>Rate ($/hr)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="0.00" {...rateField} onChange={e => rateField.onChange(parseFloat(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">
                            ${(form.getValues(`laborEntries.${index}.hoursWorked`) * form.getValues(`laborEntries.${index}.hourlyRate`) || 0).toFixed(2)}
                          </span>
                          <Button type="button" variant="destructive" size="sm" onClick={() => removeLabor(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Parts Breakdown */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg">Parts</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendPart({ partId: '', quantity: 1, markup: 0.3, overriddenPrice: undefined })}>
                      <Plus className="h-4 w-4 mr-2" /> Add Part
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {partFields.map((field, index) => {
                      const selectedPart = parts.find(p => p.id === form.getValues(`partEntries.${index}.partId`));
                      const partCost = selectedPart?.cost || 0;
                      const partMarkup = form.getValues(`partEntries.${index}.markup`) || 0;
                      const partQuantity = form.getValues(`partEntries.${index}.quantity`) || 0;
                      const overriddenPrice = form.getValues(`partEntries.${index}.overriddenPrice`);
                      const calculatedPrice = calculatePartPrice(partCost, partMarkup, partQuantity, overriddenPrice);

                      return (
                        <div key={field.id} className="grid grid-cols-5 gap-4 items-end p-3 border rounded-md">
                          <FormField
                            control={form.control}
                            name={`partEntries.${index}.partId`}
                            render={({ field: partIdField }) => (
                              <FormItem className="col-span-2">
                                <FormLabel>Part</FormLabel>
                                <Select onValueChange={partIdField.onChange} defaultValue={partIdField.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select Part" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {parts.map(part => (
                                      <SelectItem key={part.id} value={part.id}>{part.name} ({part.part_number})</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`partEntries.${index}.quantity`}
                            render={({ field: quantityField }) => (
                              <FormItem>
                                <FormLabel>Qty</FormLabel>
                                <FormControl>
                                  <Input type="number" step="1" placeholder="1" {...quantityField} onChange={e => quantityField.onChange(parseInt(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`partEntries.${index}.overriddenPrice`}
                            render={({ field: priceField }) => (
                              <FormItem>
                                <FormLabel>Override Price ($)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" placeholder="Optional" {...priceField} onChange={e => priceField.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">
                              ${calculatedPrice.toFixed(2)}
                            </span>
                            <Button type="button" variant="destructive" size="sm" onClick={() => removePart(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Miscellaneous Charges */}
                <FormField
                  control={form.control}
                  name="miscCharges"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Miscellaneous Charges ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tax and Payment Method */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="taxAreaId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Area</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Tax Area" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {taxSettings.map(tax => (
                              <SelectItem key={tax.id} value={tax.id}>{tax.tax_area} ({tax.tax_percent}%)</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Payment Method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="stripe">Stripe (Online)</SelectItem>
                            <SelectItem value="cc_physical">Credit Card (Physical)</SelectItem>
                            <SelectItem value="efs_check">EFS Check</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="paypal">PayPal</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Invoice Summary */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between font-medium">
                      <span>Subtotal:</span>
                      <span>${(currentTotal - (calculateInvoiceTotals(currentFormValues).taxAmount || 0) - (calculateInvoiceTotals(currentFormValues).cardFeeAmount || 0)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Tax ({taxSettings.find(ts => ts.id === currentFormValues.taxAreaId)?.tax_percent || 0}%):</span>
                      <span>${(calculateInvoiceTotals(currentFormValues).taxAmount || 0).toFixed(2)}</span>
                    </div>
                    {currentFormValues.paymentMethod && (currentFormValues.paymentMethod === 'stripe' || currentFormValues.paymentMethod === 'cc_physical') && (
                      <div className="flex justify-between font-medium">
                        <span>Card Fee ({taxSettings.find(ts => ts.id === currentFormValues.taxAreaId)?.card_fee_percent || 0}%):</span>
                        <span>${(calculateInvoiceTotals(currentFormValues).cardFeeAmount || 0).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-bold text-blue-700 border-t pt-2 mt-2">
                      <span>Total:</span>
                      <span>${currentTotal.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsNewInvoiceModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Invoice"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
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
            {filteredInvoices.length === 0 ? (
              <p className="text-center text-gray-500">No invoices found.</p>
            ) : (
              filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold">Invoice #{invoice.id?.slice(0, 8) || 'N/A'}</h3>
                    <p className="text-sm text-gray-600">{invoice.customer_name || invoice.jobs?.customer_name || 'N/A'}</p>
                    <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">${(typeof invoice.total === 'number' ? invoice.total : 0).toLocaleString()}</p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" onClick={() => handleSendInvoice(invoice)}><Send className="h-3 w-3" /></Button>
                      <Button size="sm" variant="outline" onClick={() => handlePrintInvoice(invoice)}><Printer className="h-3 w-3" /></Button>
                      {invoice.status !== 'paid' && (
                        <Button size="sm" onClick={() => { setSelectedInvoice(invoice); setIsPaymentModalOpen(true); }}>Process Payment</Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Process Payment for {selectedInvoice?.id?.slice(0, 8)}</DialogTitle></DialogHeader>
          <Tabs defaultValue="manual" className="py-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="stripe">Stripe</TabsTrigger>
              <TabsTrigger value="paypal">PayPal</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
            </TabsList>
            <TabsContent value="stripe" className="text-center pt-6">
              <Button className="w-full" onClick={() => handleStripePayment(selectedInvoice)}>
                <CreditCard className="h-4 w-4 mr-2" /> Pay with Stripe
              </Button>
              <p className="text-xs text-gray-500 mt-2">Secure payment processing via Stripe.</p>
            </TabsContent>
            <TabsContent value="paypal" className="text-center pt-6">
              <Button className="w-full bg-[#00457C] hover:bg-[#003057]" onClick={() => handleProcessPayment(selectedInvoice.id, 'PayPal', selectedInvoice.total, 'PAYPAL_TXN_SIMULATED')}>
                Pay with PayPal (Simulated)
              </Button>
            </TabsContent>
            <TabsContent value="manual" className="pt-6 space-y-4">
              <Select onValueChange={(value) => setSelectedInvoice(prev => ({ ...prev, payment_method: value }))}>
                <SelectTrigger><SelectValue placeholder="Select Payment Method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cc_physical">Credit Card (Physical)</SelectItem>
                  <SelectItem value="efs_check">EFS Check</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
              <Input 
                placeholder="Amount" 
                type="number" 
                value={selectedInvoice?.total} 
                onChange={(e) => setSelectedInvoice(prev => ({ ...prev, total: parseFloat(e.target.value) }))}
              />
              <Input 
                placeholder="Confirmation/Approval Number" 
                value={selectedInvoice?.payment_reference || ''}
                onChange={(e) => setSelectedInvoice(prev => ({ ...prev, payment_reference: e.target.value }))}
              />
              <Button 
                className="w-full" 
                onClick={() => handleProcessPayment(selectedInvoice.id, selectedInvoice.payment_method, selectedInvoice.total, selectedInvoice.payment_reference)}
              >
                <Check className="h-4 w-4 mr-2" /> Mark as Paid
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};