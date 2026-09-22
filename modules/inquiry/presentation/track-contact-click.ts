"use client";

import * as gtag from "@/shared/lib/gtag";
import { logEventAction } from "@/modules/event";
import type { ContactChannel, LeadType } from "../domain";

interface TrackContactClickInput {
  channel: ContactChannel;
  leadType?: LeadType;
  // A product/project/service id, matched to leadType — omit for a general
  // (not-on-a-catalog-entity) contact link, e.g. the header/footer.
  entityId?: string;
}

const CONTACT_CLICK_ENDPOINT = "/api/contact-click";

// Call this from the onClick of any Zalo/Messenger/Hotline contact link —
// see ContactLink.tsx (the generic case) and OrderButton/BuyNowButton/
// ProductFloatingBar/ZaloContactModal (already have their own onClick for
// the copy-message/modal flow, this just adds to it). Records the click as
// a lead server-side (see app/api/contact-click/route.ts) and fires the
// qualify_lead signal both to GA4 and our own tracking_events table.
export function trackContactClick({ channel, leadType, entityId }: TrackContactClickInput) {
  if (typeof window === "undefined") return;

  const pagePath = window.location.pathname;
  const payload = {
    channel,
    leadType,
    productId: leadType === "product" ? entityId : undefined,
    projectId: leadType === "project" ? entityId : undefined,
    serviceId: leadType === "service" ? entityId : undefined,
    pagePath,
  };

  // navigator.sendBeacon, not fetch — must survive the page navigating away
  // (tel:/zalo.me/m.me) immediately after this call, which a plain fetch
  // can abort mid-flight. A Blob with an explicit JSON type is required so
  // the browser sends the right Content-Type — a plain string body would
  // go out as text/plain, and the route's request.json() would then fail.
  const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
  navigator.sendBeacon(CONTACT_CLICK_ENDPOINT, blob);

  // GA4 side, fired in parallel — same "fire both, don't wait on either"
  // posture as useTrackView's view_item. This is the GA4 key event already
  // configured as a primary Ads conversion goal, just never fired until now
  // (see elc-go internal/event's EventQualifyLead doc comment).
  gtag.event("qualify_lead", { channel, lead_type: leadType, page_path: pagePath });

  // Also logged to our own tracking_events table for the internal
  // dashboard — fire-and-forget, same posture as every other
  // logEventAction call (including this exact tradeoff in useTrackView).
  if (leadType === "product" || leadType === "project" || leadType === "service") {
    void logEventAction({ name: "qualify_lead", entityType: leadType, entityId, pagePath });
  } else {
    void logEventAction({ name: "qualify_lead", pagePath });
  }
}
