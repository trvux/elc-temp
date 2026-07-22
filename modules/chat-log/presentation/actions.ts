"use server";

import { authHeaders } from "@/shared/lib/go-api";
import { ChatLogEntry, ChatLogFilter } from "../domain";

const GO_API_URL = process.env.GO_API_URL;

interface GoChatLogResponse {
  id: string;
  visitor_id: string;
  message: string;
  kind: string;
  created_at: string;
}

interface GoErrorResponse {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

function mapGoChatLog(row: GoChatLogResponse): ChatLogEntry {
  return {
    id: row.id,
    visitorId: row.visitor_id,
    message: row.message,
    kind: row.kind as ChatLogEntry["kind"],
    createdAt: row.created_at,
  };
}

async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as GoErrorResponse;
    return body.message || `Go API error (${res.status})`;
  } catch {
    return `Go API error (${res.status})`;
  }
}

// Admin-only — see elc-go internal/chat-log/presentation/routes.go
// (RequireAuth + CanWriteContent, same gate inquiry's admin endpoints use).
// The write side (logging a message) never goes through this actions.ts at
// all — that's the public BFF at app/api/chat-logs/route.ts, called
// directly from ProductChatFinder.tsx's client-side logChatMessage.
export async function getChatLogsAction(filter?: ChatLogFilter) {
  if (!GO_API_URL) {
    return { data: [] as ChatLogEntry[], error: null };
  }
  try {
    const params = new URLSearchParams();
    if (filter?.kind) params.set("kind", filter.kind);
    if (filter?.search) params.set("search", filter.search);
    if (filter?.limit) params.set("limit", String(filter.limit));
    if (filter?.offset) params.set("offset", String(filter.offset));

    const res = await fetch(`${GO_API_URL}/chat-logs?${params.toString()}`, {
      headers: await authHeaders(),
      cache: "no-store",
    });
    if (!res.ok) {
      return { data: [], error: await extractErrorMessage(res) };
    }

    const rows = (await res.json()) as GoChatLogResponse[] | null;
    return { data: (rows ?? []).map(mapGoChatLog), error: null };
  } catch (error) {
    console.error("getChatLogsAction error:", error);
    return { data: [], error: "Failed to fetch chat logs" };
  }
}

export async function countChatLogsAction(filter?: ChatLogFilter) {
  if (!GO_API_URL) {
    return { data: 0, error: null };
  }
  try {
    const params = new URLSearchParams();
    if (filter?.kind) params.set("kind", filter.kind);
    if (filter?.search) params.set("search", filter.search);

    const res = await fetch(`${GO_API_URL}/chat-logs/count?${params.toString()}`, {
      headers: await authHeaders(),
      cache: "no-store",
    });
    if (!res.ok) {
      return { data: 0, error: await extractErrorMessage(res) };
    }

    const body = (await res.json()) as { count: number };
    return { data: body.count, error: null };
  } catch (error) {
    console.error("countChatLogsAction error:", error);
    return { data: 0, error: "Failed to count chat logs" };
  }
}
