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
    const { vin } = await req.json();

    if (!vin || vin.length !== 17) {
      return new Response(JSON.stringify({ error: 'A valid 17-character VIN is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // --- Simulated VIN lookup for demonstration ---
    // In a real application, you would integrate with a third-party VIN decoding API here.
    // Example: NHTSA vPIC API (https://vpic.nhtsa.dot.gov/api/)
    
    await new Promise(res => setTimeout(res, 1000)); // Simulate network delay

    const mockData: { [key: string]: any } = {
      "1A9B8C7D6E5F4G3H2": {
        make: "Freightliner",
        model: "Cascadia",
        year: "2022",
      },
      "2A8B7C6D5E4F3G2H1": {
        make: "Peterbilt",
        model: "579",
        year: "2021",
      },
      "3A7B6C5D4E3F2G1H9": {
        make: "Kenworth",
        model: "T680",
        year: "2023",
      },
      "4A6B5C4D3E2F1G9H8": {
        make: "Volvo",
        model: "VNL 860",
        year: "2020",
      }
    };

    const vehicleInfo = mockData[vin.toUpperCase()];

    if (vehicleInfo) {
      return new Response(JSON.stringify(vehicleInfo), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      return new Response(JSON.stringify({ error: "VIN not found in mock data. Please enter details manually." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

  } catch (error) {
    console.error('VIN lookup failed:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});