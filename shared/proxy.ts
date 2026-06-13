import { updateSession } from "@/shared/lib/supabase/session";
import { type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // --- Auth & Session Management ---
  // Chạy updateSession cho tất cả để đảm bảo auth cookie luôn mới
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
