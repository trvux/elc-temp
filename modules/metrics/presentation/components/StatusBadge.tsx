import { CheckCircle, Info, Question, WarningCircle, XCircle } from "@phosphor-icons/react/ssr";

import { STATUS_LABEL } from "../../domain/status";
import type { Status } from "../../domain/types";

// Colour is never the only signal: every status also has an icon AND a text
// label (WCAG 1.4.1 Use of Color). The icon is decorative for screen readers
// because the text already says it.
const STYLES: Record<Status, string> = {
  ok: "bg-green-50 text-green-800 ring-green-700/30 dark:bg-green-950/50 dark:text-green-300 dark:ring-green-400/30",
  warn: "bg-amber-50 text-amber-900 ring-amber-700/30 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-400/30",
  bad: "bg-red-50 text-red-800 ring-red-700/30 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-400/30",
  info: "bg-sky-50 text-sky-900 ring-sky-700/30 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-400/30",
  unknown: "bg-muted text-muted-foreground ring-foreground/20",
};

const ICONS = { ok: CheckCircle, warn: WarningCircle, bad: XCircle, info: Info, unknown: Question } as const;

export function StatusBadge({ status }: { status: Status }) {
  const Icon = ICONS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 type-tag ring-1 ring-inset ${STYLES[status]}`}>
      <Icon weight="fill" className="size-4 shrink-0" aria-hidden="true" />
      <span className="sr-only">Trạng thái: </span>
      {STATUS_LABEL[status]}
    </span>
  );
}
