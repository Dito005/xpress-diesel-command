"use client";

import { BusinessCostsSettings } from "./BusinessCostsSettings";
import { TechnicianManagement } from "./TechnicianManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const ShopSettings = () => {
  return (
    <Tabs defaultValue="technicians" className="space-y-4">
      <TabsList>
        <TabsTrigger value="technicians">Technician Management</TabsTrigger>
        <TabsTrigger value="costs">Business Costs</TabsTrigger>
        <TabsTrigger value="invoicing">Invoicing</TabsTrigger>
        <TabsTrigger value="system">System</TabsTrigger>
      </TabsList>
      <TabsContent value="technicians">
        <TechnicianManagement />
      </TabsContent>
      <TabsContent value="costs">
        <BusinessCostsSettings />
      </TabsContent>
      <TabsContent value="invoicing">
        <p>Invoicing settings coming soon.</p>
      </TabsContent>
      <TabsContent value="system">
        <p>System settings coming soon.</p>
      </TabsContent>
    </Tabs>
  );
};