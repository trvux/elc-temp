// Mirrors elc-go's internal/event/domain.EventName — a fixed, typed
// taxonomy modeled on Google Analytics 4's recommended events (verb_noun),
// not arbitrary strings. See elc-go's migration doc comment for why that
// distinction matters (the previous implementation drifted into
// meaningless names like `scroll_50`).
type EventName = "view_item" | "generate_lead";

export type EntityType = "product" | "project" | "service";

export interface CreateEventInput {
  name: EventName;
  entityType?: EntityType;
  entityId?: string;
  pagePath?: string;
}
