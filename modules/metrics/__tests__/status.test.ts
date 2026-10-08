import { describe, expect, it } from "vitest";

import { higherIsWorse, lowerIsWorse, worstStatus } from "../domain/status";
import { DEFAULT_RANGE, parseRange } from "../domain/types";

describe("thresholds", () => {
  it("higherIsWorse: boundary values belong to the worse side", () => {
    const limits = { warn: 0.5, bad: 1 };
    expect(higherIsWorse(0.49, limits)).toBe("ok");
    expect(higherIsWorse(0.5, limits)).toBe("warn");
    expect(higherIsWorse(1, limits)).toBe("bad");
  });

  it("lowerIsWorse: boundary values belong to the worse side", () => {
    const limits = { warn: 800, bad: 400 };
    expect(lowerIsWorse(801, limits)).toBe("ok");
    expect(lowerIsWorse(800, limits)).toBe("warn");
    expect(lowerIsWorse(400, limits)).toBe("bad");
  });

  it("missing data is unknown, never silently ok", () => {
    expect(higherIsWorse(null, { warn: 1, bad: 2 })).toBe("unknown");
    expect(lowerIsWorse(Number.NaN, { warn: 1, bad: 2 })).toBe("unknown");
  });
});

describe("worstStatus", () => {
  it("picks the most severe known status", () => {
    expect(worstStatus(["ok", "warn", "ok"])).toBe("warn");
    expect(worstStatus(["ok", "bad", "warn"])).toBe("bad");
  });

  it("informational cards don't vote", () => {
    expect(worstStatus(["info", "ok"])).toBe("ok");
    expect(worstStatus(["info", "info"])).toBe("unknown");
  });

  it("ignores unknown unless nothing is known", () => {
    expect(worstStatus(["unknown", "ok"])).toBe("ok");
    expect(worstStatus(["unknown", "unknown"])).toBe("unknown");
    expect(worstStatus([])).toBe("unknown");
  });
});

describe("parseRange (user input from the URL)", () => {
  it("accepts the four known ranges", () => {
    for (const r of ["1h", "6h", "24h", "7d"]) expect(parseRange(r)).toBe(r);
  });

  it("falls back to the default for anything else", () => {
    for (const bad of [undefined, "", "30d", "1H", "6h; DROP", "a".repeat(500)]) {
      expect(parseRange(bad)).toBe(DEFAULT_RANGE);
    }
  });

  it("does not treat prototype keys as ranges", () => {
    for (const bad of ["constructor", "toString", "__proto__", "hasOwnProperty"]) {
      expect(parseRange(bad)).toBe(DEFAULT_RANGE);
    }
  });

  it("takes the first value when the parameter repeats", () => {
    expect(parseRange(["24h", "1h"])).toBe("24h");
    expect(parseRange(["nope", "1h"])).toBe(DEFAULT_RANGE);
  });
});
