// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import OpenAI from 'https://esm.sh/openai@4.52.7';

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
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
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
      .select('key, value')
      .in('key', ['ai_enabled', 'ai_api_key', 'ai_model']);
      
    if (settingsError) throw settingsError;
    
    const settings = settingsData.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});

    if (settings.ai_enabled !== 'true') {
      return new Response(JSON.stringify({ text: "The AI assistant is currently disabled." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (!settings.ai_api_key) {
      return new Response(JSON.stringify({ text: "The AI assistant is not configured. Please add an API key in the settings." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 2. Initialize AI Client
    const openai = new OpenAI({ apiKey: settings.ai_api_key });

    // 3. Fetch System Prompt
    const { data: promptTemplate } = await supabaseAdmin
      .from('ai_prompt_templates')
      .select('content')
      .eq('name', 'default_system_prompt')
      .single();

    const systemPrompt = promptTemplate?.content || "You are a helpful assistant for a diesel mechanic shop.";

    // 4. Construct message history
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-10).map((msg: any) => ({
        role: msg.type === 'ai' ? 'assistant' : 'user',
        content: msg.content,
      })),
      { role: "user", content: prompt },
    ];

    // 5. Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: settings.ai_model || "gpt-3.5-turbo",
      messages: messages,
    });

    const aiResponseText = completion.choices[0].message.content;

    const responsePayload = {
      text: aiResponseText,
      action: null, // Action detection logic can be added here later
    };

    // 6. Log and return response
    await supabaseAdmin.from('ai_chat_logs').insert({
      user_id: userId,
      session_id: sessionId,
      prompt: prompt,
      response: responsePayload,
    });

    return new Response(JSON.stringify(responsePayload), {
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