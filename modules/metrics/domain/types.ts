// Status of one measurement, for people who don't read graphs.
//   ok / warn / bad  a health verdict against a threshold
//   info             a figure worth knowing that is not a health signal (how
//                    busy, how heavy a response is); never changes the overall
//                    verdict, so "everything is normal" stays trustworthy
//   unknown          no data (Prometheus unreachable, series doesn't exist
//                    yet); deliberately NOT folded into "ok"
export type Status = "ok" | "warn" | "bad" | "info" | "unknown";

export type MetricsRange = "1h" | "6h" | "24h" | "7d";

export interface RangeConfig {
  label: string;
  seconds: number;
  // Seconds between points of a chart series (~120-170 points per series).
  stepSeconds: number;
  // PromQL rate() window: wide enough to smooth the step, narrow enough to
  // still show a spike.
  rateWindow: string;
}

export const RANGES: Record<MetricsRange, RangeConfig> = {
  "1h": { label: "1 giờ", seconds: 3600, stepSeconds: 30, rateWindow: "5m" },
  "6h": { label: "6 giờ", seconds: 6 * 3600, stepSeconds: 180, rateWindow: "5m" },
  "24h": { label: "24 giờ", seconds: 24 * 3600, stepSeconds: 720, rateWindow: "15m" },
  "7d": { label: "7 ngày", seconds: 7 * 86400, stepSeconds: 3600, rateWindow: "1h" },
};

export const RANGE_ORDER: MetricsRange[] = ["1h", "6h", "24h", "7d"];
export const DEFAULT_RANGE: MetricsRange = "6h";

// The range comes from the URL, so it is user input: anything outside the
// four known keys falls back to the default instead of reaching a query.
export function parseRange(input: string | string[] | undefined): MetricsRange {
  const value = Array.isArray(input) ? input[0] : input;
  // hasOwn, not `in`: "constructor", "toString", "__proto__" are "in" every
  // object through the prototype chain and must not count as a range.
  return value !== undefined && Object.hasOwn(RANGES, value) ? (value as MetricsRange) : DEFAULT_RANGE;
}

// Kept as a string key (not a component) so the snapshot stays plain,
// serializable data; the presentation layer maps it to an icon.
export type CardIcon =
  | "api"
  | "traffic"
  | "errors"
  | "speed"
  | "slow"
  | "payload"
  | "database"
  | "dbwait"
  | "memory"
  | "swap"
  | "disk"
  | "cpu"
  | "web";

export interface MetricCardData {
  id: string;
  title: string;
  value: string;
  // One plain-language sentence: what this measures and what is normal.
  description: string;
  // Optional second line (comparison, the worst route, ...).
  detail?: string;
  status: Status;
  icon: CardIcon;
}

export interface CardSection {
  id: string;
  title: string;
  description: string;
  cards: MetricCardData[];
}

export interface ChartSeries {
  key: string;
  label: string;
}

export type ChartUnit = "count" | "milliseconds" | "bytes" | "percent";

export interface ChartData {
  id: string;
  title: string;
  description: string;
  unit: ChartUnit;
  series: ChartSeries[];
  // One row per timestamp: { t: epochMs, [seriesKey]: number | null }.
  points: Array<Record<string, number | null>>;
}

export interface ActiveAlert {
  name: string;
  title: string;
  hint: string;
  severity: "critical" | "warning" | "info" | "unknown";
}

export interface MetricsSnapshot {
  generatedAt: number;
  range: MetricsRange;
  // False when Prometheus could not be reached at all.
  reachable: boolean;
  overall: { status: Status; headline: string; detail: string };
  sections: CardSection[];
  charts: ChartData[];
  alerts: ActiveAlert[];
}
