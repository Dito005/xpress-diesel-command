import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// This would be a call to a Supabase Edge Function in a real app
const fetchVehicleDataFromVIN = async (vin: string) => {
  console.log(`Looking up VIN: ${vin}`);
  // Simulate API call
  await new Promise(res => setTimeout(res, 1000));

  // Mock responses for specific VINs
  const MOCK_DATA: { [key: string]: { make: string; model: string; year: string } } = {
    "1FDNF4JAXGEB00000": { make: "Ford", model: "F-550", year: "2016" },
    "1GCHK39K78Z000000": { make: "Chevrolet", model: "Silverado 3500HD", year: "2008" },
    "3C6TRVFG3JG000000": { make: "RAM", model: "3500", year: "2018" },
  };

  const vehicle = MOCK_DATA[vin.toUpperCase()];

  if (vehicle) {
    return vehicle;
  } else {
    throw new Error("VIN not found or invalid.");
  }
};

const formSchema = z.object({
  vin: z.string().length(17, "VIN must be 17 characters"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.string().min(4, "Year is required"),
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().min(1, "Customer phone is required"),
  complaint: z.string().min(10, "Please provide a detailed complaint"),
});

export const NewJobForm = () => {
  const { toast } = useToast();
  const [isVinLoading, setIsVinLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vin: "",
      make: "",
      model: "",
      year: "",
      customerName: "",
      customerPhone: "",
      complaint: "",
    },
  });

  const handleVinLookup = async () => {
    const vin = form.getValues("vin");
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
      form.setValue("make", data.make);
      form.setValue("model", data.model);
      form.setValue("year", data.year);
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

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Submitting new job:", values);
    // Here you would call your Supabase function to save the job
    toast({
      title: "Job Created",
      description: `A new job for ${values.customerName} has been created.`,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="font-semibold text-lg">Vehicle Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="vin"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>VIN</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="Enter 17-character VIN" {...field} />
                    </FormControl>
                    <Button type="button" onClick={handleVinLookup} disabled={isVinLoading}>
                      {isVinLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lookup"}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="make"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Make</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Ford" {...field} disabled />
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
                    <Input placeholder="e.g., F-550" {...field} disabled />
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
                    <Input placeholder="e.g., 2016" {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="font-semibold text-lg">Customer & Job Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name</FormLabel>
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
                  <FormControl>
                    <Input placeholder="(555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="complaint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Complaint</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe the issue with the vehicle..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            Create Job
          </Button>
        </div>
      </form>
    </Form>
  );
};