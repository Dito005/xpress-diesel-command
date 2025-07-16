import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://yrixrsthjntarzcyiryg.supabase.co"
// The anon key was incomplete in the prompt, using the full key from previous context.
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyaXhyc3Roam50YXJ6Y3lpcnlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMjM3MTgsImV4cCI6MjA2NzU5OTcxOH0.YGflIBoKEf8nDK6WJwwcZxItwWg2iVA81mtzASH2UNE"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)