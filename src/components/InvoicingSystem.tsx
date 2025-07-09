
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PricingAI } from "./PricingAI";
import { FileText, Plus, DollarSign, Clock, Send, Printer, Download, Bot, Calculator, Clipboard } from "lucide-react";

export const InvoicingSystem = () => {
  // Mock jobs data for selection
  const availableJobs = [
    { id: "job-001", customer: "ABC Trucking Co.", vehicle: "2019 Peterbilt 579", type: "PM Service", status: "completed" },
    { id: "job-002", customer: "Rodriguez Logistics", vehicle: "2020 Freightliner Cascadia", type: "Brake Repair", status: "completed" },
    { id: "job-003", customer: "Martinez Transport", vehicle: "2018 Kenworth T680", type: "Engine Work", status: "in-progress" },
    { id: "job-004", customer: "Swift Transportation", vehicle: "2021 Volvo VNL", type: "AC Repair", status: "completed" }
  ];

  const [invoices, setInvoices] = useState([
    {
      id: "INV-2024-001",
      customer: "ABC Trucking Co.",
      vehicle: "2019 Peterbilt 579",
      jobType: "PM Service",
      amount: 1250,
      status: "paid",
      date: "2024-01-15",
      dueDate: "2024-02-14"
    },
    {
      id: "INV-2024-002", 
      customer: "Rodriguez Logistics",
      vehicle: "2020 Freightliner Cascadia",
      jobType: "Brake Repair",
      amount: 850,
      status: "pending",
      date: "2024-01-16",
      dueDate: "2024-02-15"
    },
    {
      id: "INV-2024-003",
      customer: "Martinez Transport",
      vehicle: "2018 Kenworth T680",
      jobType: "Engine Work",
      amount: 2100,
      status: "overdue",
      date: "2024-01-10",
      dueDate: "2024-02-09"
    }
  ]);

  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    selectedJob: "",
    customer: "",
    vehicle: "",
    jobType: "",
    description: "",
    laborHours: "",
    laborRate: "85",
    parts: [],
    tax: "8.5"
  });

  const getStatusColor = (status) => {
    switch(status) {
      case "paid": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "overdue": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const calculateInvoiceTotal = () => {
    const labor = parseFloat(newInvoice.laborHours || "0") * parseFloat(newInvoice.laborRate || "0");
    const partsTotal = newInvoice.parts.reduce((sum, part) => sum + (parseFloat(part.price || "0") * parseInt(part.quantity || "0")), 0);
    const subtotal = labor + partsTotal;
    const tax = subtotal * (parseFloat(newInvoice.tax || "0") / 100);
    return subtotal + tax;
  };

  const addPart = () => {
    setNewInvoice(prev => ({
      ...prev,
      parts: [...prev.parts, { name: "", quantity: "", price: "" }]
    }));
  };

  const updatePart = (index, field, value) => {
    setNewInvoice(prev => ({
      ...prev,
      parts: prev.parts.map((part, i) => i === index ? { ...part, [field]: value } : part)
    }));
  };

  const handleJobSelection = (jobId) => {
    const selectedJob = availableJobs.find(job => job.id === jobId);
    if (selectedJob) {
      setNewInvoice(prev => ({
        ...prev,
        selectedJob: jobId,
        customer: selectedJob.customer,
        vehicle: selectedJob.vehicle,
        jobType: selectedJob.type
      }));
    }
  };

  const createInvoiceFromJob = () => {
    if (!newInvoice.selectedJob) return;
    
    const invoiceId = `INV-2024-${String(invoices.length + 1).padStart(3, '0')}`;
    const total = calculateInvoiceTotal();
    
    const invoice = {
      id: invoiceId,
      customer: newInvoice.customer,
      vehicle: newInvoice.vehicle,
      jobType: newInvoice.jobType,
      amount: total,
      status: "pending",
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    
    setInvoices(prev => [...prev, invoice]);
    setShowNewInvoice(false);
    
    // Reset form
    setNewInvoice({
      selectedJob: "",
      customer: "",
      vehicle: "",
      jobType: "",
      description: "",
      laborHours: "",
      laborRate: "85",
      parts: [],
      tax: "8.5"
    });
  };

  const recentActivity = [
    { action: "Invoice INV-2024-003 is overdue", time: "2 hours ago", type: "alert" },
    { action: "Payment received for INV-2024-001", time: "1 day ago", type: "success" },
    { action: "New invoice INV-2024-002 created", time: "2 days ago", type: "info" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Invoicing System
        </h2>
        <Button onClick={() => setShowNewInvoice(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </div>

      {/* Invoice Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Invoiced</p>
                <p className="text-2xl font-bold text-gray-900">$24,580</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">$3,850</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">$2,100</p>
              </div>
              <FileText className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-blue-600">$18,730</p>
              </div>
              <Calculator className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">All Invoices</TabsTrigger>
          <TabsTrigger value="pricing">AI Pricing</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          {/* Invoice List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{invoice.id}</h3>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{invoice.customer} • {invoice.vehicle}</p>
                      <p className="text-xs text-gray-500">{invoice.jobType} • Due: {invoice.dueDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">${invoice.amount.toLocaleString()}</p>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline">
                          <Printer className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Send className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <PricingAI />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'alert' ? 'bg-red-500' :
                      activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Invoice Modal */}
      {showNewInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Invoice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Job Selection */}
              <div>
                <Label htmlFor="jobSelect">Select Completed Job</Label>
                <Select value={newInvoice.selectedJob} onValueChange={handleJobSelection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a completed job to invoice" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableJobs.filter(job => job.status === "completed").map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.customer} - {job.vehicle} ({job.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {newInvoice.selectedJob && (
                <>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clipboard className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900">Job Details</span>
                    </div>
                    <div className="text-sm text-blue-800">
                      <p><strong>Customer:</strong> {newInvoice.customer}</p>
                      <p><strong>Vehicle:</strong> {newInvoice.vehicle}</p>
                      <p><strong>Service:</strong> {newInvoice.jobType}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customer">Customer</Label>
                      <Input 
                        id="customer"
                        value={newInvoice.customer}
                        onChange={(e) => setNewInvoice(prev => ({ ...prev, customer: e.target.value }))}
                        placeholder="Customer name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicle">Vehicle</Label>
                      <Input 
                        id="vehicle"
                        value={newInvoice.vehicle}
                        onChange={(e) => setNewInvoice(prev => ({ ...prev, vehicle: e.target.value }))}
                        placeholder="Vehicle info"
                      />
                    </div>
                  </div>
                </>
              )}
              
              <div>
                <Label htmlFor="description">Job Description</Label>
                <Textarea 
                  id="description"
                  value={newInvoice.description}
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the work performed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="laborHours">Labor Hours</Label>
                  <Input 
                    id="laborHours"
                    type="number"
                    value={newInvoice.laborHours}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, laborHours: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="laborRate">Labor Rate ($/hour)</Label>
                  <Input 
                    id="laborRate"
                    type="number"
                    value={newInvoice.laborRate}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, laborRate: e.target.value }))}
                    placeholder="85"
                  />
                </div>
              </div>

              {/* Parts Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Parts</Label>
                  <Button onClick={addPart} size="sm" variant="outline">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Part
                  </Button>
                </div>
                {newInvoice.parts.map((part, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2 mb-2">
                    <Input 
                      placeholder="Part name"
                      value={part.name}
                      onChange={(e) => updatePart(index, 'name', e.target.value)}
                    />
                    <Input 
                      placeholder="Qty"
                      type="number"
                      value={part.quantity}
                      onChange={(e) => updatePart(index, 'quantity', e.target.value)}
                    />
                    <Input 
                      placeholder="Price"
                      type="number"
                      value={part.price}
                      onChange={(e) => updatePart(index, 'price', e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">${calculateInvoiceTotal().toFixed(2)}</p>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  <Bot className="h-3 w-3 mr-1" />
                  AI Optimized
                </Badge>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => setShowNewInvoice(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={createInvoiceFromJob}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={!newInvoice.selectedJob}
                >
                  Create Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
