import type { PromClient, PromSample, PromSeries } from "../infrastructure/prometheus";
import { INSTANT } from "../domain/queries";

export const NOW = Date.UTC(2026, 9, 8, 12, 0, 0);

export const num = (value: number | null, metric: Record<string, string> = {}): PromSample[] => [{ metric, value }];

// A healthy system, keyed by the exact query text the page sends.
export function healthy(): Map<string, PromSample[]> {
  return new Map<string, PromSample[]>([
    [INSTANT.apiUp, num(1)],
    [INSTANT.apiUptime, num(7200)],
    [INSTANT.requestsPerSecond, num(0.5)],
    [INSTANT.requestsPerSecondYesterday, num(0.25)],
    [INSTANT.errorShare, num(0.001)],
    [INSTANT.latencyP50, num(0.02)],
    [INSTANT.latencyP95, num(0.18)],
    [INSTANT.slowestRoute, num(0.4, { route: "/products" })],
    [INSTANT.largestResponse, num(1.7 * 1024 ** 2, { route: "/news" })],
    [INSTANT.dbWaitShare, num(0.05)],
    [INSTANT.dbMaxConnections, num(12)],
    [INSTANT.memoryAvailable, num(2.6 * 1024 ** 3)],
    [INSTANT.memoryTotal, num(3.8 * 1024 ** 3)],
    [INSTANT.swapUsed, num(50 * 1024 ** 2)],
    [INSTANT.swapTotal, num(2 * 1024 ** 3)],
    [INSTANT.diskFreeShare, num(0.8)],
    [INSTANT.cpuLoadPerCore, num(0.1)],
    [INSTANT.nextMemory, num(250 * 1024 ** 2)],
    [INSTANT.nextMemoryDayAgo, num(200 * 1024 ** 2)],
    [INSTANT.postgresMemory, num(190 * 1024 ** 2)],
    [INSTANT.goMemory, num(45 * 1024 ** 2)],
    [INSTANT.targetsDown, num(0)],
    [INSTANT.firingAlerts, []],
  ]);
}

export function series(values: Array<[number, number | null]>, metric: Record<string, string> = {}): PromSeries[] {
  return [{ metric, points: values.map(([t, v]) => ({ t, v })) }];
}

export function fakeClient(instant: Map<string, PromSample[]>, onRange?: (q: string, step: number) => PromSeries[]) {
  const issued: string[] = [];
  const steps: number[] = [];
  const client: PromClient = {
    async instant(q) {
      issued.push(q);
      const r = instant.get(q);
      if (!r) throw new Error(`unexpected query: ${q}`);
      return r;
    },
    async range(q, _s, _e, step) {
      issued.push(q);
      steps.push(step);
      return onRange ? onRange(q, step) : [];
    },
  };
  return { client, issued, steps };
}

