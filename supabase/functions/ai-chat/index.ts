// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
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
    const { prompt, history, sessionId, userId } = await req.json();

    if (!prompt || !sessionId || !userId) {
      return new Response(JSON.stringify({ error: 'Missing required parameters: prompt, sessionId, userId' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Fetch AI settings
    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from('settings')
      .select('key, value');
    if (settingsError) throw settingsError;
    const settings = settingsData.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});

    // 2. Check if AI is enabled
    if (settings.ai_enabled !== 'true') {
      return new Response(JSON.stringify({ text: "The AI assistant is currently disabled by the administrator." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 3. Log user prompt
    await supabaseAdmin.from('ai_chat_logs').insert({
      user_id: userId,
      session_id: sessionId,
      role: 'user',
      prompt: prompt,
    });

    // 4. Fetch system prompt
    const { data: promptTemplate } = await supabaseAdmin
      .from('ai_prompt_templates')
      .select('content')
      .eq('name', 'default_system_prompt')
      .single();

    // --- MOCK AI RESPONSE ---
    // This section would contain the logic to call an external AI provider (OpenAI, Gemini, etc.)
    // For now, it returns a mock response to demonstrate the functionality.
    let mockResponse = {
      text: `I have received your message: "${prompt}". As a mock assistant, I cannot fully process this, but I can demonstrate actions.`,
      action: null,
    };

    if (prompt.toLowerCase().includes('create a job')) {
      mockResponse = {
        text: "It looks like you want to create a job. I've extracted some details. Please confirm if this is correct before I proceed.",
        action: {
          command: 'create_job_by_ai',
          params: {
            _customer_name: 'AI Customer',
            _vin: 'VIN1234567890AI',
            _job_type: 'Diagnostic',
            _priority: 'medium',
            _location: 'Shop',
            _notes: 'Job created via AI Assistant.',
          },
          confirmationMessage: 'Do you want to create a new Diagnostic job for AI Customer with VIN ending in 90AI?',
        },
      };
    }
    // --- END MOCK AI RESPONSE ---

    // 5. Log AI response
    await supabaseAdmin.from('ai_chat_logs').insert({
      user_id: userId,
      session_id: sessionId,
      role: 'assistant',
      response: mockResponse,
    });

    // 6. Return response to frontend
    return new Response(JSON.stringify(mockResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('AI Chat Function Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});