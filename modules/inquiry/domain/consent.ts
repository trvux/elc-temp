// What the visitor is told, and what is kept as proof, when they send the lead form.
//
// The data protection law wants consent given before data is collected, for a stated purpose,
// and wants the controller to be able to prove it (silence is not consent). The form does not
// make the visitor tick a box: one line under the last field says what the details are used
// for and links the policy, and sending the form is the act of agreeing. What is stored with
// the lead is which wording that was, so a dispute can be answered; the moment is the lead's
// own created_at.

export const PRIVACY_POLICY_PATH = "/chinh-sach-thu-thap-va-xu-ly-du-lieu-ca-nhan";

/**
 * Identifies the wording shown at submit. Change it whenever the sentence in ConsentNotice or
 * the purposes in the policy change, so each lead records the version it was shown.
 */
export const FORM_CONSENT_VERSION = "2026-11-06";

/** qualify_data entries that record the consent given by sending the form. */
export function buildConsentQualify(): Record<string, string> {
  return { consent: "form-submit", consentPolicyVersion: FORM_CONSENT_VERSION };
}
