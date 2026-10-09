import { formatBytes, formatChange, formatDuration, formatLatency, formatPerMinute, formatPercent } from "../domain/format";
import { higherIsWorse, lowerIsWorse, worstStatus } from "../domain/status";
import { INSTANT, rangeQueries } from "../domain/queries";
import {
  RANGES,
  type ActiveAlert,
  type CardSection,
  type ChartData,
  type MetricCardData,
  type MetricsRange,
  type MetricsSnapshot,
  type Status,
} from "../domain/types";
import type { PromClient, PromSample, PromSeries } from "../infrastructure/prometheus";

type InstantKey = keyof typeof INSTANT;

// What each alert means in words a non-technical reader can act on. Names match
// elc-go monitoring/prometheus/alerts.yml.
const ALERT_TEXT: Record<string, { title: string; hint: string }> = {
  HostMemoryAvailableLow: { title: "Máy chủ sắp hết bộ nhớ", hint: "Còn dưới 400 MB bộ nhớ trống. Nếu kéo dài, website có thể bị gián đoạn." },
  HostSwapHeavilyUsed: { title: "Máy chủ đang dùng nhiều bộ nhớ dự phòng", hint: "Dấu hiệu máy thiếu bộ nhớ trong thời gian dài." },
  HostDiskAlmostFull: { title: "Ổ đĩa sắp đầy", hint: "Còn dưới 15% dung lượng trống." },
  ApiHigh5xxRate: { title: "Tỉ lệ lỗi hệ thống cao", hint: "Hơn 2% yêu cầu gặp lỗi phía máy chủ." },
  ApiLatencyP95High: { title: "Hệ thống phản hồi chậm", hint: "95% yêu cầu chậm hơn 1 giây trong hơn 10 phút." },
  ApiRestarted: { title: "Hệ thống vừa khởi động lại", hint: "Thường do vừa cập nhật phiên bản mới. Tự hết sau 15 phút." },
  DbPoolSaturated: { title: "Cơ sở dữ liệu bị nghẽn kết nối", hint: "Nhiều yêu cầu phải xếp hàng chờ kết nối đến cơ sở dữ liệu." },
  NextServerMemoryHigh: { title: "Website dùng nhiều bộ nhớ", hint: "Phần giao diện website đang chiếm trên 1,8 GB bộ nhớ." },
  ScrapeTargetDown: { title: "Một thành phần giám sát không phản hồi", hint: "Một số liệu đang không được thu thập." },
};

async function settled<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}

function first(samples: PromSample[] | null): number | null {
  return samples && samples.length > 0 ? samples[0].value : null;
}

function firstWithLabel(samples: PromSample[] | null, label: string): { value: number; label: string } | null {
  const s = samples?.[0];
  return s && s.value !== null ? { value: s.value, label: s.metric[label] ?? "" } : null;
}

const NO_DATA = "Chưa có dữ liệu";

