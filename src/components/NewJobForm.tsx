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
import { Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";

const fetchVehicleDataFromVIN = async (vin: string) => {
  const nhtsaApiUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinExtended/${vin}?format=json`;
  
  const response = await fetch(nhtsaApiUrl);
  if (!response.ok) {
    throw new Error('Network response was not ok.');
  }
  
  const data = await response.json();

  if (!data.Results || data.Results.length === 0) {
    throw new Error('No results found for this VIN.');
  }

  const getResultValue = (variableName: string) => {
    const result = data.Results.find((r: any) => r.Variable === variableName);
    return result ? result.Value : null;
  };

  const errorCode = getResultValue('Error Code');
  
  // If Error Code is not '0', there's an error.
  if (errorCode && errorCode !== '0') {
    const errorMessage = getResultValue('Error Text') || 'Failed to decode VIN.';
    throw new Error(errorMessage);
  }

  const make = getResultValue('Make');
  const model = getResultValue('Model');
  const year = getResultValue('Model Year');

  if (!make || !model || !year) {
    throw new Error('Could not decode all vehicle details from VIN. Please enter manually.');
  }

  return { make, model, year };
};

// AI-powered suggestions for customer complaints based on job type
const getSuggestedCustomerComplaint = (jobType: string): string => {
  const suggestions: Record<string, string> = {
    "PM Service": "Routine preventive maintenance service required.",
    "Brake Repair": "Brakes are squealing/grinding, or pedal feels soft/spongy.",
    "Engine Work": "Engine light is on, rough idling, or loss of power.",
    "AC Repair": "Air conditioning is not blowing cold air or making unusual noises.",
    "Transmission": "Transmission is slipping, shifting hard, or or leaking fluid.",
    "Electrical": "Lights are flickering, battery draining, or electrical components not working.",
    "Road Service": "Vehicle broke down on the side of the road, needs immediate assistance.",
    "Diagnostic": "Check engine light is on, need to diagnose underlying issue.",
    "Other": "General repair or maintenance needed, details to be provided."
  };
  return suggestions[jobType] || "";
};

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
      customerConcern: "",
      recommendedService: "",
      notes: "",
      assignedTechId: "",
    },
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      // Fetch technicians
      const { data: techsData, error: techsError } = await supabase
        .from('techs')
        .select('id, name');
      if (techsError) {
        console.error("Error fetching technicians:", techsError);
      } else {
        setTechs(techsData);
      }

      // Fetch existing customers
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('customer_name, customer_email, customer_phone, company, customer_info')
        .order('created_at', { ascending: false });

      if (jobsError) {
        console.error("Error fetching existing jobs for customers:", jobsError);
      } else {
        const uniqueCustomers = new Map<string, CustomerOption>();
        jobsData.forEach(job => {
          if (job.customer_name && !uniqueCustomers.has(job.customer_name)) {
            uniqueCustomers.set(job.customer_name, {
              customerName: job.customer_name,
              customerEmail: job.customer_email || undefined,
              customerPhone: job.customer_phone || undefined,
              company: job.company || undefined,
              usdotNumber: job.customer_info?.usdot_number || undefined,
            });
          }
        });
        setExistingCustomers(Array.from(uniqueCustomers.values()));
      }
    };
    fetchInitialData();
  }, []);

  const handleVinLookup = async () => {
    const vin = form.getValues("truckVin");
    if (vin.length !== 17) {
      toast({
        variant: "destructive",
        title: "Invalid VIN",
        description: "Please enter a full 17-character VIN.",
      });
      return;
    }

    setIsVinLoading(true);
    try {
      const data = await fetchVehicleDataFromVIN(vin);
      form.setValue("make", data.make || "");
      form.setValue("model", data.model || "");
      form.setValue("year", data.year || "");
      toast({
        title: "VIN Lookup Successful",
        description: `Found a ${data.year} ${data.make} ${data.model}.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "VIN Lookup Failed",
        description: error.message,
      });
      form.setValue("make", "");
      form.setValue("model", "");
      form.setValue("year", "");
    } finally {
      setIsVinLoading(false);
    }
  };

  const handleUsdotLookup = async () => {
    const usdot = form.getValues("usdotNumber");
    if (!usdot) {
      toast({
        variant: "destructive",
        title: "Missing USDOT",
        description: "Please enter a USDOT number.",
      });
      return;
    }

    setIsUsdotLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('usdot-lookup', {
        body: { usdot },
      });

      if (error) {
        if (error instanceof FunctionsHttpError) {
          const errorMessage = await error.context.json();
          throw new Error(errorMessage.error || 'An unknown error occurred during USDOT lookup.');
        }
        throw new Error(error.message);
      }

      form.setValue("company", data.companyName || "");
      form.setValue("customerPhone", data.companyPhone || form.getValues("customerPhone"));
      form.setValue("customerName", data.companyName || form.getValues("customerName"));
      toast({
        title: "USDOT Lookup Successful",
        description: `Found company: ${data.companyName}.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "USDOT Lookup Failed",
        description: error.message,
      });
      form.setValue("company", "");
    } finally {
      setIsUsdotLoading(false);
    }
  };

  const handleCustomerSelect = (customerName: string) => {
    const selectedCustomer = existingCustomers.find(c => c.customerName === customerName);
    if (selectedCustomer) {
      form.setValue("customerName", selectedCustomer.customerName);
      form.setValue("customerEmail", selectedCustomer.customerEmail || "");
      form.setValue("customerPhone", selectedCustomer.customerPhone || "");
      form.setValue("company", selectedCustomer.company || "");
      form.setValue("usdotNumber", selectedCustomer.usdotNumber || "");
      toast({
        title: "Customer Info Loaded",
        description: `Details for ${selectedCustomer.customerName} have been pre-filled.`,
      });
    }
  };

  const handleJobTypeChange = (jobType: string) => {
    form.setValue("jobType", jobType);
    form.setValue("customerConcern", getSuggestedCustomerComplaint(jobType));
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    const { data: jobData, error: jobError } = await supabase.from('jobs').insert([
      { 
        truck_vin: values.truckVin,
        customer_name: values.customerName,
        customer_email: values.customerEmail,
        customer_phone: values.customerPhone,
        company: values.company,
        billing_address: values.billingAddress,
        job_type: values.jobType,
        notes: values.notes,
        customer_concern: values.customerConcern,
        recommended_service: values.recommendedService,
        status: 'open', // Default status for new jobs
        customer_info: { // Store additional customer/vehicle info as JSONB
          make: values.make,
          model: values.model,
          year: values.year,
          usdot_number: values.usdotNumber,
          // Add other USDOT fields here if fetched and needed
        },
      }
    ]).select().single();

    if (jobError) {
      toast({
        variant: "destructive",
        title: "Failed to create job",
        description: jobError.message,
      });
      setIsSubmitting(false);
      return;
    }

    // If a technician is assigned (and not the "unassigned" placeholder), create a job_assignment entry
    if (values.assignedTechId && values.assignedTechId !== "unassigned" && jobData?.id) {
      const { error: assignmentError } = await supabase.from('job_assignments').insert([
        {
          job_id: jobData.id,
          tech_id: values.assignedTechId,
        }
      ]);

      if (assignmentError) {
        toast({
          variant: "destructive",
          title: "Failed to assign technician",
          description: assignmentError.message,
        });
      } else {
        toast({
          title: "Technician Assigned",
          description: `Job assigned to selected technician.`,
        });
      }
    }

    toast({
      title: "Job Created Successfully",
      description: `A new job for ${values.customerName} has been added to the board.`,
    });
    form.reset();
    setIsSubmitting(false);
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 overflow-y-auto max-h-[calc(90vh-100px)]">
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="font-semibold text-lg">Vehicle Information</h3>
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
                  <Button type="button" onClick={handleVinLookup} disabled={isVinLoading}>
                    {isVinLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="make"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Make</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Ford" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., F-550" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 2016" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="font-semibold text-lg">Customer & Company Information</h3>
          {existingCustomers.length > 0 && (
            <FormField
              control={form.control}
              name="customerName" // Using customerName field to trigger selection
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Existing Customer (Optional)</FormLabel> {/* Removed htmlFor as it's handled by FormControl */}
                  <FormControl>
                    <Select onValueChange={handleCustomerSelect} value={field.value}> {/* Added value prop */}
                      <SelectTrigger id="customerSelect"> {/* Ensure this ID is unique if needed */}
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {existingCustomers.map((customer, index) => (
                          <SelectItem key={index} value={customer.customerName}>
                            {customer.customerName} {customer.company ? `(${customer.company})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>Choose a customer to auto-fill their details.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name</FormLabel>
                  <FormDescription>Individual or primary contact name.</FormDescription>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Phone</FormLabel>
                  <FormDescription>Primary contact phone number.</FormDescription>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Email (Optional)</FormLabel>
                  <FormDescription>Email for invoices and updates.</FormDescription>
                  <FormControl>
                    <Input placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="usdotNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>USDOT Number (Optional)</FormLabel>
                  <FormDescription>Enter company's USDOT number to auto-fill company info.</FormDescription>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="e.g., 1234567" {...field} />
                    </FormControl>
                    <Button type="button" onClick={handleUsdotLookup} disabled={isUsdotLoading}>
                      {isUsdotLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name (Optional)</FormLabel>
                  <FormDescription>Auto-filled from USDOT or manually entered.</FormDescription>
                  <FormControl>
                    <Input placeholder="Acme Trucking Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="billingAddress"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Billing Address (Optional)</FormLabel>
                  <FormDescription>The official billing address for the company.</FormDescription>
                  <FormControl>
                    <Textarea placeholder="123 Business Rd, Suite 100, Commerce City, USA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="font-semibold text-lg">Job Details & Assignment</h3>
          <FormField
            control={form.control}
            name="jobType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Type</FormLabel>
                <FormDescription>Select the primary type of service required.</FormDescription>
                <Select onValueChange={handleJobTypeChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PM Service">PM Service</SelectItem>
                    <SelectItem value="Brake Repair">Brake Repair</SelectItem>
                    <SelectItem value="Engine Work">Engine Work</SelectItem>
                    <SelectItem value="AC Repair">AC Repair</SelectItem>
                    <SelectItem value="Transmission">Transmission</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="Road Service">Road Service</SelectItem>
                    <SelectItem value="Diagnostic">Diagnostic</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="customerConcern"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Complaint</FormLabel>
                <FormDescription>Detailed description of the issue reported by the customer.</FormDescription>
                <FormControl>
                  <Textarea placeholder="Describe the customer's issue..." {...field} />
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
                <FormLabel>Recommended Service (Optional)</FormLabel>
                <FormDescription>Any additional services recommended during initial assessment.</FormDescription>
                <FormControl>
                  <Textarea placeholder="Any recommended services..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Internal Notes (Optional)</FormLabel>
                <FormDescription>Any internal notes for the job, not visible to the customer.</FormDescription>
                <FormControl>
                  <Textarea placeholder="Any internal notes for the job..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="assignedTechId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assign Technician (Optional)</FormLabel>
                <FormDescription>Assign a technician to this job immediately.</FormDescription>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select technician" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {techs.map(tech => (
                      <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Job"}
          </Button>
        </div>
      </form>
    </Form>
  );
};