import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, DollarSign, Send, Printer, Bot, CreditCard, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
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

export const InvoicingSystem = () => {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [newInvoiceJobId, setNewInvoiceJobId] = useState("");
  const [newInvoiceDescription, setNewInvoiceDescription] = useState("");
  const [newInvoiceAmount, setNewInvoiceAmount] = useState(0);
  const [jobs, setJobs] = useState([]); // To select job for new invoice
  const [customerEmailForSend, setCustomerEmailForSend] = useState("");

  useEffect(() => {
    fetchInvoices();
    fetchJobs();

    const channel = supabase
      .channel('invoices_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, fetchInvoices)
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
        jobs(customer_name, customer_email, customer_phone, job_type, truck_vin, notes)
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
      .select('id, job_type, customer_name, customer_email, customer_phone, truck_vin, notes')
      .not('status', 'eq', 'completed'); // Only show jobs not yet completed/invoiced
    if (error) {
      console.error("Error fetching jobs for invoice creation:", error);
    } else {
      setJobs(data);
    }
  };

  const handleJobSelectForNewInvoice = (jobId: string) => {
    setNewInvoiceJobId(jobId);
    const selectedJob = jobs.find(job => job.id === jobId);
    if (selectedJob) {
      setNewInvoiceDescription(getAISuggestedDescription(selectedJob.job_type));
      // You might want to pre-fill amount based on job estimates here too
    }
  };

  const handleCreateInvoice = async () => {
    if (!newInvoiceJobId || !newInvoiceDescription || newInvoiceAmount <= 0) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please fill all required fields." });
      return;
    }

    const selectedJob = jobs.find(job => job.id === newInvoiceJobId);
    if (!selectedJob) {
      toast({ variant: "destructive", title: "Invalid Job", description: "Selected job not found." });
      return;
    }

    const { error } = await supabase.from('invoices').insert([
      {
        job_id: newInvoiceJobId,
        amount: newInvoiceAmount,
        items: { description: newInvoiceDescription }, // Store description in items JSONB
        paid: false,
        status: 'pending',
        customer_name: selectedJob.customer_name,
        customer_email: selectedJob.customer_email,
      }
    ]);

    if (error) {
      toast({ variant: "destructive", title: "Error creating invoice", description: error.message });
    } else {
      toast({ title: "Invoice Created", description: "New invoice has been added." });
      setIsNewInvoiceModalOpen(false);
      setNewInvoiceJobId("");
      setNewInvoiceDescription("");
      setNewInvoiceAmount(0);
      fetchInvoices();
      fetchJobs(); // Refresh jobs list as one might be invoiced
    }
  };

  const handleProcessPayment = async (invoiceId: string, method: string, amount: number, reference: string) => {
    const { error } = await supabase
      .from('invoices')
      .update({
        paid: true,
        payment_method: method,
        payment_reference: reference,
        status: 'paid'
      })
      .eq('id', invoiceId);

    if (error) {
      toast({ variant: "destructive", title: "Payment Error", description: error.message });
    } else {
      toast({ title: "Payment Recorded", description: `Invoice ${invoiceId} marked as paid.` });
      setIsPaymentModalOpen(false);
      setSelectedInvoice(null);
      fetchInvoices();
    }
  };

  const generateInvoiceHtml = (invoice: any, payNowLink?: string) => {
    const customerName = invoice.jobs?.customer_name || invoice.customer_name || 'Valued Customer';
    const customerEmail = invoice.jobs?.customer_email || invoice.customer_email || 'N/A';
    const customerPhone = invoice.jobs?.customer_phone || 'N/A';
    const jobType = invoice.jobs?.job_type || 'Service';
    const truckVin = invoice.jobs?.truck_vin || 'N/A';
    const notes = invoice.jobs?.notes || invoice.items?.description || 'No specific notes.';

    return `
      <html>
      <head>
        <title>Invoice ${invoice.id}</title>
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
              <p><strong>Invoice #:</strong> ${invoice.id}</p>
              <p><strong>Job ID:</strong> ${invoice.job_id || 'N/A'}</p>
              <p><strong>Date:</strong> ${new Date(invoice.created_at).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${invoice.status.toUpperCase()}</p>
              <p><strong>Truck VIN:</strong> ${truckVin}</p>
            </div>
          </div>

          <div class="section-title">Services & Parts:</div>
          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${notes}</td>
                <td class="amount">$${invoice.amount.toFixed(2)}</td>
              </tr>
              <!-- Add more items here if your invoice structure supports it -->
            </tbody>
          </table>

          <div class="total-section">
            <span class="total-label">Total:</span>
            <span class="total-amount">$${invoice.amount.toFixed(2)}</span>
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
    if (!invoice.paid) {
      try {
        const { data, error } = await supabase.functions.invoke('create-stripe-checkout-session', {
          body: {
            invoiceId: invoice.id,
            amount: invoice.amount,
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

      toast({ title: "Invoice Sent", description: `Invoice ${invoice.id} sent to ${customerEmail}.` });
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
          amount: invoice.amount,
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
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Invoice</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="jobSelect">Select Job</Label>
                <Select value={newInvoiceJobId} onValueChange={handleJobSelectForNewInvoice}>
                  <SelectTrigger id="jobSelect">
                    <SelectValue placeholder="Select a job to invoice" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map(job => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.job_type} ({job.customer_name}) - VIN: {job.truck_vin.slice(-6)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={newInvoiceDescription} onChange={e => setNewInvoiceDescription(e.target.value)} rows={5} />
                <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Bot className="h-3 w-3" /> AI-suggested description
                </div>
              </div>
              <div>
                <Label htmlFor="amount">Amount ($)</Label>
                <Input id="amount" type="number" value={newInvoiceAmount} onChange={e => setNewInvoiceAmount(parseFloat(e.target.value))} />
              </div>
              <Button className="w-full" onClick={handleCreateInvoice}>Create Invoice</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Invoices</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold">{invoice.id} - {invoice.customer_name || 'N/A'}</h3>
                  <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">${invoice.amount.toLocaleString()}</p>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" onClick={() => handleSendInvoice(invoice)}><Send className="h-3 w-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => handlePrintInvoice(invoice)}><Printer className="h-3 w-3" /></Button>
                    {!invoice.paid && (
                      <Button size="sm" onClick={() => { setSelectedInvoice(invoice); setIsPaymentModalOpen(true); }}>Process Payment</Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Process Payment for {selectedInvoice?.id}</DialogTitle></DialogHeader>
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
              <Button className="w-full bg-[#00457C] hover:bg-[#003057]" onClick={() => handleProcessPayment(selectedInvoice.id, 'PayPal', selectedInvoice.amount, 'PAYPAL_TXN_SIMULATED')}>
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
                value={selectedInvoice?.amount} 
                onChange={(e) => setSelectedInvoice(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
              />
              <Input 
                placeholder="Confirmation/Approval Number" 
                value={selectedInvoice?.payment_reference || ''}
                onChange={(e) => setSelectedInvoice(prev => ({ ...prev, payment_reference: e.target.value }))}
              />
              <Button 
                className="w-full" 
                onClick={() => handleProcessPayment(selectedInvoice.id, selectedInvoice.payment_method, selectedInvoice.amount, selectedInvoice.payment_reference)}
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