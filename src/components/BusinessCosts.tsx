import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Database, Plus, Edit, DollarSign, Clock, Wrench, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client"; // Changed import path

interface JobTemplate {
  id: string;
  category: string;
  jobType: string;
  description: string;
  laborHours: number;
  flatRate: number;
  complexity: 'simple' | 'moderate' | 'complex';
  commonParts: Array<{
    name: string;
    cost: number;
    markup: number;
  }>;
}

interface PartCost {
  id: string;
  part_number: string;
  name: string;
  cost: number;
  markup: number;
  supplier: string;
  category: string;
}

export const BusinessCosts = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("templates");
  const [searchTerm, setSearchTerm] = useState("");

  const [jobTemplates, setJobTemplates] = useState<JobTemplate[]>([
    {
      id: "job-001",
      category: "Engine",
      jobType: "Oil Change Service",
      description: "Complete oil and filter change with inspection",
      laborHours: 0.5,
      flatRate: 89.99,
      complexity: "simple",
      commonParts: [
        { name: "Engine Oil (15W-40)", cost: 45.00, markup: 25 },
        { name: "Oil Filter", cost: 18.50, markup: 30 },
        { name: "Drain Plug Gasket", cost: 2.50, markup: 40 }
      ]
    },
    {
      id: "job-002",
      category: "Brake",
      jobType: "Brake Pad Replacement",
      description: "Replace brake pads and inspect brake system",
      laborHours: 2.5,
      flatRate: 450.00,
      complexity: "moderate",
      commonParts: [
        { name: "Brake Pads Set", cost: 85.00, markup: 35 },
        { name: "Brake Cleaner", cost: 8.50, markup: 50 },
        { name: "Hardware Kit", cost: 25.00, markup: 40 }
      ]
    },
    {
      id: "job-003",
      category: "Transmission",
      jobType: "Transmission Service",
      description: "Complete transmission fluid and filter service",
      laborHours: 3.0,
      flatRate: 650.00,
      complexity: "complex",
      commonParts: [
        { name: "Transmission Fluid", cost: 120.00, markup: 25 },
        { name: "Transmission Filter", cost: 45.00, markup: 35 },
        { name: "Pan Gasket", cost: 28.00, markup: 40 }
      ]
    }
  ]);

  const [partCosts, setPartCosts] = useState<PartCost[]>([]);

  useEffect(() => {
    fetchParts();
    const channel = supabase
      .channel('parts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parts' }, fetchParts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchParts = async () => {
    const { data, error } = await supabase
      .from('parts')
      .select('*');
    if (error) {
      console.error("Error fetching parts:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load parts." });
    } else {
      setPartCosts(data as PartCost[]);
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch(complexity) {
      case 'simple': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'complex': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTemplates = jobTemplates.filter(template =>
    template.jobType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredParts = partCosts.filter(part =>
    part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.part_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculatePartPrice = (cost: number, markup: number) => {
    return cost * (1 + markup / 100);
  };

  const handleAddPart = async (newPart: Omit<PartCost, 'id'>) => {
    const { error } = await supabase
      .from('parts')
      .insert({
        name: newPart.name,
        part_number: newPart.part_number,
        cost: newPart.cost,
        markup: newPart.markup,
        supplier: newPart.supplier,
        category: newPart.category,
      });

    if (error) {
      toast({ variant: "destructive", title: "Error adding part", description: error.message });
    } else {
      toast({ title: "Part Added", description: `${newPart.name} has been added to the parts database.` });
      fetchParts();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Database className="h-6 w-6" />
          Business Cost Database
        </h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search jobs or parts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Job Templates</TabsTrigger>
          <TabsTrigger value="parts">Parts Database</TabsTrigger>
          <TabsTrigger value="analytics">Cost Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-gray-600">Manage flat-rate job templates and pricing</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Job Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Category</Label>
                      <Input placeholder="e.g., Engine, Brake, Transmission" />
                    </div>
                    <div>
                      <Label>Job Type</Label>
                      <Input placeholder="e.g., Oil Change Service" />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea placeholder="Detailed description of the work performed" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Labor Hours</Label>
                      <Input type="number" step="0.1" placeholder="2.5" />
                    </div>
                    <div>
                      <Label>Flat Rate ($)</Label>
                      <Input type="number" step="0.01" placeholder="450.00" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" className="flex-1">Cancel</Button>
                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700">Add Template</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{template.jobType}</h3>
                        <Badge variant="outline">{template.category}</Badge>
                        <Badge className={getComplexityColor(template.complexity)}>
                          {template.complexity}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{template.description}</p>
                      
                      <div className="flex items-center gap-6 mb-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">{template.laborHours} hours</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-lg font-bold text-green-600">${template.flatRate}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Common Parts:</h4>
                        <div className="space-y-1">
                          {template.commonParts.map((part, index) => (
                            <div key={index} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                              <span>{part.name}</span>
                              <span className="font-medium">
                                ${calculatePartPrice(part.cost, part.markup).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="parts" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-gray-600">Manage parts inventory costs and pricing</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Part
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Part Cost</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const newPart = {
                    part_number: (form.elements.namedItem('partNumber') as HTMLInputElement).value,
                    name: (form.elements.namedItem('description') as HTMLInputElement).value,
                    category: (form.elements.namedItem('category') as HTMLInputElement).value,
                    cost: parseFloat((form.elements.namedItem('cost') as HTMLInputElement).value),
                    markup: parseFloat((form.elements.namedItem('markup') as HTMLInputElement).value),
                    supplier: (form.elements.namedItem('supplier') as HTMLInputElement).value,
                  };
                  handleAddPart(newPart);
                }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="partNumber">Part Number</Label>
                      <Input id="partNumber" placeholder="FL-2016" required />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Input id="category" placeholder="Filters" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" placeholder="Oil Filter - Cummins ISX" required />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="cost">Cost ($)</Label>
                      <Input id="cost" type="number" step="0.01" placeholder="18.50" required />
                    </div>
                    <div>
                      <Label htmlFor="markup">Markup (%)</Label>
                      <Input id="markup" type="number" placeholder="30" required />
                    </div>
                    <div>
                      <Label htmlFor="supplier">Supplier</Label>
                      <Input id="supplier" placeholder="Fleetguard" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => { /* Close dialog */ }}>Cancel</Button>
                    <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">Add Part</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Markup</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sell Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredParts.map((part) => (
                      <tr key={part.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{part.part_number}</td>
                        <td className="px-6 py-4">{part.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">${part.cost.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{part.markup}%</td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-green-600">
                          ${calculatePartPrice(part.cost, part.markup).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{part.supplier}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Average Markup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">32.5%</div>
                <p className="text-sm text-gray-600">Across all parts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Job Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{jobTemplates.length}</div>
                <p className="text-sm text-gray-600">Total templates</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Parts Database
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{partCosts.length}</div>
                <p className="text-sm text-gray-600">Parts tracked</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Job Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['Engine', 'Brake', 'Transmission', 'Electrical'].map((category, index) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="font-medium">{category}</span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(4-index) * 25}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{4-index} templates</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};