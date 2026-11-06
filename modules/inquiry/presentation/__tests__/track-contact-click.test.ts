import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/event", () => ({ logEventAction: vi.fn(async () => ({})) }));

import { trackContactClick } from "../track-contact-click";

type DataLayerEntry = Record<string, unknown>;

beforeEach(() => {
  (window as unknown as { dataLayer?: unknown[] }).dataLayer = [];
  Object.defineProperty(navigator, "sendBeacon", { value: vi.fn(() => true), configurable: true });
});

const pushed = (): DataLayerEntry[] => (window as unknown as { dataLayer: DataLayerEntry[] }).dataLayer;

describe("trackContactClick: service dimensions", () => {
  it("sends service_slug, service_line and cta_placement with the qualify_lead event", () => {
    trackContactClick({
      channel: "zalo",
      leadType: "service",
      entityId: "svc-1",
      entityName: "Điều hòa trung tâm VRV cho biệt thự và nhà ở",
      context: { serviceSlug: "dieu-hoa-trung-tam-vrv-cho-biet-thu-nha-o", serviceLine: "thi-cong", ctaPlacement: "detail-hero" },
    });

    const event = pushed().find((e) => e.event === "qualify_lead");
    expect(event).toMatchObject({
      event: "qualify_lead",
      channel: "zalo",
      lead_type: "service",
      service_slug: "dieu-hoa-trung-tam-vrv-cho-biet-thu-nha-o",
      service_line: "thi-cong",
      cta_placement: "detail-hero",
    });
  });

  it("leaves the service dimensions undefined for a link that is not a service call-to-action", () => {
    trackContactClick({ channel: "hotline" });

    const event = pushed().find((e) => e.event === "qualify_lead");
    expect(event).toBeDefined();
    expect(event?.service_slug).toBeUndefined();
    expect(event?.service_line).toBeUndefined();
    expect(event?.cta_placement).toBeUndefined();
  });

  it("still records the click server-side with the service id", () => {
    trackContactClick({ channel: "zalo", leadType: "service", entityId: "svc-1", entityName: "X" });

    const beacon = navigator.sendBeacon as unknown as ReturnType<typeof vi.fn>;
    expect(beacon).toHaveBeenCalledTimes(1);
    expect(beacon.mock.calls[0][0]).toBe("/api/contact-click");
  });
});
