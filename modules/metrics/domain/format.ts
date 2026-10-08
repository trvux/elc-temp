// Number formatting for people reading Vietnamese: comma as the decimal mark.
const vn = (maxDigits: number, minDigits = 0) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: maxDigits, minimumFractionDigits: minDigits });

const GB = 1024 ** 3;
const MB = 1024 ** 2;
const KB = 1024;

export function formatBytes(bytes: number): string {
  if (bytes >= GB) return `${vn(2).format(bytes / GB)} GB`;
  // One decimal below 10 MB: 1.7 MB must not read as "2 MB".
  if (bytes >= MB) return `${vn(bytes < 10 * MB ? 1 : 0).format(bytes / MB)} MB`;
  if (bytes >= KB) return `${vn(0).format(bytes / KB)} KB`;
  return `${vn(0).format(bytes)} B`;
}

// ratio 0..1 -> "12,5%". Tiny non-zero values read "<0,1%" rather than "0%",
// because "0%" would claim there were no errors at all.
export function formatPercent(ratio: number, digits = 1): string {
  const pct = ratio * 100;
  if (pct > 0 && pct < 10 ** -digits) return `<${vn(digits, digits).format(10 ** -digits)}%`;
  return `${vn(digits).format(pct)}%`;
}

export function formatLatency(seconds: number): string {
  if (seconds < 1) return `${vn(0).format(seconds * 1000)} ms`;
  return `${vn(1).format(seconds)} giây`;
}

// requests per second -> per minute, which is easier to picture.
export function formatPerMinute(perSecond: number): string {
  return `${vn(perSecond * 60 < 10 ? 1 : 0).format(perSecond * 60)} lượt/phút`;
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  if (days > 0) return `${days} ngày ${hours} giờ`;
  if (hours > 0) return `${hours} giờ ${minutes} phút`;
  if (minutes > 0) return `${minutes} phút`;
  return "dưới 1 phút";
}

// "+12%" / "−5%" / "không đổi". Null when there is nothing to compare to.
export function formatChange(current: number, previous: number | null): string | null {
  if (previous === null || previous <= 0) return null;
  const pct = ((current - previous) / previous) * 100;
  if (Math.abs(pct) < 1) return "không đổi";
  return `${pct > 0 ? "+" : "−"}${vn(0).format(Math.abs(pct))}%`;
}

export function formatClock(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });
}

export function formatDateTime(epochMs: number): string {
  return new Date(epochMs).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh",
  });
}
