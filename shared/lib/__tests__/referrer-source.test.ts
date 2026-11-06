import { describe, expect, it } from "vitest";

import { classifyReferrer } from "../referrer-source";

const SITE = "dienmayelc.com.vn";
const classify = (r: string | null | undefined) => classifyReferrer(r, SITE);

describe("classifyReferrer", () => {
  it.each([
    ["https://www.google.com/", "google"],
    ["https://www.google.com.vn/search?q=may+lanh", "google"],
    ["https://google.co.uk/", "google"],
    ["https://www.bing.com/", "bing"],
    ["https://coccoc.com/search", "coccoc"],
    ["https://duckduckgo.com/", "duckduckgo"],
  ])("%s is organic search from %s", (referer, source) => {
    expect(classify(referer)).toMatchObject({ source, medium: "organic" });
  });

  it.each([
    ["https://l.facebook.com/l.php?u=x", "facebook"],
    ["https://m.facebook.com/", "facebook"],
    ["https://zalo.me/", "zalo"],
    ["https://www.youtube.com/watch?v=1", "youtube"],
    ["https://t.co/abc", "twitter"],
  ])("%s is social from %s", (referer, source) => {
    expect(classify(referer)).toMatchObject({ source, medium: "social" });
  });

  it("treats any other site as a referral named after its host", () => {
    expect(classify("https://www.daikin.com.vn/page")).toEqual({ source: "daikin.com.vn", medium: "referral", host: "www.daikin.com.vn" });
  });

  it("does not call an AI assistant on a google.com host Google organic", () => {
    expect(classify("https://gemini.google.com/")).toMatchObject({ source: "gemini.google.com", medium: "referral" });
  });

  it("is null for a direct visit, an unreadable referrer or a non-web scheme", () => {
    expect(classify(null)).toBeNull();
    expect(classify("")).toBeNull();
    expect(classify("not a url")).toBeNull();
    expect(classify("android-app://com.google.android.googlequicksearchbox")).toBeNull();
  });

  it("is null when the visitor is just moving around the site", () => {
    expect(classify("https://dienmayelc.com.vn/san-pham")).toBeNull();
    expect(classify("https://www.dienmayelc.com.vn/")).toBeNull();
  });

  it("does not mistake a look-alike host for the site or for a search engine", () => {
    expect(classify("https://dienmayelc.com.vn.evil.com/")).toMatchObject({ medium: "referral" });
    expect(classify("https://notgoogle.com/")).toMatchObject({ medium: "referral" });
  });
});
