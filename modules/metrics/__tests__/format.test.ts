import { describe, expect, it } from "vitest";

import { formatBytes, formatChange, formatDuration, formatLatency, formatPercent, formatPerMinute } from "../domain/format";

describe("formatBytes", () => {
  it("uses a decimal comma and the right unit", () => {
    expect(formatBytes(2.54 * 1024 ** 3)).toBe("2,54 GB");
    expect(formatBytes(650 * 1024 ** 2)).toBe("650 MB");
    expect(formatBytes(1.7 * 1024 ** 2)).toBe("1,7 MB");
    expect(formatBytes(12 * 1024 ** 2)).toBe("12 MB");
    expect(formatBytes(123 * 1024)).toBe("123 KB");
    expect(formatBytes(12)).toBe("12 B");
  });
});

describe("formatPercent", () => {
  it("formats ratios", () => {
    expect(formatPercent(0.125)).toBe("12,5%");
    expect(formatPercent(0.79, 0)).toBe("79%");
    expect(formatPercent(0)).toBe("0%");
  });

  it("never rounds a small non-zero value down to 0%, which would claim 'no errors'", () => {
    expect(formatPercent(0.00001)).toBe("<0,1%");
    expect(formatPercent(0.001)).toBe("0,1%");
  });
});

describe("formatLatency", () => {
  it("switches between milliseconds and seconds", () => {
    expect(formatLatency(0.181)).toBe("181 ms");
    expect(formatLatency(0.0198)).toBe("20 ms");
    expect(formatLatency(1.24)).toBe("1,2 giây");
  });
});

describe("formatPerMinute", () => {
  it("converts per-second rates to per-minute", () => {
    expect(formatPerMinute(0.5)).toBe("30 lượt/phút");
    expect(formatPerMinute(0.05)).toBe("3 lượt/phút");
  });
});

describe("formatDuration", () => {
  it("reads naturally at each scale", () => {
    expect(formatDuration(30)).toBe("dưới 1 phút");
    expect(formatDuration(600)).toBe("10 phút");
    expect(formatDuration(3720)).toBe("1 giờ 2 phút");
    expect(formatDuration(90000)).toBe("1 ngày 1 giờ");
    expect(formatDuration(-5)).toBe("dưới 1 phút");
  });
});

describe("formatChange", () => {
  it("shows direction with a real minus sign", () => {
    expect(formatChange(120, 100)).toBe("+20%");
    expect(formatChange(80, 100)).toBe("−20%");
    expect(formatChange(100.4, 100)).toBe("không đổi");
  });

  it("returns null when there is nothing meaningful to compare against", () => {
    expect(formatChange(5, null)).toBeNull();
    expect(formatChange(5, 0)).toBeNull();
  });
});
