import Link from "next/link";

import { RANGES, RANGE_ORDER, type MetricsRange } from "../../domain/types";

// Plain links, not client-side state: the range is in the URL (?range=24h), so
// it works without JavaScript, can be bookmarked, and the current choice is
// announced via aria-current. Each target is at least 44px tall (WCAG 2.5.8).
export function RangeNav({ current }: { current: MetricsRange }) {
  return (
    <nav aria-label="Khoảng thời gian của biểu đồ">
      <ul role="list" className="flex flex-wrap gap-2">
        {RANGE_ORDER.map((key) => {
          const active = key === current;
          return (
            <li key={key}>
              <Link
                href={`/admin/metrics?range=${key}`}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border px-4 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 ${
                  active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                }`}
              >
                {RANGES[key].label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
