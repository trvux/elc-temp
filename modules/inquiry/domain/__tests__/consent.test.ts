import { describe, expect, it } from "vitest";

import { buildConsentQualify, FORM_CONSENT_VERSION, PRIVACY_POLICY_PATH } from "../consent";
import { decodeQualifyValue, QUALIFY_STEP_LABELS } from "../qualify-options";

describe("form consent", () => {
  it("records how consent was given and which wording the visitor saw", () => {
    expect(buildConsentQualify()).toEqual({ consent: "form-submit", consentPolicyVersion: FORM_CONSENT_VERSION });
  });

  it("uses a dated version so a lead can be tied to the policy text of the day", () => {
    expect(FORM_CONSENT_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("points at the real policy page", () => {
    expect(PRIVACY_POLICY_PATH).toBe("/chinh-sach-thu-thap-va-xu-ly-du-lieu-ca-nhan");
  });

  it("is readable in the admin: both keys have a label and the code reads as words", () => {
    for (const key of Object.keys(buildConsentQualify())) expect(QUALIFY_STEP_LABELS[key]).toBeTruthy();
    expect(decodeQualifyValue("consent", "form-submit")).toBe("Bấm gửi form tư vấn");
  });
});
