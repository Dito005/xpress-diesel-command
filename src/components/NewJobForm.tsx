import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, UploadCloud } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";

const formSchema = z.object({
  truckVin: z.string().length(17, "VIN must be 17 characters"),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.string().optional(),
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Invalid email address").optional().or(z.literal('')),
  customerPhone: z.string().min(1, "Customer phone is required"),
  usdotNumber: z.string().optional(),
  company: z.string().optional(),
  billingAddress: z.string().optional(),
  jobType: z.string().min(1, "Job type is required"),
  priority: z.string().min(1, "Priority is required"),
  estimatedHours: z.preprocess(val => parseFloat(String(val) || '0'), z.number().optional()),
  customerConcern: z.string().min(10, "Please provide a detailed customer concern"),
  recommendedService: z.string().optional(),
  notes: z.string().optional(),
  assignedTechId: z.string().optional(),
});

interface NewJobFormProps {
  onSuccess?: () => void;
}

export const NewJobForm = ({ onSuccess }: NewJobFormProps) => {
  const { toast } = useToast();
  const [isVinLoading, setIsVinLoading] = useState(false);
  const [isUsdotLoading, setIsUsdotLoading] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [techs, setTechs] = useState([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      truckVin: "",
      make: "",
      model: "",
      year: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      usdotNumber: "",
      company: "",
      billingAddress: "",
      jobType: "",
      priority: "medium",
      estimatedHours: 0,
      customerConcern: "",
      recommendedService: "",
      notes: "",
      assignedTechId: "",
    },
  });

  useEffect(() => {
    const fetchTechs = async () => {
      const { data } = await supabase.from('techs').select('id, name');
      setTechs(data || []);
    };
    fetchTechs();
  }, []);

  const handleVinLookup = async () => {
    const vin = form.getValues("truckVin");
    if (!vin || vin.length !== 17) {
      toast({ variant: "destructive", title: "Invalid VIN", description: "Please enter a valid 17-character VIN to look up." });
      return;
    }
    setIsVinLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('vin-lookup', {
        body: { vin },
      });
      if (error) throw error;

      form.setValue("make", data.make);
      form.setValue("model", data.model);
      form.setValue("year", data.year);
      toast({ title: "Vehicle Found", description: `${data.year} ${data.make} ${data.model} details filled in.` });
    } catch (error: any) {
      const errorMessage = error instanceof FunctionsHttpError ? await error.context.json() : { error: error.message };
      toast({ variant: "destructive", title: "VIN Lookup Failed", description: errorMessage.error });
    } finally {
      setIsVinLoading(false);
    }
  };

  const handleUsdotLookup = async () => {
    const usdot = form.getValues("usdotNumber");
    if (!usdot) {
      toast({ variant: "destructive", title: "Missing USDOT", description: "Please enter a USDOT number to look up." });
      return;
    }
    setIsUsdotLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('usdot-lookup', {
        body: { usdot },
      });
      if (error) throw error;

      form.setValue("company", data.companyName);
      form.setValue("customerPhone", data.companyPhone);
      form.setValue("billingAddress", data.companyAddress);
      toast({ title: "Company Found", description: `${data.companyName} details have been filled in.` });
    } catch (error: any) {
      const errorMessage = error instanceof FunctionsHttpError ? await error.context.json() : { error: error.message };
      toast({ variant: "destructive", title: "USDOT Lookup Failed", description: errorMessage.error });
    } finally {
      setIsUsdotLoading(false);
    }
  };

  const handleImageScan = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsOcrLoading(true);
    toast({ title: "Scanning Image...", description: "Uploading and analyzing the image. This may take a moment." });

    try {
      const filePath = `job-scans/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('job_images')
        .upload(filePath, file);

      if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);

      const { data: { publicUrl } } = supabase.storage
        .from('job_images')
        .getPublicUrl(filePath);

      const { data: ocrData, error: ocrError } = await supabase.functions.invoke('ocr-service', {
        body: { imageUrl: publicUrl },
      });

      if (ocrError) throw new Error(`OCR Error: ${ocrError.message}`);

      const text = ocrData.text;
      const vinMatch = text.match(/vin[:\s]+([a-hj-npr-z0-9]{17})/i);
      const usdotMatch = text.match(/usdot[:\s]+(\d{6,8})/i);
      
      if (vinMatch?.[1]) {
        form.setValue("truckVin", vinMatch[1].toUpperCase());
        toast({ title: "VIN Found!", description: `Populated VIN: ${vinMatch[1].toUpperCase()}` });
        handleVinLookup();
      }
      if (usdotMatch?.[1]) {
        form.setValue("usdotNumber", usdotMatch[1]);
        toast({ title: "USDOT Found!", description: `Populated USDOT: ${usdotMatch[1]}` });
        handleUsdotLookup();
      }

      if (!vinMatch && !usdotMatch) {
        toast({ variant: "destructive", title: "No Details Found", description: "Could not automatically detect VIN or USDOT from the image." });
      }

    } catch (error: any) {
      toast({ variant: "destructive", title: "Scan Failed", description: error.message });
    } finally {
      setIsOcrLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const { assignedTechId, estimatedHours, ...jobData } = values;
  
    const { data: newJob, error } = await supabase
      .from('jobs')
      .insert({ ...jobData, estimated_hours: estimatedHours })
      .select('id')
      .single();
  
    if (error) {
      toast({ variant: "destructive", title: "Error creating job", description: error.message });
      setIsSubmitting(false);
      return;
    }
  
    if (assignedTechId && newJob) {
      const { error: assignmentError } = await supabase
        .from('job_assignments')
        .insert({ job_id: newJob.id, tech_id: assignedTechId });
  
      if (assignmentError) {
        toast({ variant: "destructive", title: "Job created, but assignment failed", description: assignmentError.message });
      }
    }
  
    toast({ title: "Job Created", description: `Job for VIN ${values.truckVin.slice(-6)} has been created.` });
    setIsSubmitting(false);
    if (onSuccess) onSuccess();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 overflow-y-auto max-h-[calc(90vh-100px)] pr-4">
        <div className="space-y-4 p-4 border rounded-lg bg-secondary/50">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">Vehicle & Job Information</h3>
            <Label htmlFor="image-upload" className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 ${isOcrLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              {isOcrLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UploadCloud className="h-4 w-4 mr-2" />}
              Scan from Image
            </Label>
            <Input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageScan} disabled={isOcrLoading} />
          </div>
          <FormField
            control={form.control}
            name="truckVin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>VIN</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input placeholder="Enter 17-character VIN" {...field} />
                  </FormControl>
                  <Button type="button" onClick={handleVinLookup} disabled={isVinLoading}>
                    {isVinLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={form.control} name="make" render={({ field }) => (<FormItem><FormLabel>Make</FormLabel><FormControl><Input placeholder="e.g., Freightliner" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="model" render={({ field }) => (<FormItem><FormLabel>Model</FormLabel><FormControl><Input placeholder="e.g., Cascadia" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="year" render={({ field }) => (<FormItem><FormLabel>Year</FormLabel><FormControl><Input placeholder="e.g., 2022" {...field} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={form.control} name="jobType" render={({ field }) => (<FormItem><FormLabel>Job Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select job type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Diagnostics">Diagnostics</SelectItem><SelectItem value="Repair">Repair</SelectItem><SelectItem value="Maintenance">Maintenance</SelectItem><SelectItem value="Road Service">Road Service</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="priority" render={({ field }) => (<FormItem><FormLabel>Priority</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger></FormControl><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="estimatedHours" render={({ field }) => (<FormItem><FormLabel>Estimated Hours</FormLabel><FormControl><Input type="number" placeholder="e.g., 4.5" {...field} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <FormField control={form.control} name="customerConcern" render={({ field }) => (<FormItem><FormLabel>Customer Concern</FormLabel><FormControl><Textarea placeholder="Describe the customer's issue..." {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
        
        <div className="space-y-4 p-4 border rounded-lg bg-secondary/50">
          <h3 className="font-semibold text-lg">Customer Information</h3>
          <FormField control={form.control} name="usdotNumber" render={({ field }) => (<FormItem><FormLabel>USDOT Number</FormLabel><div className="flex gap-2"><FormControl><Input placeholder="Enter USDOT number" {...field} /></FormControl><Button type="button" onClick={handleUsdotLookup} disabled={isUsdotLoading}>{isUsdotLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</Button></div><FormMessage /></FormItem>)} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="customerName" render={({ field }) => (<FormItem><FormLabel>Customer Name</FormLabel><FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="company" render={({ field }) => (<FormItem><FormLabel>Company</FormLabel><FormControl><Input placeholder="e.g., Acme Trucking" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="customerPhone" render={({ field }) => (<FormItem><FormLabel>Customer Phone</FormLabel><FormControl><Input placeholder="(555) 123-4567" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="customerEmail" render={({ field }) => (<FormItem><FormLabel>Customer Email</FormLabel><FormControl><Input placeholder="john.doe@email.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
          </div>
        </div>

        <div className="space-y-4 p-4 border rounded-lg bg-secondary/50">
          <h3 className="font-semibold text-lg">Assignment & Notes</h3>
          <FormField control={form.control} name="assignedTechId" render={({ field }) => (<FormItem><FormLabel>Assign Technician</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Assign a technician" /></SelectTrigger></FormControl><SelectContent>{techs.map(tech => <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Internal Notes</FormLabel><FormControl><Textarea placeholder="Add any internal notes for this job..." {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Job"}
          </Button>
        </div>
      </form>
    </Form>
  );
};