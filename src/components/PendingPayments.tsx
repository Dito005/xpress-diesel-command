import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Clock } from "lucide-react";

export const PendingPayments = ({ onInvoiceClick }) => {
  const [pendingInvoices, setPendingInvoices] = useState([]);

  useEffect(() => {
    const fetchPendingInvoices = async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, grand_total, created_at, jobs(customer_name, truck_vin)')
        .in('status', ['pending', 'unpaid', 'draft'])
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching pending invoices:", error);
      } else {
        setPendingInvoices(data);
      }
    };

    fetchPendingInvoices();
    const channel = supabase
      .channel('pending-invoices-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, fetchPendingInvoices)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Pending Payments
          <Badge variant="destructive">{pendingInvoices.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {pendingInvoices.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No pending payments.</p>
        ) : (
          pendingInvoices.map(invoice => (
            <div 
              key={invoice.id} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
              onClick={() => onInvoiceClick(invoice.id)}
            >
              <div>
                <p className="font-semibold">{invoice.jobs?.customer_name || 'N/A'}</p>
                <p className="text-sm text-gray-600">VIN: {invoice.jobs?.truck_vin?.slice(-6) || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-green-600">${invoice.grand_total?.toLocaleString()}</p>
                <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(invoice.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};