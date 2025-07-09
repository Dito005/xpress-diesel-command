import { useState } from "react";
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
  const [invoices, setInvoices] = useState([
    { id: "INV-2024-001", customer: "ABC Trucking Co.", amount: 1250, status: "paid" },
    { id: "INV-2024-002", customer: "Rodriguez Logistics", amount: 850, status: "pending" },
    { id: "INV-2024-003", customer: "Martinez Transport", amount: 2100, status: "overdue" },
  ]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [newInvoiceDescription, setNewInvoiceDescription] = useState("");

  const handleJobTypeChange = (jobType: string) => {
    setNewInvoiceDescription(getAISuggestedDescription(jobType));
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
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4 mr-2" /> New Invoice</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Invoice</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <Select onValueChange={handleJobTypeChange}>
                <SelectTrigger><SelectValue placeholder="Select Job Type..." /></SelectTrigger>
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
              <Button className="w-full">Create Invoice</Button>
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
                  <h3 className="font-semibold">{invoice.id} - {invoice.customer}</h3>
                  <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">${invoice.amount.toLocaleString()}</p>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline"><Send className="h-3 w-3" /></Button>
                    <Button size="sm" variant="outline"><Printer className="h-3 w-3" /></Button>
                    <Button size="sm" onClick={() => { setSelectedInvoice(invoice); setIsPaymentModalOpen(true); }}>Process Payment</Button>
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
          <Tabs defaultValue="stripe" className="py-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="stripe">Stripe</TabsTrigger>
              <TabsTrigger value="paypal">PayPal</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
            </TabsList>
            <TabsContent value="stripe" className="text-center pt-6">
              <Button className="w-full"><CreditCard className="h-4 w-4 mr-2" /> Pay with Stripe</Button>
              <p className="text-xs text-gray-500 mt-2">Secure payment processing.</p>
            </TabsContent>
            <TabsContent value="paypal" className="text-center pt-6">
              <Button className="w-full bg-[#00457C] hover:bg-[#003057]">Pay with PayPal</Button>
            </TabsContent>
            <TabsContent value="manual" className="pt-6 space-y-4">
              <Select>
                <SelectTrigger><SelectValue placeholder="Select Payment Method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cc_physical">Credit Card (Physical)</SelectItem>
                  <SelectItem value="efs_check">EFS Check</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Amount" type="number" />
              <Input placeholder="Confirmation/Approval Number" />
              <Button className="w-full"><Check className="h-4 w-4 mr-2" /> Mark as Paid</Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};