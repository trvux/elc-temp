import type { MetricsSnapshot, Status } from "../../domain/types";
import { StatusBadge } from "./StatusBadge";

const BORDER: Record<Status, string> = {
  ok: "border-green-700/40 bg-green-50/60 dark:border-green-400/40 dark:bg-green-950/30",
  warn: "border-amber-700/40 bg-amber-50/60 dark:border-amber-400/40 dark:bg-amber-950/30",
  bad: "border-red-700/40 bg-red-50/60 dark:border-red-400/40 dark:bg-red-950/30",
  info: "border-border bg-muted/40",
  unknown: "border-border bg-muted/40",
};

// The one thing a manager needs: is everything fine? role="status" makes it a
// polite live region, so when the page refreshes itself and the answer
// changes, a screen reader announces the new headline without being focused.
export function StatusBanner({ overall }: { overall: MetricsSnapshot["overall"] }) {
  return (
    <section aria-labelledby="overall-heading" className={`rounded-xl border-2 p-5 ${BORDER[overall.status]}`}>
      <h2 id="overall-heading" className="sr-only">
        Tình trạng chung
      </h2>
      <div role="status" className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <p className="type-title">{overall.headline}</p>
          <StatusBadge status={overall.status} />
        </div>
        <p className="type-body-sm text-muted-foreground">{overall.detail}</p>
      </div>
    </section>
  );
}
