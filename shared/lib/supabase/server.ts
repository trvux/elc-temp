import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/database.types";
import { createStaticClient } from "./static";
import { cache } from "react";
import { AsyncLocalStorage } from "node:async_hooks";

const staticClientStorage = new AsyncLocalStorage<{ isStatic: boolean }>();

export const getUseStaticClient = cache(() => ({ value: false }));

export const setUseStaticClient = (value: boolean) => {
  try {
    getUseStaticClient().value = value;
  } catch {
    // Ignore cache access outside of React render phase
  }
  if (value) {
    staticClientStorage.enterWith({ isStatic: true });
  }
};

export const createClient = async () => {
  const store = staticClientStorage.getStore();
  if (store?.isStatic || getUseStaticClient().value) {
    return createStaticClient();
  }
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
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
  } catch {
    // If cookies() throws (e.g. during generateStaticParams),
    // return a cookie-free client.
    return createStaticClient();
  }
};
