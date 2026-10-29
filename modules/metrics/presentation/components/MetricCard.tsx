import {
  ArrowsLeftRight,
  Cpu,
  Database,
  Globe,
  HardDrives,
  Hourglass,
  Memory,
  Package,
  Plugs,
  Pulse,
  Queue,
  Timer,
  WarningOctagon,
} from "@phosphor-icons/react/ssr";

import { Card } from "@/shared/components/ui/card";

import type { CardIcon, MetricCardData } from "../../domain/types";
import { StatusBadge } from "./StatusBadge";

const ICONS: Record<CardIcon, typeof Pulse> = {
  api: Plugs,
  traffic: Pulse,
  errors: WarningOctagon,
  speed: Timer,
  slow: Hourglass,
  payload: Package,
  database: Database,
  dbwait: Queue,
  memory: Memory,
  swap: ArrowsLeftRight,
  disk: HardDrives,
  cpu: Cpu,
  web: Globe,
};

// One measurement. Reading order for a screen reader is the visual order:
// name, value, status, what it means, extra detail. The title is the heading
// so a reader can jump card to card.
export function MetricCard({ card }: { card: MetricCardData }) {
  const Icon = ICONS[card.icon];
  const titleId = `metric-${card.id}`;
  return (
    <Card className="h-full gap-3 p-4 shadow-sm" size="sm">
      <div className="flex items-start justify-between gap-2 px-0">
        <h3 id={titleId} className="flex items-center gap-2 type-label text-muted-foreground">
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          {card.title}
        </h3>
        <StatusBadge status={card.status} />
      </div>
      <p className="type-headline tabular-nums">
        {card.value}
      </p>
      <p className="type-body-sm text-muted-foreground">{card.description}</p>
      {card.detail && <p className="type-body-sm">{card.detail}</p>}
    </Card>
  );
}
