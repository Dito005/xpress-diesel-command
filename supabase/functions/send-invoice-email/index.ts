// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@1.1.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for required environment variables first
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL');

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not set in environment variables.');
    }
    if (!fromEmail) {
      throw new Error('RESEND_FROM_EMAIL is not set in environment variables. This must be a verified domain in Resend.');
    }

    const { toEmail, customerName, invoiceHtml, payNowLink, invoiceId } = await req.json();

    if (!toEmail || !invoiceHtml || !invoiceId) {
      return new Response(JSON.stringify({ error: 'Missing required parameters: toEmail, invoiceHtml, invoiceId' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const resend = new Resend(resendApiKey);

    const { data, error } = await resend.emails.send({
      from: `Xpress Diesel Repair <${fromEmail}>`,
      to: [toEmail],
      subject: `Your Invoice from Xpress Diesel Repair - #${invoiceId}`,
      html: invoiceHtml,
      text: `Your invoice from Xpress Diesel Repair is attached. Invoice ID: ${invoiceId}. Total: $${invoiceHtml.match(/Total: \$([\d,]+\.\d{2})/)?.[1] || 'N/A'}. Pay now: ${payNowLink || 'N/A'}`,
    });

    if (error) {
      console.error('Resend email error:', JSON.stringify(error, null, 2));
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
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