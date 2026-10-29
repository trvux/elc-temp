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
    expect(res.headers.get("x-middleware-rewrite")).toBe(
      "https://dienmayelc.com.vn/agent-md/home",
    );
    expect(sharedProxy).not.toHaveBeenCalled();
  });

  it("keeps serving HTML for text/html and adds Vary: Accept", async () => {
    const res = await proxy(req("/", "text/html"));
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(sharedProxy).toHaveBeenCalled();
    expect(res.headers.get("vary")).toContain("Accept");
  });

  it("does not add Vary or rewrite on other paths", async () => {
    const res = await proxy(req("/san-pham", "text/markdown"));
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
