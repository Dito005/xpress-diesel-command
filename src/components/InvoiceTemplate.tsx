import React from 'react';

interface InvoiceTemplateProps {
  invoice: any;
  totals: any;
  settings: any;
  companyInfo: any;
}

export const InvoiceTemplate = React.forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ invoice, totals, settings, companyInfo }, ref) => {
  if (!invoice || !totals || !settings || !companyInfo) return null;

  const getStatusStyle = (status: string) => {
    const styles: Record<string, { color: string; borderColor: string }> = {
      paid: { color: '#16a34a', borderColor: '#16a34a' },
      sent: { color: '#2563eb', borderColor: '#2563eb' },
      pending: { color: '#f97316', borderColor: '#f97316' },
    };
    return styles[status] || styles.pending;
  };

  const statusStyle = getStatusStyle(invoice.status);

  return (
    <div ref={ref} style={{ fontFamily: 'sans-serif', padding: '2rem', color: '#333', width: '800px', backgroundColor: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #eee', paddingBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', margin: 0, color: '#1a1a1a' }}>INVOICE</h1>
          <p style={{ margin: '0.25rem 0' }}>Invoice #: {invoice.id?.slice(0, 8)}</p>
          <p style={{ margin: '0.25rem 0' }}>Date: {new Date(invoice.created_at).toLocaleDateString()}</p>
          <div style={{
            border: `2px solid ${statusStyle.borderColor}`,
            color: statusStyle.color,
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            display: 'inline-block',
            marginTop: '1rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            fontSize: '0.9rem'
          }}>
            {invoice.status}
          </div>
        </div>
        <div>
          <h2 style={{ margin: 0 }}>{companyInfo.name || 'Xpress Diesel Repair'}</h2>
          <p style={{ margin: '0.25rem 0' }}>{companyInfo.address || '123 Diesel Way, Truckville, USA'}</p>
          <p style={{ margin: '0.25rem 0' }}>{companyInfo.phone || '(555) 555-5555'}</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#555' }}>Bill To:</h3>
          <p style={{ margin: '0.25rem 0' }}>{invoice.jobs?.customer_name}</p>
          <p style={{ margin: '0.25rem 0' }}>{invoice.jobs?.company || ''}</p>
          <p style={{ margin: '0.25rem 0' }}>{invoice.jobs?.billing_address || ''}</p>
        </div>
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#555' }}>Vehicle:</h3>
          <p style={{ margin: '0.25rem 0' }}>VIN: {invoice.jobs?.truck_vin}</p>
          <p style={{ margin: '0.25rem 0' }}>Unit: {invoice.jobs?.truck_vin?.slice(-6)}</p>
        </div>
      </div>

      <table style={{ width: '100%', marginTop: '2rem', borderCollapse: 'collapse' }}>
        <thead style={{ backgroundColor: '#f9f9f9' }}>
          <tr>
            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #eee' }}>Description</th>
            <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #eee' }}>Quantity/Hours</th>
            <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #eee' }}>Rate</th>
            <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #eee' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.invoice_labor?.map((l: any) => (
            <tr key={`labor-${l.id}`}>
              <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>Labor: {l.description}</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #eee' }}>{l.hours}</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #eee' }}>${l.rate.toFixed(2)}</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #eee' }}>${(l.hours * l.rate).toFixed(2)}</td>
            </tr>
          ))}
          {invoice.invoice_parts?.map((p: any) => (
            <tr key={`part-${p.id}`}>
              <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>Part: {p.parts?.name} ({p.parts?.part_number})</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #eee' }}>{p.quantity}</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #eee' }}>${(p.final_price / p.quantity).toFixed(2)}</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #eee' }}>${p.final_price.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
        <div style={{ width: '40%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
            <span>Subtotal</span>
            <span>${totals.subtotal.toFixed(2)}</span>
          </div>
          {invoice.misc_fees?.map((fee: any, i: number) => (
            <div key={`fee-${i}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
              <span>{fee.description}</span>
              <span>${fee.amount.toFixed(2)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
            <span>Tax ({settings.tax_rate}%)</span>
            <span>${totals.tax.toFixed(2)}</span>
          </div>
          {totals.ccFee > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
              <span>CC Fee ({settings.credit_card_fee_percentage}%)</span>
              <span>${totals.ccFee.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', marginTop: '0.5rem', borderTop: '2px solid #333', fontWeight: 'bold', fontSize: '1.2rem' }}>
            <span>Grand Total</span>
            <span>${totals.grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '3rem', fontSize: '0.8rem', color: '#777' }}>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>Notes:</h4>
        <p>Work Performed: {invoice.actual_service}</p>
        <p>Thank you for your business!</p>
      </div>

      {/* This placeholder will be replaced by the actual payment link */}
      <div id="payment-link-placeholder" />
    </div>
  );
});