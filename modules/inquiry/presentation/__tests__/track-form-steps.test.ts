import { beforeEach, describe, expect, it } from "vitest";

import { trackFormStep, trackFormUnknown } from "../track-form-steps";

type Entry = Record<string, unknown>;
const pushed = (): Entry[] => (window as unknown as { dataLayer: Entry[] }).dataLayer;

beforeEach(() => {
  (window as unknown as { dataLayer?: unknown[] }).dataLayer = [];
});

describe("lead form step events", () => {
  it("pushes lead_form_step with the step, its place in the flow and the service", () => {
    trackFormStep({ stepId: "brief", stepIndex: 2, stepTotal: 9, branch: "service", serviceSlug: "ve-sinh", serviceLine: "dich-vu" });
    expect(pushed()).toEqual([
      {
        event: "lead_form_step",
        step_id: "brief",
        step_index: 2,
        step_total: 9,
        branch: "service",
        service_slug: "ve-sinh",
        service_line: "dich-vu",
      },
    ]);
  });

  it("pushes lead_form_unknown with the field key", () => {
    trackFormUnknown("so_phong", "ve-sinh");
    trackFormUnknown("all");
    expect(pushed()).toEqual([
      { event: "lead_form_unknown", field_key: "so_phong", service_slug: "ve-sinh" },
      { event: "lead_form_unknown", field_key: "all", service_slug: undefined },
    ]);
  });
});
