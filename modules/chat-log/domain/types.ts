// Mirrors elc-go's internal/chat-log/domain ChatLogKind* whitelist exactly —
// every value the AI chat finder (ProductChatFinder.tsx) can log a message
// under.
export type ChatLogKind =
  | "search"
  | "compare"
  | "rank"
  | "off_topic"
  | "purchase_intent"
  | "no_context_compare";

// One message a shopper typed into the AI chat finder — the raw text
// itself is the data point (real pain points/purchase intent in their own
// words), Kind records which internal path answered it. See
// elc-go/internal/chat-log/domain/types.go.
export interface ChatLogEntry {
  id: string;
  visitorId: string;
  message: string;
  kind: ChatLogKind;
  createdAt: string;
}

export interface ChatLogFilter {
  kind?: string;
  search?: string;
  limit?: number;
  offset?: number;
}
