import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Bot, FileText as InvoiceIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./SessionProvider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BusinessCostsSettings } from "./BusinessCostsSettings";

const fetchSettings = async (): Promise<Record<string, any>> => {
  const { data: generalSettings, error: generalError } = await supabase.from('settings').select('key, value');
  if (generalError) throw new Error(generalError.message);
  
  const { data: invoiceSettings, error: invoiceError } = await supabase.from('invoice_settings').select('*').single();
  if (invoiceError && invoiceError.code !== 'PGRST116') throw new Error(invoiceError.message);

  const settingsMap = generalSettings.reduce((acc: Record<string, string>, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {});

  return { ...settingsMap, ...invoiceSettings };
};

export const ShopSettings = () => {
  const { toast } = useToast();
  const { userRole } = useSession();
  const queryClient = useQueryClient();

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['shopSettings'],
    queryFn: fetchSettings,
    enabled: userRole === 'admin',
  });

  const [aiSettings, setAiSettings] = useState({
    ai_provider: '',
    ai_api_key: '',
    ai_model: '',
    ai_enabled: false,
  });

  const [invoiceSettings, setInvoiceSettings] = useState({
    default_markup_parts: 0,
    shop_supply_fee_percentage: 0,
    disposal_fee: 0,
    credit_card_fee_percentage: 0,
    tax_rate: 0,
    tax_applies_to: 'both',
    default_hourly_rate: 0,
  });

  useEffect(() => {
    if (settings) {
      setAiSettings({
        ai_provider: settings.ai_provider || 'openai',
        ai_api_key: settings.ai_api_key || '',
        ai_model: settings.ai_model || 'gpt-4',
        ai_enabled: settings.ai_enabled === 'true',
      });
      setInvoiceSettings({
        default_markup_parts: settings.default_markup_parts || 0,
        shop_supply_fee_percentage: settings.shop_supply_fee_percentage || 0,
        disposal_fee: settings.disposal_fee || 0,
        credit_card_fee_percentage: settings.credit_card_fee_percentage || 0,
        tax_rate: settings.tax_rate || 0,
        tax_applies_to: settings.tax_applies_to || 'both',
        default_hourly_rate: settings.default_hourly_rate || 0,
      });
    }
  }, [settings]);

  const updateGeneralSettingsMutation = useMutation({
    mutationFn: async (newSettings: { key: string; value: string }[]) => {
      const { error } = await supabase.from('settings').upsert(newSettings, { onConflict: 'key' });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopSettings'] });
      toast({ title: "Settings Saved", description: "AI settings have been updated." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  });

  const updateInvoiceSettingsMutation = useMutation({
    mutationFn: async (newSettings: typeof invoiceSettings) => {
      const { error } = await supabase.from('invoice_settings').upsert({ ...newSettings, id: '00000000-0000-0000-0000-000000000001' }, { onConflict: 'id' });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopSettings'] });
      toast({ title: "Settings Saved", description: "Invoice settings have been updated." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  });

  const handleAiSettingsSave = () => {
    const settingsToSave = [
      { key: 'ai_provider', value: aiSettings.ai_provider },
      { key: 'ai_api_key', value: aiSettings.ai_api_key },
      { key: 'ai_model', value: aiSettings.ai_model },
      { key: 'ai_enabled', value: String(aiSettings.ai_enabled) },
    ];
    updateGeneralSettingsMutation.mutate(settingsToSave);
  };

  const handleInvoiceSettingsSave = () => {
    updateInvoiceSettingsMutation.mutate(invoiceSettings);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-50 flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Shop Settings
        </h2>
      </div>

      <Tabs defaultValue="invoicing" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="invoicing">Invoicing Rules</TabsTrigger>
          <TabsTrigger value="costs">Business Costs</TabsTrigger>
          {userRole === 'admin' && <TabsTrigger value="ai">AI Assistant</TabsTrigger>}
        </TabsList>

        <TabsContent value="invoicing" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <InvoiceIcon className="h-5 w-5" />
                Invoicing Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingSettings ? <Loader2 className="animate-spin" /> : <>
                <div className="grid grid-cols-2 gap-6">
                  <div><Label>Default Parts Markup (%)</Label><Input type="number" value={invoiceSettings.default_markup_parts} onChange={e => setInvoiceSettings(p => ({...p, default_markup_parts: parseFloat(e.target.value)}))} /></div>
                  <div><Label>Default Hourly Rate ($)</Label><Input type="number" value={invoiceSettings.default_hourly_rate} onChange={e => setInvoiceSettings(p => ({...p, default_hourly_rate: parseFloat(e.target.value)}))} /></div>
                  <div><Label>Shop Supply Fee (%)</Label><Input type="number" value={invoiceSettings.shop_supply_fee_percentage} onChange={e => setInvoiceSettings(p => ({...p, shop_supply_fee_percentage: parseFloat(e.target.value)}))} /></div>
                  <div><Label>Disposal Fee (flat $)</Label><Input type="number" value={invoiceSettings.disposal_fee} onChange={e => setInvoiceSettings(p => ({...p, disposal_fee: parseFloat(e.target.value)}))} /></div>
                  <div><Label>Credit Card Fee (%)</Label><Input type="number" value={invoiceSettings.credit_card_fee_percentage} onChange={e => setInvoiceSettings(p => ({...p, credit_card_fee_percentage: parseFloat(e.target.value)}))} /></div>
                  <div><Label>Tax Rate (%)</Label><Input type="number" value={invoiceSettings.tax_rate} onChange={e => setInvoiceSettings(p => ({...p, tax_rate: parseFloat(e.target.value)}))} /></div>
                  <div className="col-span-2"><Label>Tax Applies To</Label><Select value={invoiceSettings.tax_applies_to} onValueChange={v => setInvoiceSettings(p => ({...p, tax_applies_to: v}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="parts">Parts Only</SelectItem><SelectItem value="labor">Labor Only</SelectItem><SelectItem value="both">Parts & Labor</SelectItem></SelectContent></Select></div>
                </div>
                <Button onClick={handleInvoiceSettingsSave} disabled={updateInvoiceSettingsMutation.isPending}>{updateInvoiceSettingsMutation.isPending ? "Saving..." : "Save Invoice Settings"}</Button>
              </>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs">
          <BusinessCostsSettings />
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" />AI Assistant Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingSettings ? <Loader2 className="animate-spin" /> : <>
                <div className="flex items-center justify-between">
                  <div><Label>Enable AI Assistant</Label><p className="text-sm text-gray-600">Toggle the AI chatbot for all users.</p></div>
                  <Switch checked={aiSettings.ai_enabled} onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, ai_enabled: checked }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label htmlFor="aiProvider">AI Provider</Label><Select value={aiSettings.ai_provider} onValueChange={(value) => setAiSettings(prev => ({ ...prev, ai_provider: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="openai">OpenAI</SelectItem><SelectItem value="gemini">Google Gemini</SelectItem><SelectItem value="copilot">Microsoft Copilot</SelectItem></SelectContent></Select></div>
                  <div><Label htmlFor="aiModel">AI Model</Label><Select value={aiSettings.ai_model} onValueChange={(value) => setAiSettings(prev => ({ ...prev, ai_model: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="gpt-4o">GPT-4o</SelectItem><SelectItem value="gpt-4">GPT-4</SelectItem><SelectItem value="gpt-3.5-turbo">GPT-3.5-Turbo</SelectItem></SelectContent></Select></div>
                </div>
                <div><Label htmlFor="apiKey">API Key</Label><Input id="apiKey" type="password" placeholder="Enter your API key" value={aiSettings.ai_api_key} onChange={(e) => setAiSettings(prev => ({ ...prev, ai_api_key: e.target.value }))} /></div>
                <Button onClick={handleAiSettingsSave} disabled={updateGeneralSettingsMutation.isPending}>{updateGeneralSettingsMutation.isPending ? "Saving..." : "Save AI Settings"}</Button>
              </>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};