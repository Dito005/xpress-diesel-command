// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@1.1.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL');
    if (!resendApiKey || !fromEmail) {
      throw new Error('Resend API Key or From Email is not set in environment variables.');
    }

    const { toEmail, invoiceHtml, invoiceId, grandTotal, customerEmail, appUrl } = await req.json();
    if (!toEmail || !invoiceHtml || !invoiceId || !grandTotal || !customerEmail || !appUrl) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_ANON_KEY'));

    const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-stripe-checkout', {
      body: {
        invoiceId,
        amount: grandTotal,
        customerEmail,
        successUrl: appUrl,
        cancelUrl: appUrl,
      }
    });

    if (checkoutError) throw new Error(`Failed to create Stripe checkout session: ${checkoutError.message}`);
    
    const payNowLink = checkoutData.url;
    const finalHtml = invoiceHtml.replace('<!--PAYMENT_LINK_PLACEHOLDER-->', 
      `<div style="text-align: center; margin-top: 2rem;">
         <a href="${payNowLink}" style="background-color: #1a1a1a; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 0.5rem; font-size: 1.2rem;">Pay Now</a>
       </div>`
    );

    const resend = new Resend(resendApiKey);
    const { data, error } = await resend.emails.send({
      from: `Xpress Diesel Repair <${fromEmail}>`,
      to: [toEmail],
      subject: `Your Invoice from Xpress Diesel Repair - #${invoiceId.slice(0, 8)}`,
      html: finalHtml,
    });

    if (error) {
      console.error('Resend email error:', JSON.stringify(error, null, 2));
      throw new Error(error.message);
    }

    return new Response(JSON.stringify({ message: 'Email sent successfully', data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Failed to send email:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});