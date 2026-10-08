import { isIP } from "node:net";
import { cookies, headers } from "next/headers";

import { ACCESS_TOKEN_COOKIE } from "@/shared/lib/auth/cookies";

/**
 * Helpers for Server Actions that call the Go backend (elc-go).
 *
 * Go's JSON tags are snake_case; our domain types are camelCase. Sending a
 * camelCase body straight through `JSON.stringify` does NOT throw — Go's
 * decoder just silently leaves the mismatched field at its zero value
 * (false / 0 / ""). Always build request bodies through `toSnakeCaseBody`
 * instead of passing a TS object directly to `JSON.stringify`.
 */
export function toSnakeCaseBody<T extends object>(input: T): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    body[snakeKey] = value;
  }
  return body;
}

/**
 * Every write route (POST/PUT/PATCH/DELETE) on the Go API now requires a
 * bearer token — see elc-go's httpserver.RequireAuth/RequirePermission,
 * wired onto every module in cmd/server/main.go. Spread this into any write
 * call's headers: `{ ...( await authHeaders()) }`. Read (GET) calls stay
 * public and don't need this.
 */
export async function authHeaders(): Promise<Record<string, string>> {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * The visitor's real IP, for Go's per-IP rate limits and the source_ip stored
 * on inquiries/reviews. nginx resolves it (Cloudflare's CF-Connecting-IP,
 * trusted only from Cloudflare's ranges) and OVERWRITES X-Forwarded-For with
 * that single address; this relays it on server-side calls to Go. Without it
 * every visitor looked like the Docker gateway to Go — one shared rate-limit
 * bucket for everyone (elc-go docs/rfc/2026-10-08-vps-observability-hardening.md, G7).
 *
 * Only a value that parses as an IP is forwarded. Returns {} outside a request
 * scope (build time, tests) and when nginx didn't set the header (local dev),
 * in which case Go falls back to the connecting peer, as before. Spread into
 * the headers of any call to a Go endpoint that rate-limits by IP.
 */
export async function clientIpHeaders(): Promise<Record<string, string>> {
  try {
    const raw = (await headers()).get("x-forwarded-for");
    const last = raw?.split(",").pop()?.trim() ?? "";
    return isIP(last) ? { "X-Forwarded-For": last } : {};
  } catch {
    return {};
  }
}

export interface SlugRegistryEntry {
  entityType: string;
  entityId: string;
}

/**
 * Resolves a public URL slug to the entity type/id it currently points to,
 * via the shared slug_registry table (enforces slug uniqueness across
 * products, projects, categories, brands, groups, project_type — no single
 * module owns it, hence living here rather than in one domain module).
 * Used by resolveProductPath/resolveProjectPath before dispatching to that
 * entity's own Go-backed action.
 */
export async function getSlugRegistryEntry(slug: string): Promise<SlugRegistryEntry | null> {
  const GO_API_URL = process.env.GO_API_URL;
  if (!GO_API_URL) return null;
  try {
    const res = await fetch(`${GO_API_URL}/slug-registry/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;

    const row = (await res.json()) as { entity_type: string; entity_id: string };
    return { entityType: row.entity_type, entityId: row.entity_id };
  } catch (error) {
    console.error("getSlugRegistryEntry error:", error);
    return null;
  }
}
