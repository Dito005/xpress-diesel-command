import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Building, DollarSign, Clock, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const ShopSettings = () => {
  const { toast } = useToast();
  const [shopConfig, setShopConfig] = useState({
    shopName: "Xpress Diesel Repair",
    address: "123 Truck Way, Industrial District",
    phone: "(555) 123-4567",
    email: "service@xpressdiesel.com",
    taxRate: "8.5",
    laborRate: "85.00",
    markupPercent: "25",
    invoicePrefix: "INV",
    autoInvoicing: true,
    requireApproval: false,
    businessHours: {
      monday: { open: "07:00", close: "18:00", enabled: true },
      tuesday: { open: "07:00", close: "18:00", enabled: true },
      wednesday: { open: "07:00", close: "18:00", enabled: true },
      thursday: { open: "07:00", close: "18:00", enabled: true },
      friday: { open: "07:00", close: "18:00", enabled: true },
      saturday: { open: "08:00", close: "16:00", enabled: true },
      sunday: { open: "09:00", close: "15:00", enabled: false }
    }
  });

  const updateShopConfig = (field: string, value: any) => {
    setShopConfig(prev => ({ ...prev, [field]: value }));
  };

  const updateBusinessHour = (day: string, field: string, value: any) => {
    setShopConfig(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: { ...prev.businessHours[day], [field]: value }
      }
    }));
  };

  const handleSave = () => {
    // In a real app, this would save to backend
    toast({
      title: "Settings Saved",
      description: "Shop configuration has been updated successfully.",
    });
  };

  const days = Object.keys(shopConfig.businessHours);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Shop Settings
        </h2>
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="hours">Business Hours</TabsTrigger>
          <TabsTrigger value="invoicing">Invoicing</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Shop Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shopName">Shop Name</Label>
                  <Input
                    id="shopName"
                    value={shopConfig.shopName}
                    onChange={(e) => updateShopConfig('shopName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={shopConfig.phone}
                    onChange={(e) => updateShopConfig('phone', e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={shopConfig.address}
                  onChange={(e) => updateShopConfig('address', e.target.value)}
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={shopConfig.email}
                  onChange={(e) => updateShopConfig('email', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="laborRate">Labor Rate ($/hour)</Label>
                  <Input
                    id="laborRate"
                    type="number"
                    value={shopConfig.laborRate}
                    onChange={(e) => updateShopConfig('laborRate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="markupPercent">Parts Markup (%)</Label>
                  <Input
                    id="markupPercent"
                    type="number"
                    value={shopConfig.markupPercent}
                    onChange={(e) => updateShopConfig('markupPercent', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={shopConfig.taxRate}
                    onChange={(e) => updateShopConfig('taxRate', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Business Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {days.map((day) => (
                <div key={day} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={shopConfig.businessHours[day].enabled}
                      onCheckedChange={(checked) => updateBusinessHour(day, 'enabled', checked)}
                    />
                    <span className="font-medium capitalize w-20">{day}</span>
                  </div>
                  {shopConfig.businessHours[day].enabled && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={shopConfig.businessHours[day].open}
                        onChange={(e) => updateBusinessHour(day, 'open', e.target.value)}
                        className="w-24"
                      />
                      <span>to</span>
                      <Input
                        type="time"
                        value={shopConfig.businessHours[day].close}
                        onChange={(e) => updateBusinessHour(day, 'close', e.target.value)}
                        className="w-24"
                      />
                    </div>
                  )}
                  {!shopConfig.businessHours[day].enabled && (
                    <span className="text-gray-500">Closed</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoicing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoicing Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                <Input
                  id="invoicePrefix"
                  value={shopConfig.invoicePrefix}
                  onChange={(e) => updateShopConfig('invoicePrefix', e.target.value)}
                  className="w-32"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-create invoices</Label>
                    <p className="text-sm text-gray-600">Automatically create invoices when jobs are completed</p>
                  </div>
                  <Switch
                    checked={shopConfig.autoInvoicing}
                    onCheckedChange={(checked) => updateShopConfig('autoInvoicing', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require approval</Label>
                    <p className="text-sm text-gray-600">Require manager approval before sending invoices</p>
                  </div>
                  <Switch
                    checked={shopConfig.requireApproval}
                    onCheckedChange={(checked) => updateShopConfig('requireApproval', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};