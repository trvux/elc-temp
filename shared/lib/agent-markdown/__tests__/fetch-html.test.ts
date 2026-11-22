import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchOwnHtml } from "@/shared/lib/agent-markdown/fetch-html";

const request = new Request("https://localhost:3000/agent-md/home");

afterEach(() => vi.unstubAllGlobals());

function stubFetch() {
  const fn = vi.fn(async (_url: string, _init?: RequestInit) => new Response("<html></html>", { status: 200 }));
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("fetchOwnHtml path validation", () => {
  it("accepts the homepage path and fetches loopback over http on the request's port", async () => {
    const fetchMock = stubFetch();
    await fetchOwnHtml(request, "/");
    expect(fetchMock.mock.calls[0][0]).toBe("http://127.0.0.1:3000/");
  });

  it("accepts section and detail paths", async () => {
    const fetchMock = stubFetch();
    await fetchOwnHtml(request, "/san-pham");
    await fetchOwnHtml(request, "/san-pham/may-lanh-1hp");
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([
      "http://127.0.0.1:3000/san-pham",
      "http://127.0.0.1:3000/san-pham/may-lanh-1hp",
    ]);
  });

  it("rejects anything that could escape the site or hit another host", async () => {
    stubFetch();
    for (const bad of ["", "san-pham", "//evil.com", "/../etc/passwd", "/a/../b", "/a?x=1", "/a#b", "/a b", "http://evil.com/"]) {
      await expect(fetchOwnHtml(request, bad), bad).rejects.toThrow("invalid path");
    }
  });
});
