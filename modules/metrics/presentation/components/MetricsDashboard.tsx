import { formatClock } from "../../domain/format";
import { RANGES, type MetricsSnapshot } from "../../domain/types";
import { AlertList } from "./AlertList";
import { AutoRefresh } from "./AutoRefresh";
import { MetricCard } from "./MetricCard";
import { RangeNav } from "./RangeNav";
import { StatusBanner } from "./StatusBanner";
import { TrendChart } from "./TrendChart";

// Server component: all numbers arrive already formatted in the snapshot, so
// the page is complete HTML before any JavaScript loads. Only the charts and
// the refresh controls are client components.
export function MetricsDashboard({ snapshot }: { snapshot: MetricsSnapshot }) {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div>
          <h1 className="type-title">Tình trạng hệ thống</h1>
          <p className="type-body-sm text-muted-foreground">
            Website và máy chủ đang hoạt động ra sao. Trang này chỉ để xem, không thay đổi được gì.
          </p>
        </div>
        <AutoRefresh updatedAtIso={new Date(snapshot.generatedAt).toISOString()} updatedAtLabel={formatClock(snapshot.generatedAt)} />
      </header>

      <StatusBanner overall={snapshot.overall} />
      <AlertList alerts={snapshot.alerts} reachable={snapshot.reachable} />

      {snapshot.sections.map((section) => (
        <section key={section.id} aria-labelledby={`section-${section.id}`} className="flex flex-col gap-3">
          <div>
            <h2 id={`section-${section.id}`} className="type-heading">
              {section.title}
            </h2>
            <p className="type-body-sm text-muted-foreground">{section.description}</p>
          </div>
          <ul role="list" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {section.cards.map((card) => (
              <li key={card.id}>
                <MetricCard card={card} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section aria-labelledby="charts-heading" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="charts-heading" className="type-heading">
              Biểu đồ trong {RANGES[snapshot.range].label} qua
            </h2>
            <p className="type-body-sm text-muted-foreground">Mỗi biểu đồ có thể xem dạng bảng ở phía dưới.</p>
          </div>
          <RangeNav current={snapshot.range} />
        </div>
        {snapshot.charts.length === 0 ? (
          <p className="rounded-lg border bg-card p-4 type-body-sm">Chưa có đủ số liệu để vẽ biểu đồ trong khoảng thời gian này.</p>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {snapshot.charts.map((chart) => (
              <TrendChart key={chart.id} chart={chart} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