export async function getMetricsSnapshot(client: PromClient, range: MetricsRange, now: number = Date.now()): Promise<MetricsSnapshot> {
  const config = RANGES[range];
  const endSec = Math.floor(now / 1000);
  const startSec = endSec - config.seconds;
  const rq = rangeQueries(config.rateWindow);

  // One round trip each, all in parallel; a failed query becomes null so one
  // missing metric blanks one card instead of the whole page.
  const instantKeys = Object.keys(INSTANT) as InstantKey[];
  const instantResults = await Promise.all(instantKeys.map((k) => settled(client.instant(INSTANT[k]))));
  const q = Object.fromEntries(instantKeys.map((k, i) => [k, instantResults[i]])) as Record<InstantKey, PromSample[] | null>;
  const reachable = instantResults.some((r) => r !== null);

  const rangeKeys = Object.keys(rq) as Array<keyof typeof rq>;
  const rangeResults = await Promise.all(rangeKeys.map((k) => settled(client.range(rq[k], startSec, endSec, config.stepSeconds))));
  const r = Object.fromEntries(rangeKeys.map((k, i) => [k, rangeResults[i]])) as Record<keyof typeof rq, PromSeries[] | null>;

  // ---- cards -------------------------------------------------------------
  const apiUp = first(q.apiUp);
  const uptime = first(q.apiUptime);
  const apiCard: MetricCardData = {
    id: "api",
    title: "Hệ thống phía sau website",
    value: apiUp === null ? NO_DATA : apiUp === 1 ? "Đang hoạt động" : "Ngừng hoạt động",
    description: "Phần xử lý dữ liệu sản phẩm, tin tức, liên hệ cho website.",
    detail: uptime === null ? undefined : `Chạy liên tục ${formatDuration(uptime)} kể từ lần khởi động gần nhất.`,
    status: apiUp === null ? "unknown" : apiUp === 1 ? "ok" : "bad",
    icon: "api",
  };

  const perSecond = first(q.requestsPerSecond);
  const yesterday = first(q.requestsPerSecondYesterday);
  const change = perSecond !== null ? formatChange(perSecond, yesterday) : null;
  const trafficCard: MetricCardData = {
    id: "traffic",
    title: "Mức độ hoạt động",
    value: perSecond === null ? NO_DATA : formatPerMinute(perSecond),
    description: "Số yêu cầu hệ thống xử lý mỗi phút. Một lượt xem trang có thể tạo ra nhiều yêu cầu, nên đây không phải số khách truy cập.",
    detail: change ? `So với cùng giờ hôm qua: ${change}.` : "Chưa đủ dữ liệu để so với hôm qua.",
    status: perSecond === null ? "unknown" : "info",
    icon: "traffic",
  };

  const errorShare = first(q.errorShare);
  const errorCard: MetricCardData = {
    id: "errors",
    title: "Tỉ lệ lỗi",
    value: errorShare === null ? "Chưa có yêu cầu" : formatPercent(errorShare),
    description: "Phần trăm yêu cầu gặp lỗi phía máy chủ trong 15 phút qua. Dưới 1% là bình thường.",
    status: higherIsWorse(errorShare, { warn: 0.01, bad: 0.02 }),
    icon: "errors",
  };

  const p95 = first(q.latencyP95);
  const p50 = first(q.latencyP50);
  const speedCard: MetricCardData = {
    id: "speed",
    title: "Tốc độ phản hồi",
    value: p95 === null ? NO_DATA : formatLatency(p95),
    description: "95% yêu cầu được trả lời nhanh hơn mức này (15 phút qua). Dưới 0,5 giây là tốt.",
    detail: p50 === null ? undefined : `Yêu cầu thông thường được trả lời trong khoảng ${formatLatency(p50)}.`,
    status: higherIsWorse(p95, { warn: 0.5, bad: 1 }),
    icon: "speed",
  };

  const slowest = firstWithLabel(q.slowestRoute, "route");
  const slowCard: MetricCardData = {
    id: "slowest",
    title: "Chức năng chậm nhất",
    value: slowest ? formatLatency(slowest.value) : NO_DATA,
    description: "Chức năng có thời gian phản hồi (mức 95%) cao nhất trong 15 phút qua.",
    detail: slowest ? `Đường dẫn: ${slowest.label}` : undefined,
    status: higherIsWorse(slowest?.value ?? null, { warn: 0.5, bad: 1 }),
    icon: "slow",
  };

  const biggest = firstWithLabel(q.largestResponse, "route");
  const payloadCard: MetricCardData = {
    id: "payload",
    title: "Dữ liệu trả về nặng nhất",
    value: biggest ? formatBytes(biggest.value) : NO_DATA,
    description: "Kích thước một lần trả dữ liệu lớn nhất (mức 95%, 1 giờ qua). Càng nặng càng tốn bộ nhớ và băng thông.",
    detail: biggest ? `Đường dẫn: ${biggest.label}` : undefined,
    // Informational: a heavy list endpoint is a design cost, not an outage, and
    // grading it would keep the page on "needs attention" indefinitely.
    status: biggest ? "info" : "unknown",
    icon: "payload",
  };

  const waitShare = first(q.dbWaitShare);
  const dbMax = first(q.dbMaxConnections);
  const dbWaitCard: MetricCardData = {
    id: "dbwait",
    title: "Nghẽn kết nối cơ sở dữ liệu",
    value: waitShare === null ? "Chưa có yêu cầu" : formatPercent(waitShare),
    description: "Phần trăm lần hệ thống phải xếp hàng chờ để nói chuyện với cơ sở dữ liệu. Dưới 10% là bình thường.",
    detail: dbMax === null ? undefined : `Tối đa ${dbMax} kết nối cùng lúc.`,
    status: higherIsWorse(waitShare, { warn: 0.1, bad: 0.3 }),
    icon: "dbwait",
  };

  const memAvail = first(q.memoryAvailable);
  const memTotal = first(q.memoryTotal);
  const memCard: MetricCardData = {
    id: "memory",
    title: "Bộ nhớ máy chủ còn trống",
    value: memAvail === null ? NO_DATA : formatBytes(memAvail),
    description: "Bộ nhớ (RAM) có thể dùng ngay. Dưới 400 MB là nguy hiểm.",
    detail: memTotal === null ? undefined : `Trên tổng ${formatBytes(memTotal)}.`,
    status: lowerIsWorse(memAvail, { warn: 800 * 1024 ** 2, bad: 400 * 1024 ** 2 }),
    icon: "memory",
  };

  const swapUsed = first(q.swapUsed);
  const swapTotal = first(q.swapTotal);
  const swapCard: MetricCardData = {
    id: "swap",
    title: "Bộ nhớ dự phòng đang dùng",
    value: swapUsed === null ? NO_DATA : formatBytes(swapUsed),
    description: "Khi RAM thiếu, máy tạm dùng ổ đĩa thay RAM (chậm hơn). Dùng nhiều và lâu là dấu hiệu thiếu RAM.",
    detail: swapTotal === null ? undefined : `Trên tổng ${formatBytes(swapTotal)}.`,
    status: higherIsWorse(swapUsed, { warn: 512 * 1024 ** 2, bad: 1024 ** 3 }),
    icon: "swap",
  };

  const diskFree = first(q.diskFreeShare);
  const diskCard: MetricCardData = {
    id: "disk",
    title: "Ổ đĩa còn trống",
    value: diskFree === null ? NO_DATA : formatPercent(diskFree, 0),
    description: "Dung lượng lưu trữ còn trống trên máy chủ. Dưới 15% là cần dọn dẹp.",
    status: lowerIsWorse(diskFree, { warn: 0.3, bad: 0.15 }),
    icon: "disk",
  };

  const load = first(q.cpuLoadPerCore);
  const cpuCard: MetricCardData = {
    id: "cpu",
    title: "Mức bận của bộ xử lý",
    value: load === null ? NO_DATA : formatPercent(load, 0),
    description: "Mức công việc trung bình của máy trong 5 phút qua so với khả năng xử lý. Trên 100% nghĩa là máy đang quá tải.",
    status: higherIsWorse(load, { warn: 0.7, bad: 1 }),
    icon: "cpu",
  };

  const nextMem = first(q.nextMemory);
  const nextMemBefore = first(q.nextMemoryDayAgo);
  const nextChange = nextMem !== null ? formatChange(nextMem, nextMemBefore) : null;
  const webCard: MetricCardData = {
    id: "web",
    title: "Bộ nhớ của website",
    value: nextMem === null ? NO_DATA : formatBytes(nextMem),
    description: "Bộ nhớ phần giao diện website đang chiếm. Cần theo dõi xem có tăng dần theo thời gian không.",
    detail: nextChange ? `So với 24 giờ trước: ${nextChange}.` : "Chưa đủ dữ liệu để so với 24 giờ trước.",
    status: higherIsWorse(nextMem, { warn: 1.5 * 1024 ** 3, bad: 1.8 * 1024 ** 3 }),
    icon: "web",
  };

  const pgMem = first(q.postgresMemory);
  const goMem = first(q.goMemory);
  const dbMemCard: MetricCardData = {
    id: "database",
    title: "Bộ nhớ cơ sở dữ liệu",
    value: pgMem === null ? NO_DATA : formatBytes(pgMem),
    description: "Bộ nhớ của cơ sở dữ liệu (nơi lưu sản phẩm, đơn liên hệ...).",
    detail: goMem === null ? undefined : `Hệ thống xử lý dữ liệu dùng thêm ${formatBytes(goMem)}.`,
    status: pgMem === null ? "unknown" : "info",
    icon: "database",
  };

  const sections: CardSection[] = [
    { id: "site", title: "Website và hệ thống xử lý", description: "Website có đang chạy và phản hồi nhanh không.", cards: [apiCard, trafficCard, errorCard, speedCard, slowCard, payloadCard] },
    { id: "database", title: "Cơ sở dữ liệu", description: "Nơi lưu toàn bộ dữ liệu của website.", cards: [dbWaitCard, dbMemCard] },
    { id: "server", title: "Máy chủ", description: "Sức khỏe của máy chủ đang chạy website.", cards: [memCard, swapCard, diskCard, cpuCard, webCard] },
  ];

  // ---- alerts ------------------------------------------------------------
  const alerts: ActiveAlert[] = (q.firingAlerts ?? []).map((s) => {
    const name = s.metric.alertname ?? "Không rõ";
    const text = ALERT_TEXT[name];
    const sev = s.metric.severity;
    return {
      name,
      title: text?.title ?? name,
      hint: text?.hint ?? "Cảnh báo tự động của hệ thống giám sát.",
      severity: sev === "critical" || sev === "warning" || sev === "info" ? sev : "unknown",
    };
  });
  const targetsDown = first(q.targetsDown) ?? 0;

  // ---- overall -----------------------------------------------------------
  let overallStatus: Status = worstStatus(sections.flatMap((s) => s.cards.map((c) => c.status)));
  const hasCritical = alerts.some((a) => a.severity === "critical");
  const hasWarning = alerts.some((a) => a.severity === "warning");
  if (hasCritical) overallStatus = "bad";
  else if ((hasWarning || targetsDown > 0) && overallStatus === "ok") overallStatus = "warn";

  const overall = !reachable
    ? { status: "unknown" as Status, headline: "Không lấy được số liệu", detail: "Hệ thống giám sát không phản hồi. Website có thể vẫn hoạt động bình thường; đây chỉ là trang theo dõi." }
    : overallStatus === "ok"
      ? { status: "ok" as Status, headline: "Mọi thứ đang bình thường", detail: "Không có chỉ số nào vượt ngưỡng và không có cảnh báo nào đang hoạt động." }
      : overallStatus === "warn"
        ? { status: "warn" as Status, headline: "Có điểm cần chú ý", detail: "Một số chỉ số đang gần ngưỡng giới hạn. Chưa ảnh hưởng đến khách, nhưng nên theo dõi." }
        : overallStatus === "bad"
          ? { status: "bad" as Status, headline: "Có vấn đề cần xử lý", detail: "Một số chỉ số vượt ngưỡng an toàn. Hãy báo cho người phụ trách kỹ thuật." }
          : { status: "unknown" as Status, headline: "Chưa đủ dữ liệu", detail: "Hệ thống giám sát đang chạy nhưng chưa có số liệu để đánh giá." };

  // ---- charts ------------------------------------------------------------
  const charts: ChartData[] = [
    makeChart("traffic", "Mức độ hoạt động theo thời gian", "Số yêu cầu hệ thống xử lý mỗi phút.", "count", [{ key: "requests", label: "Yêu cầu/phút" }], [r.requestsPerMinute]),
    makeChart("latency", "Tốc độ phản hồi theo thời gian", "Thông thường (50%) và chậm (95%, 99%). Thấp hơn là tốt hơn.", "milliseconds", [
      { key: "p50", label: "Thông thường (50%)" },
      { key: "p95", label: "Chậm (95%)" },
      { key: "p99", label: "Rất chậm (99%)" },
    ], [r.latencyP50, r.latencyP95, r.latencyP99]),
    makeChart("dbwait", "Nghẽn kết nối cơ sở dữ liệu theo thời gian", "Phần trăm lần phải chờ để có kết nối. Càng thấp càng tốt.", "percent", [{ key: "wait", label: "Phải chờ" }], [r.dbWaitShare]),
    makeMemoryChart(r.processMemory, r.memoryAvailable),
  ].filter((c): c is ChartData => c !== null);

  return { generatedAt: now, range, reachable, overall, sections, charts, alerts };
}

