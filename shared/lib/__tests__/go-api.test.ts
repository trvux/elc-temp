import { beforeEach, describe, expect, it, vi } from "vitest";

const headersMock = vi.fn();

vi.mock("next/headers", () => ({
  headers: () => headersMock(),
  cookies: vi.fn(),
}));

import { clientIpHeaders } from "../go-api";

function withForwardedFor(value: string | null) {
  headersMock.mockResolvedValue(new Headers(value === null ? {} : { "x-forwarded-for": value }));
}

describe("clientIpHeaders", () => {
  // Braces matter: returning the mock from beforeEach makes vitest treat it as
  // a teardown function and call it after every test.
  beforeEach(() => {
    headersMock.mockReset();
  });

  it("forwards the single address nginx set", async () => {
    withForwardedFor("198.51.100.7");
    expect(await clientIpHeaders()).toEqual({ "X-Forwarded-For": "198.51.100.7" });
  });

  it("takes the LAST entry, matching how elc-go reads the header", async () => {
    withForwardedFor("1.2.3.4, 198.51.100.7");
    expect(await clientIpHeaders()).toEqual({ "X-Forwarded-For": "198.51.100.7" });
  });

  it("forwards an IPv6 address", async () => {
    withForwardedFor("2001:db8::1");
    expect(await clientIpHeaders()).toEqual({ "X-Forwarded-For": "2001:db8::1" });
  });

  it("trims whitespace", async () => {
    withForwardedFor("  198.51.100.9  ");
    expect(await clientIpHeaders()).toEqual({ "X-Forwarded-For": "198.51.100.9" });
  });

  it("drops a value that is not an IP instead of relaying it to Go", async () => {
    withForwardedFor("not-an-ip; DROP TABLE");
    expect(await clientIpHeaders()).toEqual({});
  });

  it("returns nothing when nginx didn't set the header (local dev)", async () => {
    withForwardedFor(null);
    expect(await clientIpHeaders()).toEqual({});
  });

  it("returns nothing outside a request scope (headers() throws)", async () => {
    headersMock.mockImplementation(() => {
      throw new Error("headers() was called outside a request scope");
    });
    expect(await clientIpHeaders()).toEqual({});
  });

  it("also survives headers() rejecting asynchronously", async () => {
    headersMock.mockImplementation(() => Promise.reject(new Error("no request scope")));
    expect(await clientIpHeaders()).toEqual({});
  });
});
