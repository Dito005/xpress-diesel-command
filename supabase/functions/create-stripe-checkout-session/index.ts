/// <reference types="./deno.d.ts" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16.2.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoiceId, amount, customerEmail, customerName } = await req.json();

    if (!invoiceId || !amount || !customerEmail || !customerName) {
      return new Response(JSON.stringify({ error: 'Missing required parameters: invoiceId, amount, customerEmail, customerName' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Invoice #${invoiceId}`,
              description: `Payment for services rendered by Xpress Diesel Repair.`,
            },
            unit_amount: Math.round(amount * 100), // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: customerEmail,
      success_url: `https://lovable.dev/projects/a1c551a1-9c13-4e09-b344-7d1e1ee71b34?payment_status=success&invoice_id=${invoiceId}`, // Replace with your actual success URL
      cancel_url: `https://lovable.dev/projects/a1c551a1-9c13-4e09-b344-7d1e1ee71b34?payment_status=cancelled&invoice_id=${invoiceId}`, // Replace with your actual cancel URL
      metadata: {
        invoice_id: invoiceId,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Stripe Checkout Session creation failed:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});