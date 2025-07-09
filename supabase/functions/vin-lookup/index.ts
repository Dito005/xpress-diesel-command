// @ts-ignore
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0' // Changed version to 2.43.0

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vin } = await req.json();

    if (!vin) {
      return new Response(JSON.stringify({ error: 'VIN is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // NHTSA API for VIN decoding
    const nhtsaApiUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinExtended/${vin}?format=json`;
    const response = await fetch(nhtsaApiUrl);
    const data = await response.json();

    if (!response.ok || data.Results.length === 0 || data.Results[0].ErrorCode !== '0') {
      const errorMessage = data.Results[0]?.Message || 'Failed to decode VIN.';
      return new Response(JSON.stringify({ error: errorMessage }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const results = data.Results;
    const make = results.find((r: any) => r.Variable === 'Make')?.Value || 'N/A';
    const model = results.find((r: any) => r.Variable === 'Model')?.Value || 'N/A';
    const year = results.find((r: any) => r.Variable === 'Model Year')?.Value || 'N/A';

    return new Response(JSON.stringify({ make, model, year }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('VIN lookup failed:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});