"use server";

import { cookies } from "next/headers";
import { toSnakeCaseBody } from "@/shared/lib/go-api";
import { CreateEventInput, EntityType } from "../domain";

const GO_API_URL = process.env.GO_API_URL;

// First-party anonymous session id — same role as GA4's own `_ga` client_id
// cookie (random, no PII, ~2-year lifetime), but scoped to our own event
// pipeline. httpOnly since only this Server Action ever needs to read it;
// the browser never touches it directly.
const SESSION_COOKIE = "elc_session_id";
const SESSION_MAX_AGE = 60 * 60 * 24 * 365 * 2;

async function getOrCreateSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(SESSION_COOKIE)?.value;
  if (existing) return existing;

  const id = crypto.randomUUID();
  store.set(SESSION_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return id;
}

// Public, fire-and-forget — useTrackView never awaits/checks the result, so
// failures here are swallowed rather than surfaced to the visitor.
export async function logEventAction(input: CreateEventInput): Promise<void> {
  if (!GO_API_URL) return;
  try {
    const sessionId = await getOrCreateSessionId();
    await fetch(`${GO_API_URL}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toSnakeCaseBody({ ...input, sessionId })),
    });
  } catch (error) {
    console.error("logEventAction error:", error);
  }
}

// Public GET, consistent with every other GET in this codebase (no CORS
// anywhere, only ever called server-side) — used by the admin dashboard's
// "most viewed" panel.
export async function getTopViewedAction(entityType: EntityType) {
  if (!GO_API_URL) return { data: [] as { entityId: string; count: number }[], error: null };
  try {
    const res = await fetch(`${GO_API_URL}/events/top-viewed?entity_type=${entityType}`, {
      cache: "no-store",
    });
    if (!res.ok) return { data: [], error: `Go API error (${res.status})` };

    const rows = (await res.json()) as { entity_id: string; count: number }[] | null;
    return {
      data: (rows ?? []).map((r) => ({ entityId: r.entity_id, count: r.count })),
      error: null,
    };
  } catch (error) {
    console.error("getTopViewedAction error:", error);
    return { data: [], error: "Failed to fetch top viewed" };
  }
}
