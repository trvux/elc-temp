// Every PromQL string the page runs, fixed here. The browser never sends a
// query: the only input that reaches this file is the time range, and it is
// validated to one of four keys first (parseRange). That keeps this page from
// being a way to run arbitrary, possibly expensive, queries against Prometheus.

const API = 'job="elc-go"';

export const INSTANT = {
  apiUp: `up{${API}}`,
  apiUptime: `time() - process_start_time_seconds{${API}}`,
  requestsPerSecond: `sum(rate(http_requests_total{${API}}[5m]))`,
  requestsPerSecondYesterday: `sum(rate(http_requests_total{${API}}[5m] offset 1d))`,
  errorShare: `(sum(rate(http_requests_total{${API},code=~"5.."}[15m])) or vector(0)) / sum(rate(http_requests_total{${API}}[15m]))`,
  latencyP50: `histogram_quantile(0.50, sum by (le) (rate(http_request_duration_seconds_bucket{${API}}[15m])))`,
  latencyP95: `histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket{${API}}[15m])))`,
  // "> 0" drops NaN (routes with no traffic in the window) before topk.
  slowestRoute: `topk(1, histogram_quantile(0.95, sum by (le, route) (rate(http_request_duration_seconds_bucket{${API}}[15m]))) > 0)`,
  largestResponse: `topk(1, histogram_quantile(0.95, sum by (le, route) (rate(http_response_size_bytes_bucket{${API}}[1h]))) > 0)`,
  dbWaitShare: `rate(db_pool_empty_acquires_total{${API}}[15m]) / rate(db_pool_acquires_total{${API}}[15m])`,
  dbMaxConnections: `db_pool_max_connections{${API}}`,
  memoryAvailable: "node_memory_MemAvailable_bytes",
  memoryTotal: "node_memory_MemTotal_bytes",
  swapUsed: "node_memory_SwapTotal_bytes - node_memory_SwapFree_bytes",
  swapTotal: "node_memory_SwapTotal_bytes",
  diskFreeShare: 'node_filesystem_avail_bytes{mountpoint="/",fstype!~"tmpfs|overlay"} / node_filesystem_size_bytes{mountpoint="/",fstype!~"tmpfs|overlay"}',
  cpuLoadPerCore: 'node_load5 / count(count by (cpu) (node_cpu_seconds_total{mode="idle"}))',
  nextMemory: 'namedprocess_namegroup_memory_bytes{groupname="next",memtype="resident"}',
  nextMemoryDayAgo: 'namedprocess_namegroup_memory_bytes{groupname="next",memtype="resident"} offset 1d',
  postgresMemory: 'namedprocess_namegroup_memory_bytes{groupname="postgres",memtype="resident"}',
  goMemory: 'namedprocess_namegroup_memory_bytes{groupname="elc-go",memtype="resident"}',
  targetsDown: "count(up == 0) or vector(0)",
  firingAlerts: 'ALERTS{alertstate="firing"}',
} as const;

// Range queries take the rate window from the chosen range (see RANGES).
export function rangeQueries(rateWindow: string) {
  const reqs = `http_requests_total{${API}}`;
  const dur = `http_request_duration_seconds_bucket{${API}}`;
  return {
    requestsPerMinute: `sum(rate(${reqs}[${rateWindow}])) * 60`,
    latencyP50: `histogram_quantile(0.50, sum by (le) (rate(${dur}[${rateWindow}])))`,
    latencyP95: `histogram_quantile(0.95, sum by (le) (rate(${dur}[${rateWindow}])))`,
    latencyP99: `histogram_quantile(0.99, sum by (le) (rate(${dur}[${rateWindow}])))`,
    processMemory: 'namedprocess_namegroup_memory_bytes{groupname=~"next|postgres|elc-go",memtype="resident"}',
    memoryAvailable: "node_memory_MemAvailable_bytes",
    dbWaitShare: `rate(db_pool_empty_acquires_total{${API}}[${rateWindow}]) / rate(db_pool_acquires_total{${API}}[${rateWindow}])`,
  } as const;
}
