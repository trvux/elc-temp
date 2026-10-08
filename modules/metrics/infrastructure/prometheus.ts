// Thin client for the Prometheus HTTP API. Server-side only: Prometheus listens
// on the VPS loopback and is never exposed, so the browser can't reach it; the
// admin page's server component calls it directly.

export interface PromSample {
  metric: Record<string, string>;
  value: number | null;
}

export interface PromSeries {
  metric: Record<string, string>;
  points: Array<{ t: number; v: number | null }>;
}

export interface PromClient {
  instant(query: string): Promise<PromSample[]>;
  range(query: string, startSec: number, endSec: number, stepSec: number): Promise<PromSeries[]>;
}

const DEFAULT_URL = "http://127.0.0.1:9090";
const TIMEOUT_MS = 4000;

// "NaN" and "+Inf" are legal Prometheus values (an empty histogram, a
// division by zero). They are not numbers a dashboard can show, so they
// become null and the card says "no data" instead of printing NaN.
function toNumber(raw: unknown): number | null {
  const n = typeof raw === "string" ? Number(raw) : typeof raw === "number" ? raw : NaN;
  return Number.isFinite(n) ? n : null;
}

interface PromEnvelope {
  status: string;
  data?: { resultType: string; result: unknown[] };
  error?: string;
}

async function call(baseUrl: string, path: string, params: Record<string, string>, fetchImpl: typeof fetch): Promise<unknown[]> {
  const url = `${baseUrl}${path}?${new URLSearchParams(params).toString()}`;
  const res = await fetchImpl(url, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Prometheus responded ${res.status}`);
  const body = (await res.json()) as PromEnvelope;
  if (body.status !== "success" || !body.data) throw new Error(body.error ?? "Prometheus query failed");
  return body.data.result;
}

export function createPromClient(baseUrl: string = process.env.PROMETHEUS_URL ?? DEFAULT_URL, fetchImpl: typeof fetch = fetch): PromClient {
  return {
    async instant(query) {
      const result = (await call(baseUrl, "/api/v1/query", { query }, fetchImpl)) as Array<{
        metric: Record<string, string>;
        value: [number, string];
      }>;
      return result.map((r) => ({ metric: r.metric, value: toNumber(r.value?.[1]) }));
    },
    async range(query, startSec, endSec, stepSec) {
      const result = (await call(
        baseUrl,
        "/api/v1/query_range",
        { query, start: String(startSec), end: String(endSec), step: String(stepSec) },
        fetchImpl,
      )) as Array<{ metric: Record<string, string>; values: Array<[number, string]> }>;
      return result.map((r) => ({
        metric: r.metric,
        points: r.values.map(([t, v]) => ({ t: t * 1000, v: toNumber(v) })),
      }));
    },
  };
}
