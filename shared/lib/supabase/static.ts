import { createClient } from "@supabase/supabase-js";
import { Database } from "@/database.types";

/**
 * Cookie-free Supabase client for use in generateStaticParams / build-time code.
 * Do NOT use this in route handlers or Server Components that need auth context.
 */
export function createStaticClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}

