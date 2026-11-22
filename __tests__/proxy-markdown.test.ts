import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const sharedProxy = vi.fn();
vi.mock("@/shared/proxy", () => ({ proxy: (r: NextRequest) => sharedProxy(r) }));
vi.mock("@/shared/lib/attribution-capture", () => ({ captureAttribution: vi.fn() }));

import { proxy } from "@/proxy";

function req(path: string, accept?: string, method = "GET") {
  return new NextRequest(`https://dienmayelc.com.vn${path}`, {
    method,
    headers: accept ? { accept } : {},
  });
}

beforeEach(() => {
  sharedProxy.mockReset();
  sharedProxy.mockImplementation(async () => NextResponse.next());
});

describe("proxy markdown negotiation", () => {
  it("rewrites / to the markdown handler when Accept prefers markdown", async () => {
    const res = await proxy(req("/", "text/markdown"));
    // The rewrite target is always plain http: the Node server never speaks TLS itself.
    expect(res.headers.get("x-middleware-rewrite")).toBe(
      "http://dienmayelc.com.vn/agent-md/home",
    );
    expect(sharedProxy).not.toHaveBeenCalled();
  });

  it("rewrites section pages, detail pages and the .md suffix to /agent-md", async () => {
    const rewrite = async (path: string, accept?: string) =>
      (await proxy(req(path, accept))).headers.get("x-middleware-rewrite");
    expect(await rewrite("/san-pham", "text/markdown")).toBe("http://dienmayelc.com.vn/agent-md/san-pham");
    expect(await rewrite("/san-pham/abc", "text/markdown")).toBe("http://dienmayelc.com.vn/agent-md/san-pham/abc");
    expect(await rewrite("/dich-vu/abc.md")).toBe("http://dienmayelc.com.vn/agent-md/dich-vu/abc");
    expect(await rewrite("/index.md")).toBe("http://dienmayelc.com.vn/agent-md/home");
  });

  it("keeps the rewrite http even when a proxy forwards X-Forwarded-Proto: https", async () => {
    // Regression: behind Cloudflare/nginx request.url is https://, and an https rewrite target made
    // Next proxy to itself over TLS (EPROTO -> 500) for every Markdown request on prod.
    const forwarded = new NextRequest("https://dienmayelc.com.vn/san-pham/abc", {
      headers: { accept: "text/markdown", "x-forwarded-proto": "https" },
    });
    const res = await proxy(forwarded);
    expect(res.headers.get("x-middleware-rewrite")).toMatch(/^http:\/\//);
  });

  it("keeps serving HTML for text/html and adds Vary: Accept", async () => {
    const res = await proxy(req("/", "text/html"));
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(sharedProxy).toHaveBeenCalled();
    expect(res.headers.get("vary")).toContain("Accept");
  });

  it("does not add Vary or rewrite on other paths", async () => {
    // /form has no Markdown representation, so Accept: text/markdown must not change anything.
    const res = await proxy(req("/form", "text/markdown"));
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("vary")).toBeNull();
  });

  it("does not rewrite non-read methods", async () => {
    const res = await proxy(req("/", "text/markdown", "POST"));
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("lets internal markdown handlers through without session logic", async () => {
    await proxy(req("/agent-md/home"));
    expect(sharedProxy).not.toHaveBeenCalled();
  });
});
