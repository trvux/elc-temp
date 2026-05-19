import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "@/database.types";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          const isDev = process.env.NODE_ENV === "development";
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            const updatedOptions = isDev ? { ...options, secure: false } : options;
            supabaseResponse.cookies.set(name, value, updatedOptions);
          });
        },
      },
    },
  );

  // IMPORTANT: You must call getUser() to refresh the session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Basic Auth Guard example for /admin
  if (
    request.nextUrl.pathname.startsWith("/admin") &&
    request.nextUrl.pathname !== "/admin/login" &&
    !user
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
