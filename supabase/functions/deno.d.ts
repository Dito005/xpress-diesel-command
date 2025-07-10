declare module 'https://deno.land/std@0.190.0/http/server.ts' {
  export function serve(handler: (req: Request) => Promise<Response>): void;
}

declare module 'https://esm.sh/@supabase/supabase-js@2.45.0' {
  export * from '@supabase/supabase-js';
}

declare module 'https://esm.sh/openai@4.52.7' {
  export * from 'openai';
}

declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};