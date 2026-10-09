import type { Status } from "./types";

// Thresholds are the same numbers the Prometheus alert rules use
// (elc-go monitoring/prometheus/alerts.yml), so the page and the alerts never
// disagree about what "bad" means.

// For measurements where a bigger number is worse (error share, latency, RAM used).
export function higherIsWorse(value: number | null, limits: { warn: number; bad: number }): Status {
  if (value === null || Number.isNaN(value)) return "unknown";
  if (value >= limits.bad) return "bad";
  if (value >= limits.warn) return "warn";
  return "ok";
}

// For measurements where a smaller number is worse (free RAM, free disk).
export function lowerIsWorse(value: number | null, limits: { warn: number; bad: number }): Status {
  if (value === null || Number.isNaN(value)) return "unknown";
  if (value <= limits.bad) return "bad";
  if (value <= limits.warn) return "warn";
  return "ok";
}

export const STATUS_LABEL: Record<Status, string> = {
  ok: "Tốt",
  warn: "Cần chú ý",
  bad: "Cần xử lý",
  info: "Thông tin",
  unknown: "Chưa có dữ liệu",
};

const SEVERITY_ORDER: Status[] = ["ok", "warn", "bad"];

// The worst health verdict among cards. Informational and unknown cards don't
// vote; "unknown" is returned only when no card gave a verdict at all.
export function worstStatus(statuses: Status[]): Status {
  const known = statuses.filter((s) => s === "ok" || s === "warn" || s === "bad");
  if (known.length === 0) return "unknown";
  return known.reduce((worst, s) => (SEVERITY_ORDER.indexOf(s) > SEVERITY_ORDER.indexOf(worst) ? s : worst));
}
