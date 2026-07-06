"use client";

import { EntityType } from "../../domain";
import { useTrackView } from "../hooks/useTrackView";

// Renders nothing — exists purely so the async Server Component
// product/project/service detail pages can trigger useTrackView (hooks only
// run in Client Components), the same way TrackProductView (an unrelated,
// pre-existing "recently viewed" widget) is embedded today.
export function TrackView({
  entityType,
  entityId,
  entityName,
}: {
  entityType: EntityType;
  entityId: string;
  entityName?: string;
}) {
  useTrackView(entityType, entityId, entityName);
  return null;
}
