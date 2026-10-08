import { describe, expect, it, vi } from "vitest";

import { createPromClient } from "../infrastructure/prometheus";

function fakeFetch(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return vi.fn(async () => ({ ok: init.ok ?? true, status: init.status ?? 200, json: async () => body }) as Response);
}

describe("createPromClient", () => {
  it("parses instant vectors and turns NaN / Inf into null instead of printing them", async () => {
    const fetchImpl = fakeFetch({
      status: "success",
      data: {
        resultType: "vector",
        result: [
          { metric: { route: "/a" }, value: [1, "0.5"] },
          { metric: { route: "/b" }, value: [1, "NaN"] },
          { metric: { route: "/c" }, value: [1, "+Inf"] },
        ],
      },
    });
    const samples = await createPromClient("http://prom", fetchImpl).instant("up");
    expect(samples.map((s) => s.value)).toEqual([0.5, null, null]);
    expect(samples[0].metric.route).toBe("/a");
  });

  it("parses range matrices into millisecond timestamps", async () => {
    const fetchImpl = fakeFetch({
      status: "success",
      data: { resultType: "matrix", result: [{ metric: {}, values: [[100, "1"], [130, "NaN"]] }] },
    });
    const series = await createPromClient("http://prom", fetchImpl).range("q", 100, 130, 30);
    expect(series[0].points).toEqual([{ t: 100000, v: 1 }, { t: 130000, v: null }]);
  });

  it("encodes the query and sends range parameters", async () => {
    const fetchImpl = fakeFetch({ status: "success", data: { resultType: "vector", result: [] } });
    await createPromClient("http://prom", fetchImpl).range('rate(x{job="a b"}[5m])', 10, 20, 5);
    const url = new URL((fetchImpl.mock.calls[0] as unknown as [string])[0]);
    expect(url.pathname).toBe("/api/v1/query_range");
    expect(url.searchParams.get("query")).toBe('rate(x{job="a b"}[5m])');
    expect(url.searchParams.get("start")).toBe("10");
    expect(url.searchParams.get("step")).toBe("5");
  });

  it("rejects on an HTTP error", async () => {
    const client = createPromClient("http://prom", fakeFetch({}, { ok: false, status: 503 }));
    await expect(client.instant("up")).rejects.toThrow("503");
  });

  it("rejects with Prometheus's own message when the query is invalid", async () => {
    const client = createPromClient("http://prom", fakeFetch({ status: "error", error: "parse error" }));
    await expect(client.instant("bad(")).rejects.toThrow("parse error");
  });

  it("rejects when the connection fails", async () => {
    const client = createPromClient("http://prom", vi.fn(async () => { throw new Error("ECONNREFUSED"); }) as unknown as typeof fetch);
    await expect(client.instant("up")).rejects.toThrow("ECONNREFUSED");
  });
});
