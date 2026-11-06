import * as gtag from "@/shared/lib/gtag";

// Where visitors leave the lead form, and which questions they cannot answer. Both
// events go to the GTM dataLayer like every other event here; the GA4 tags for them
// live in the GTM container (see docs/rfc-service-restructure.md, "Tracking").

export interface FormStepView {
  stepId: string;
  /** 1-based position in the steps of the chosen door. */
  stepIndex: number;
  stepTotal: number;
  /** product | service | project. */
  branch: string;
  serviceSlug?: string;
  serviceLine?: string;
}

/** Fired when a step is shown: counting these per step_id is the funnel. */
export function trackFormStep(view: FormStepView) {
  gtag.event("lead_form_step", {
    step_id: view.stepId,
    step_index: view.stepIndex,
    step_total: view.stepTotal,
    branch: view.branch,
    service_slug: view.serviceSlug,
    service_line: view.serviceLine,
  });
}

/**
 * Fired when a visitor marks a field "Chưa biết". A field that many visitors cannot
 * answer is a bad question (or one that should come after the site visit). `fieldKey`
 * is the field's stable key, or "all" for the "Chưa biết hết" shortcut.
 */
export function trackFormUnknown(fieldKey: string, serviceSlug?: string) {
  gtag.event("lead_form_unknown", { field_key: fieldKey, service_slug: serviceSlug });
}
