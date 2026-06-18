import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRole) {
    throw new Error("Missing Supabase admin environment variables.");
  }

  return createClient(supabaseUrl, supabaseServiceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
