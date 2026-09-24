// Shared by every module whose title/name field renders as the page's H1
// with a left/center/right alignment choice (news, project, page, service,
// product, branch) — mirrors elc-go's internal/platform/titlealign package,
// the backend-side extraction of the same enum for the same reason.
export type TitleAlign = "left" | "center" | "right";

const TITLE_ALIGN_VALUES: readonly TitleAlign[] = ["left", "center", "right"];

// normalizeTitleAlign guards against an unexpected/invalid value reaching
// the UI as a raw string from the Go API response — defaults to "left",
// matching the backend's own default.
export function normalizeTitleAlign(value: string): TitleAlign {
  return (TITLE_ALIGN_VALUES as readonly string[]).includes(value)
    ? (value as TitleAlign)
    : "left";
}
