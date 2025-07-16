import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const costsSchema = z.object({
  rent: z.preprocess(val => Number(val) || 0, z.number().optional()),
  salaries: z.preprocess(val => Number(val) || 0, z.number().optional()),
  utilities: z.preprocess(val => Number(val) || 0, z.number().optional()),
  parts_markup_percent: z.preprocess(val => Number(val) || 0, z.number().optional()),
  shop_fee_default: z.preprocess(val => Number(val) || 0, z.number().optional()),
  disposal_fee_default: z.preprocess(val => Number(val) || 0, z.number().optional()),
  misc_costs: z.string().optional(),
});

const fetchBusinessCosts = async () => {
  const { data, error } = await supabase.from('business_costs').select('*').limit(1).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const BusinessCostsSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: costs, isLoading } = useQuery({
    queryKey: ['businessCosts'],
    queryFn: fetchBusinessCosts,
  });

  const form = useForm<z.infer<typeof costsSchema>>({
    resolver: zodResolver(costsSchema),
    values: costs || {},
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: z.infer<typeof costsSchema>) => {
      const payload = { ...values, id: costs?.id || '00000000-0000-0000-0000-000000000001' };
      const { error } = await supabase.from('business_costs').upsert(payload, { onConflict: 'id' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Business costs saved." });
      queryClient.invalidateQueries({ queryKey: ['businessCosts'] });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  });

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle>Business Costs</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => upsertMutation.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="rent" render={({ field }) => (<FormItem><FormLabel>Monthly Rent</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="salaries" render={({ field }) => (<FormItem><FormLabel>Monthly Salaries</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="utilities" render={({ field }) => (<FormItem><FormLabel>Monthly Utilities</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="parts_markup_percent" render={({ field }) => (<FormItem><FormLabel>Parts Markup (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="shop_fee_default" render={({ field }) => (<FormItem><FormLabel>Shop Fee Default ($)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="disposal_fee_default" render={({ field }) => (<FormItem><FormLabel>Disposal Fee Default ($)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="misc_costs" render={({ field }) => (<FormItem><FormLabel>Misc Costs</FormLabel><FormControl><Textarea placeholder="Itemized list or description of other costs" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <Button type="submit" disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Costs"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};