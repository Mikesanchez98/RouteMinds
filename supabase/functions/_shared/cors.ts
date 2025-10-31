// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // O 'http://localhost:5173' para más seguridad
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};