import { beforeEach, describe, expect, it, vi } from "vitest";

// Each case dynamically imports a route module (and its data-layer imports); under a loaded machine the
// default 5 s is not always enough, which made this file flaky when run next to a dev server.
vi.setConfig({ testTimeout: 30_000 });

const serve = vi.hoisted(() => vi.fn());
vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("@/shared/lib/agent-markdown/page-markdown", () => ({ servePageMarkdown: serve }));

const slugCases: Array<[string, () => Promise<{ GET: (...a: never[]) => Promise<Response> }>, (s: string) => string]> = [
  ["du-an", () => import("@/app/agent-md/du-an/[slug]/route") as never, (s) => `/du-an/${s}`],
  ["dich-vu", () => import("@/app/agent-md/dich-vu/[slug]/route") as never, (s) => `/dich-vu/${s}`],
  ["thong-tin", () => import("@/app/agent-md/thong-tin/[slug]/route") as never, (s) => `/thong-tin/${s}`],
  ["trang", () => import("@/app/agent-md/trang/[slug]/route") as never, (s) => `/${s}`],
];
const fixedCases: Array<[string, () => Promise<{ GET: (...a: never[]) => Promise<Response> }>, string]> = [
  ["du-an", () => import("@/app/agent-md/du-an/route") as never, "/du-an"],
  ["dich-vu", () => import("@/app/agent-md/dich-vu/route") as never, "/dich-vu"],
  ["thong-tin", () => import("@/app/agent-md/thong-tin/route") as never, "/thong-tin"],
  ["home", () => import("@/app/agent-md/home/route") as never, "/"],
];

beforeEach(() => {
  serve.mockReset();
  serve.mockResolvedValue(new Response("ok", { status: 200 }));
});

describe("agent-md handlers use servePageMarkdown", () => {
  it.each(slugCases)("%s/[slug] passes its public path", async (_n, load, expected) => {
    const { GET } = await load();
    const req = new Request("http://x/");
    const res = await (GET as (r: Request, c: unknown) => Promise<Response>)(req, { params: Promise.resolve({ slug: "abc" }) });
    expect(res.status).toBe(200);
    expect(serve).toHaveBeenCalledWith(expect.objectContaining({ request: req, publicPath: expected("abc") }));
  });

  it.each(slugCases)("%s/[slug] sends an invalid slug to legacy, not servePageMarkdown", async (_n, load) => {
    const { GET } = await load();
    try {
      await (GET as (r: Request, c: unknown) => Promise<Response>)(new Request("http://x/"), {
        params: Promise.resolve({ slug: ".." }),
      });
    } catch {
      // legacy hits the DB layer, which is unavailable in unit tests
    }
    expect(serve).not.toHaveBeenCalled();
  });

  it.each(fixedCases)("%s passes its public path", async (_n, load, path) => {
    const { GET } = await load();
    const req = new Request("http://x/");
    await (GET as (r: Request) => Promise<Response>)(req);
    expect(serve).toHaveBeenCalledWith(expect.objectContaining({ request: req, publicPath: path }));
  });
});
