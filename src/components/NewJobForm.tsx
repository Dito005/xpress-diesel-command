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

// ... (keep existing helper functions like fetchVehicleDataFromVIN and getSuggestedCustomerComplaint)

const formSchema = z.object({
  truckVin: z.string().length(17, "VIN must be 17 characters"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.string().min(4, "Year is required"),
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Invalid email address").optional().or(z.literal('')),
  customerPhone: z.string().min(1, "Customer phone is required"),
  usdotNumber: z.string().optional(),
  company: z.string().optional(),
  billingAddress: z.string().optional(),
  jobType: z.string().min(1, "Job type is required"),
  priority: z.string().min(1, "Priority is required"),
  customerConcern: z.string().min(10, "Please provide a detailed customer concern"),
  recommendedService: z.string().optional(),
  notes: z.string().optional(),
  assignedTechId: z.string().optional(),
});

interface CustomerOption {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  company?: string;
  usdotNumber?: string;
}

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
  const [existingCustomers, setExistingCustomers] = useState<CustomerOption[]>([]);

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
      customerConcern: "",
      recommendedService: "",
      notes: "",
      assignedTechId: "",
    },
  });

  // ... (keep existing useEffect for fetching initial data)

  const handleImageScan = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsOcrLoading(true);
    toast({ title: "Scanning Image...", description: "Uploading and analyzing the image. This may take a moment." });

    try {
      // 1. Upload image to Supabase Storage
      const filePath = `job-scans/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('job_images')
        .upload(filePath, file);

      if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('job_images')
        .getPublicUrl(filePath);

      // 3. Call OCR Edge Function
      const { data: ocrData, error: ocrError } = await supabase.functions.invoke('ocr-service', {
        body: { imageUrl: publicUrl },
      });

      if (ocrError) throw new Error(`OCR Error: ${ocrError.message}`);

      // 4. Parse text and populate form
      const text = ocrData.text.toLowerCase();
      const vinMatch = text.match(/vin[:\s]+([a-hj-npr-z0-9]{17})/i);
      const usdotMatch = text.match(/usdot[:\s]+(\d{6,8})/i);
      
      if (vinMatch?.[1]) {
        form.setValue("truckVin", vinMatch[1].toUpperCase());
        toast({ title: "VIN Found!", description: `Populated VIN: ${vinMatch[1].toUpperCase()}` });
        // Automatically trigger VIN lookup
        // This requires refactoring handleVinLookup to accept a VIN
        // For now, we'll just populate it.
      }
      if (usdotMatch?.[1]) {
        form.setValue("usdotNumber", usdotMatch[1]);
        toast({ title: "USDOT Found!", description: `Populated USDOT: ${usdotMatch[1]}` });
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

  // ... (keep existing functions: handleVinLookup, handleUsdotLookup, handleCustomerSelect, handleJobTypeChange, onSubmit)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => {})} className="space-y-6 py-4 overflow-y-auto max-h-[calc(90vh-100px)]">
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">Vehicle Information</h3>
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
                <FormDescription>Enter the 17-character Vehicle Identification Number.</FormDescription>
                <div className="flex gap-2">
                  <FormControl>
                    <Input placeholder="Enter 17-character VIN" {...field} />
                  </FormControl>
                  <Button type="button" onClick={() => {}} disabled={isVinLoading}>
                    {isVinLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* ... rest of the form remains the same */}
        </div>
        {/* ... rest of the form remains the same */}
        <div className="flex justify-end">
          <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Job"}
          </Button>
        </div>
      </form>
    </Form>
  );
};