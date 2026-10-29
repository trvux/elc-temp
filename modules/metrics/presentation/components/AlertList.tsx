import type { ActiveAlert } from "../../domain/types";

const SEVERITY_LABEL: Record<ActiveAlert["severity"], string> = {
  critical: "Nghiêm trọng",
  warning: "Cảnh báo",
  info: "Thông tin",
  unknown: "Chưa phân loại",
};

export function AlertList({ alerts, reachable }: { alerts: ActiveAlert[]; reachable: boolean }) {
  return (
    <section aria-labelledby="alerts-heading" className="flex flex-col gap-3">
      <div>
        <h2 id="alerts-heading" className="type-heading">
          Cảnh báo đang hoạt động
        </h2>
        <p className="type-body-sm text-muted-foreground">Các luật tự động của hệ thống giám sát đang báo vấn đề.</p>
      </div>
      {!reachable ? (
        // "No alerts" would be a false reassurance when we simply couldn't ask.
        <p className="rounded-lg border bg-card p-4 type-body-sm">Không lấy được thông tin cảnh báo vì hệ thống giám sát không phản hồi.</p>
      ) : alerts.length === 0 ? (
        <p className="rounded-lg border bg-card p-4 type-body-sm">Hiện không có cảnh báo nào.</p>
      ) : (
        <ul role="list" className="flex flex-col gap-2">
          {alerts.map((a) => (
            <li key={a.name} className="rounded-lg border bg-card p-4">
              <p className="font-semibold">
                {a.title} <span className="ml-1 type-tag text-muted-foreground">({SEVERITY_LABEL[a.severity]})</span>
              </p>
              <p className="type-body-sm text-muted-foreground">{a.hint}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
