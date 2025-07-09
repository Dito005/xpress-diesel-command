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
        jobs(customer_info, description)
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
      .select('id, description, customer_info')
      .not('status', 'eq', 'completed'); // Only show jobs not yet completed/invoiced
    if (error) {
      console.error("Error fetching jobs for invoice creation:", error);
    } else {
      setJobs(data);
    }
  };

  const handleJobTypeChange = (jobType: string) => {
    setNewInvoiceDescription(getAISuggestedDescription(jobType));
  };

  const handleCreateInvoice = async () => {
    if (!newInvoiceJobId || !newInvoiceDescription || newInvoiceAmount <= 0) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please fill all required fields." });
      return;
    }

    const { error } = await supabase.from('invoices').insert([
      {
        job_id: newInvoiceJobId,
        amount: newInvoiceAmount,
        items: { description: newInvoiceDescription }, // Store description in items JSONB
        paid: false,
        status: 'pending' // Assuming a status column in DB
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

  const handleSendInvoice = async (invoice: any) => {
    toast({ title: "Sending Invoice", description: "Preparing to send invoice..." });
    const customerEmail = invoice.jobs?.customer_info?.email || "customer@example.com"; // Fallback email
    const customerName = invoice.jobs?.customer_info?.name || "Valued Customer";

    // In a real app, this would call a Supabase Edge Function to send email
    // Example: await supabase.functions.invoke('send-invoice-email', { body: { invoiceId: invoice.id, customerEmail, customerName } });
    
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate sending

    toast({ title: "Invoice Sent", description: `Invoice ${invoice.id} sent to ${customerEmail}.` });
  };

  const handlePrintInvoice = (invoice: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ variant: "destructive", title: "Print Error", description: "Please allow pop-ups to print." });
      return;
    }

    const invoiceHtml = `
      <html>
      <head>
        <title>Invoice ${invoice.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .container { width: 80%; margin: 0 auto; border: 1px solid #eee; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #003366; margin: 0; font-size: 28px; }
          .header p { font-size: 14px; color: #555; }
          .logo { height: 50px; margin-bottom: 10px; }
          .details { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .details div { width: 48%; }
          .details h3 { margin-top: 0; color: #003366; }
          .items table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items th, .items td { border: 1px solid #eee; padding: 8px; text-align: left; }
          .items th { background-color: #f9f9f9; }
          .total { text-align: right; font-size: 18px; font-weight: bold; color: #003366; }
          .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #777; }
          .slogan { font-style: italic; margin-top: 5px; color: #cc0000; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="/android-chrome-192x192.png" alt="Xpress Diesel Repair Logo" class="logo" />
            <h1>Xpress Diesel Repair</h1>
            <p>123 Truck Way, Industrial District, Anytown, USA</p>
            <p>Phone: (555) 123-4567 | Email: service@xpressdiesel.com</p>
          </div>
          
          <div class="details">
            <div>
              <h3>Invoice To:</h3>
              <p><strong>${invoice.jobs?.customer_info?.name || 'N/A'}</strong></p>
              <p>${invoice.jobs?.customer_info?.email || 'N/A'}</p>
              <p>${invoice.jobs?.customer_info?.phone || 'N/A'}</p>
            </div>
            <div>
              <h3>Invoice Details:</h3>
              <p><strong>Invoice #:</strong> ${invoice.id}</p>
              <p><strong>Job ID:</strong> ${invoice.job_id || 'N/A'}</p>
              <p><strong>Date:</strong> ${new Date(invoice.created_at).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${invoice.paid ? 'PAID' : 'UNPAID'}</p>
            </div>
          </div>

          <div class="items">
            <h3>Services & Parts:</h3>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${invoice.items?.description || 'N/A'}</td>
                  <td>$${invoice.amount.toFixed(2)}</td>
                </tr>
                <!-- Add more items here if your invoice structure supports it -->
              </tbody>
            </table>
          </div>

          <div class="total">
            Total: $${invoice.amount.toFixed(2)}
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p class="slogan">Quality. Timeliness. Value.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
    printWindow.print();
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
                <Select value={newInvoiceJobId} onValueChange={setNewInvoiceJobId}>
                  <SelectTrigger id="jobSelect">
                    <SelectValue placeholder="Select a job to invoice" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map(job => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.description} ({job.customer_info?.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Select onValueChange={handleJobTypeChange}>
                <SelectTrigger><SelectValue placeholder="Select Job Type for Description..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Brake Repair">Brake Repair</SelectItem>
                  <SelectItem value="PM Service">PM Service</SelectItem>
                  <SelectItem value="AC Repair">AC Repair</SelectItem>
                </SelectContent>
              </Select>
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
                  <h3 className="font-semibold">{invoice.id} - {invoice.jobs?.customer_info?.name || 'N/A'}</h3>
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
              <Button className="w-full" onClick={() => handleProcessPayment(selectedInvoice.id, 'Stripe', selectedInvoice.amount, 'STRIPE_TXN_SIMULATED')}>
                <CreditCard className="h-4 w-4 mr-2" /> Pay with Stripe (Simulated)
              </Button>
              <p className="text-xs text-gray-500 mt-2">Secure payment processing (simulated).</p>
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