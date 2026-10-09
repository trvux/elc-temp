import { describe, expect, it } from "vitest";

import { getMetricsSnapshot } from "../application/getMetricsSnapshot";
import { INSTANT, rangeQueries } from "../domain/queries";
import { NOW, fakeClient, healthy, num, series } from "./fixtures";
import { RANGES } from "../domain/types";
import type { PromClient } from "../infrastructure/prometheus";

const cards = (snap: Awaited<ReturnType<typeof getMetricsSnapshot>>) => Object.fromEntries(snap.sections.flatMap((s) => s.cards).map((c) => [c.id, c]));

describe("getMetricsSnapshot", () => {
  it("reports everything normal for a healthy system, in plain Vietnamese", async () => {
    const { client } = fakeClient(healthy());
    const snap = await getMetricsSnapshot(client, "6h", NOW);
    const c = cards(snap);

    expect(snap.reachable).toBe(true);
    expect(snap.overall.status).toBe("ok");
    expect(snap.overall.headline).toBe("Mọi thứ đang bình thường");
    expect(Object.keys(c)).toHaveLength(13);
    expect(c.api.value).toBe("Đang hoạt động");
    expect(c.api.detail).toContain("2 giờ");
    expect(c.traffic.value).toBe("30 lượt/phút");
    expect(c.traffic.detail).toContain("+100%");
    expect(c.errors.value).toBe("0,1%");
    expect(c.speed.value).toBe("180 ms");
    expect(c.slowest.detail).toContain("/products");
    expect(c.payload.value).toBe("1,7 MB");
    expect(c.memory.value).toBe("2,6 GB");
    expect(c.disk.value).toBe("80%");
    expect(c.web.detail).toContain("+25%");
    // Figures that are not health signals never vote on the verdict.
    for (const id of ["traffic", "payload", "database"]) expect(c[id].status).toBe("info");
    for (const id of Object.keys(c).filter((k) => !["traffic", "payload", "database"].includes(k))) expect(c[id].status).toBe("ok");
  });

  it("a heavy endpoint alone never turns the verdict from normal into 'needs attention'", async () => {
    const data = healthy();
    data.set(INSTANT.largestResponse, num(9 * 1024 ** 2, { route: "/news" }));
    const snap = await getMetricsSnapshot(fakeClient(data).client, "6h", NOW);
    expect(cards(snap).payload.status).toBe("info");
    expect(snap.overall.status).toBe("ok");
  });

  it("never throws and says so when Prometheus is unreachable", async () => {
    const client: PromClient = {
      async instant() { throw new Error("ECONNREFUSED"); },
      async range() { throw new Error("ECONNREFUSED"); },
    };
    const snap = await getMetricsSnapshot(client, "6h", NOW);

    expect(snap.reachable).toBe(false);
    expect(snap.overall.status).toBe("unknown");
    expect(snap.overall.headline).toBe("Không lấy được số liệu");
    expect(Object.values(cards(snap)).every((c) => c.status === "unknown" && c.value.length > 0)).toBe(true);
    expect(snap.charts).toEqual([]);
  });

  it("a single failing metric blanks one card, not the page", async () => {
    const data = healthy();
    data.delete(INSTANT.diskFreeShare); // fake client throws for it
    const snap = await getMetricsSnapshot(fakeClient(data).client, "6h", NOW);

    expect(snap.reachable).toBe(true);
    expect(cards(snap).disk.status).toBe("unknown");
    expect(cards(snap).disk.value).toBe("Chưa có dữ liệu");
    expect(cards(snap).memory.status).toBe("ok");
    expect(snap.overall.status).toBe("ok"); // unknown does not poison the verdict
  });

  it("flags a metric past its threshold and raises the overall status", async () => {
    const data = healthy();
    data.set(INSTANT.memoryAvailable, num(300 * 1024 ** 2));
    data.set(INSTANT.errorShare, num(0.015));
    const snap = await getMetricsSnapshot(fakeClient(data).client, "6h", NOW);

    expect(cards(snap).memory.status).toBe("bad");
    expect(cards(snap).errors.status).toBe("warn");
    expect(snap.overall.status).toBe("bad");
    expect(snap.overall.headline).toBe("Có vấn đề cần xử lý");
  });

  it("shows 'no requests yet' instead of NaN when there is no traffic to measure", async () => {
    const data = healthy();
    data.set(INSTANT.errorShare, num(null));
    data.set(INSTANT.dbWaitShare, num(null));
    const c = cards(await getMetricsSnapshot(fakeClient(data).client, "6h", NOW));

    expect(c.errors.value).toBe("Chưa có yêu cầu");
    expect(c.dbwait.value).toBe("Chưa có yêu cầu");
    expect(`${c.errors.value}${c.speed.value}`).not.toContain("NaN");
  });

  it("translates firing alerts and a critical one makes the whole page critical", async () => {
    const data = healthy();
    data.set(INSTANT.firingAlerts, [
      { metric: { alertname: "HostMemoryAvailableLow", severity: "critical" }, value: 1 },
      { metric: { alertname: "SomethingNew", severity: "warning" }, value: 1 },
    ]);
    const snap = await getMetricsSnapshot(fakeClient(data).client, "6h", NOW);

    expect(snap.alerts[0]).toMatchObject({ title: "Máy chủ sắp hết bộ nhớ", severity: "critical" });
    expect(snap.alerts[1]).toMatchObject({ title: "SomethingNew", severity: "warning" }); // unknown name falls back to itself
    expect(snap.overall.status).toBe("bad");
  });

  it("a warning alert or a down scrape target downgrades an otherwise-ok page to 'needs attention'", async () => {
    const warn = healthy();
    warn.set(INSTANT.firingAlerts, [{ metric: { alertname: "DbPoolSaturated", severity: "warning" }, value: 1 }]);
    expect((await getMetricsSnapshot(fakeClient(warn).client, "6h", NOW)).overall.status).toBe("warn");

    const down = healthy();
    down.set(INSTANT.targetsDown, num(1));
    expect((await getMetricsSnapshot(fakeClient(down).client, "6h", NOW)).overall.status).toBe("warn");
  });

  it("only ever sends queries from the fixed whitelist", async () => {
    const { client, issued } = fakeClient(healthy());
    for (const range of Object.keys(RANGES) as Array<keyof typeof RANGES>) {
      await getMetricsSnapshot(client, range, NOW);
    }
    const allowed = new Set<string>([
      ...Object.values(INSTANT),
      ...Object.values(RANGES).flatMap((r) => Object.values(rangeQueries(r.rateWindow))),
    ]);
    expect(issued.length).toBeGreaterThan(0);
    expect(issued.filter((q) => !allowed.has(q))).toEqual([]);
  });

  it("uses the chosen range's step and rate window", async () => {
    const { client, issued, steps } = fakeClient(healthy());
    await getMetricsSnapshot(client, "24h", NOW);

    expect(new Set(steps)).toEqual(new Set([RANGES["24h"].stepSeconds]));
    expect(issued.some((q) => q.includes("[15m]") && q.includes("* 60"))).toBe(true);
  });

  it("builds chart rows, converting units for display and joining series by time", async () => {
    const { client } = fakeClient(healthy(), (q) => {
      if (q.includes("0.95")) return series([[1000, 0.2], [2000, 0.4]]);
      if (q.includes("0.50")) return series([[1000, 0.02], [2000, 0.04]]);
      if (q.includes("0.99")) return series([[1000, 0.5], [2000, null]]);
      if (q.includes("db_pool_empty_acquires_total")) return series([[1000, 0.25], [2000, 0.5]]);
      return series([[1000, 10], [2000, 20]]);
    });
    const snap = await getMetricsSnapshot(client, "6h", NOW);
    const latency = snap.charts.find((c) => c.id === "latency")!;
    const dbwait = snap.charts.find((c) => c.id === "dbwait")!;

    expect(latency.unit).toBe("milliseconds");
    expect(latency.points).toEqual([
      { t: 1000, p50: 20, p95: 200, p99: 500 },
      { t: 2000, p50: 40, p95: 400, p99: null },
    ]);
    expect(dbwait.points[0].wait).toBe(25); // ratio 0.25 -> 25 (%)
  });
});