// Joins several series on their timestamps into one row per time, which is
// what both the chart and the accessible table need.
function makeChart(
  id: string,
  title: string,
  description: string,
  unit: ChartData["unit"],
  series: ChartData["series"],
  data: Array<PromSeries[] | null>,
): ChartData | null {
  const byTime = new Map<number, Record<string, number | null>>();
  series.forEach((s, i) => {
    const line = data[i]?.[0];
    for (const p of line?.points ?? []) {
      const row = byTime.get(p.t) ?? { t: p.t };
      // Percent and latency charts are shown in their display unit.
      row[s.key] = p.v === null ? null : unit === "milliseconds" ? p.v * 1000 : unit === "percent" ? p.v * 100 : p.v;
      byTime.set(p.t, row);
    }
  });
  const points = [...byTime.values()].sort((a, b) => (a.t as number) - (b.t as number));
  return points.length === 0 ? null : { id, title, description, unit, series, points };
}

const PROCESS_LABELS: Record<string, string> = { next: "Website", postgres: "Cơ sở dữ liệu", "elc-go": "Hệ thống xử lý dữ liệu" };

function makeMemoryChart(processes: PromSeries[] | null, available: PromSeries[] | null): ChartData | null {
  const series: ChartData["series"] = [{ key: "available", label: "Máy chủ còn trống" }];
  const lines: Array<PromSeries[] | null> = [available];
  for (const p of processes ?? []) {
    const group = p.metric.groupname ?? "";
    series.push({ key: group, label: `${PROCESS_LABELS[group] ?? group} đang dùng` });
    lines.push([p]);
  }
  return makeChart("memory", "Bộ nhớ theo thời gian", "Bộ nhớ máy chủ còn trống và bộ nhớ từng thành phần đang dùng.", "bytes", series, lines);
}
