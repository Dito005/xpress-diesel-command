// Change this line:
const openai = new OpenAI({
  apiKey: settings.ai_api_key,
  baseURL: settings.ai_base_url || 'https://api.openai.com/v1'
});

// To this:
const openai = new OpenAI({
  apiKey: settings.ai_api_key,
  baseURL: settings.ai_base_url || undefined // Let SDK use default
});