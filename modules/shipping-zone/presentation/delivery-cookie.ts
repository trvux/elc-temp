"use server";

import { cookies } from "next/headers";
import { DELIVERY_PROVINCE_COOKIE, DELIVERY_WARD_COOKIE } from "./delivery-cookie-name";

// Marked "use server" (even though it never calls the Go API) because
// `next/headers` itself cannot be imported into any file that might end up
// bundled for the client — and ProductGrid.tsx, which calls this, is
// imported directly by a few "use client" components (e.g.
// shared/components/organisms/layout/user/category-sections-grid.tsx). A "use
// server" export compiles down to a callable RPC reference in the client
// bundle instead of inlining next/headers, which fixes that.
export async function getSavedProvinceCode(): Promise<string | null> {
  const value = (await cookies()).get(DELIVERY_PROVINCE_COOKIE)?.value;
  return value || null;
}

export async function getSavedWardCode(): Promise<string | null> {
  const value = (await cookies()).get(DELIVERY_WARD_COOKIE)?.value;
  return value || null;
}
