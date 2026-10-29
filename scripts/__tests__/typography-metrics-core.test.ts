import { describe, expect, it } from "vitest";
// @ts-expect-error plain .mjs helper, no types
import { diffPage, diffSnapshots, isClean, keyItems } from "../typography-metrics-core.mjs";

const el = (text: string, fs = "14px", fw = "400", lh = "20px", extra = {}) => ({
  tag: "p", text, fs, fw, lh, ls: "normal", h: 20, ...extra,
});
const page = (items: object[], headings = [{ tag: "h1", text: "T" }], height = 1000) => ({
  height, headings, items: keyItems(items),
});

describe("typography-metrics-core", () => {
  it("identical pages are clean", () => {
    const a = page([el("a"), el("b")]);
    expect(isClean(diffPage(a, page([el("a"), el("b")])))).toBe(true);
  });

  it("groups style transitions and counts them", () => {
    const a = page([el("a"), el("b"), el("c", "12px", "400", "16px")]);
    const b = page([el("a", "14px", "400", "21px"), el("b", "14px", "400", "21px"), el("c", "12px", "400", "16px")]);
    const d = diffPage(a, b);
    expect(d.changed).toBe(2);
    expect(d.transitions).toEqual([["14px/400/20px -> 14px/400/21px", 2]]);
    expect(isClean(d)).toBe(false);
  });

  it("matches duplicate texts by occurrence order", () => {
    const a = page([el("same"), el("same", "16px")]);
    const b = page([el("same"), el("same", "17px")]);
    expect(diffPage(a, b).changed).toBe(1);
  });

  it("reports removed/added text and heading outline changes", () => {
    const a = page([el("old")], [{ tag: "h1", text: "404" }, { tag: "h1", text: "Title" }]);
    const b = page([el("new")], [{ tag: "h1", text: "Title" }]);
    const d = diffPage(a, b);
    expect(d.removed).toBe(1);
    expect(d.added).toBe(1);
    expect(d.headingsSame).toBe(false);
    expect([d.h1Before, d.h1After]).toEqual([2, 1]);
  });

  it("reports page height drift", () => {
    expect(diffPage(page([el("a")], undefined, 1000), page([el("a")], undefined, 1012.5)).pageHeightDelta).toBe(12.5);
  });

  it("flags pages missing from the second snapshot and honours the page filter", () => {
    const a = { pages: { "/x@375": page([el("a")]), "/y@375": page([el("a")]) } };
    const b = { pages: { "/x@375": page([el("a")]) } };
    expect(diffSnapshots(a, b)["/y@375"]).toEqual({ missing: true });
    expect(Object.keys(diffSnapshots(a, b, "/x"))).toEqual(["/x@375"]);
  });
});
