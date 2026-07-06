"use client";

import { useEffect } from "react";
import * as gtag from "@/shared/lib/gtag";
import { EntityType } from "../../domain";
import { logEventAction } from "../actions";

// Named distinctly from the existing, unrelated
// shared/components/layout/user/track-product-view.tsx (a client-only
// "recently viewed" localStorage widget) — this hook is server-side
// analytics, that one is a personalization feature. Neither should be
// mistaken for the other.
export function useTrackView(entityType: EntityType, entityId: string, entityName?: string) {
  useEffect(() => {
    void logEventAction({
      name: "view_item",
      entityType,
      entityId,
      pagePath: window.location.pathname,
    });
    // GA4's own recommended event — fired in parallel with our own
    // pipeline above, not instead of it. No-ops if GA isn't configured.
    gtag.event("view_item", {
      items: [{ item_id: entityId, item_name: entityName, item_category: entityType }],
    });
    // Fires once per (entityType, entityId) mount — a route change to a
    // different product/project/service remounts this with new values.
  }, [entityType, entityId, entityName]);
}
