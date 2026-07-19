"use client";

import { useRecentlyViewed } from "@/shared/hooks/use-recently-viewed";
import { useEffect } from "react";

interface TrackProductViewProps {
  productId: string;
}

// Fire-and-forget: records this view against the real /recently-viewed API
// (anonymous visitor_id cookie). No display fields needed here anymore —
// the list re-fetches its own product summaries from the server.
export function TrackProductView({ productId }: TrackProductViewProps) {
  const { trackView } = useRecentlyViewed();

  useEffect(() => {
    trackView(productId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  return null;
}
