// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { usdot } = await req.json();

    if (!usdot) {
      return new Response(JSON.stringify({ error: 'USDOT number is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // --- Simulated USDOT lookup for demonstration ---
    // In a real application, you would integrate with a third-party USDOT API here.
    // Example: FMCSA SAFER system API (requires registration/API key)
    // For this MVP, we'll use a simple mock.

    await new Promise(res => setTimeout(res, 1000)); // Simulate network delay

    if (usdot === "1234567") {
      return new Response(JSON.stringify({
        companyName: "Acme Trucking Inc.",
        companyPhone: "(800) 555-1234",
        companyAddress: "456 Trucker Blvd, Big City, TX 75001",
        mcNumber: "MC-987654",
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      return new Response(JSON.stringify({ error: "USDOT number not found or invalid." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

  } catch (error) {
    console.error('USDOT lookup failed:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});