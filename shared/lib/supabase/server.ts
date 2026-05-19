import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/database.types";
import { createStaticClient } from "./static";

export const createClient = async () => {
  try {
    const cookieStore = await cookies();

    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              const isDev = process.env.NODE_ENV === "development";
              cookiesToSet.forEach(({ name, value, options }) => {
                const updatedOptions = isDev ? { ...options, secure: false } : options;
                cookieStore.set(name, value, updatedOptions);
              });
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      },
    );
  } catch (error) {
    // If cookies() throws (e.g. during generateStaticParams),
    // return a cookie-free client.
    return createStaticClient();
  }
};
