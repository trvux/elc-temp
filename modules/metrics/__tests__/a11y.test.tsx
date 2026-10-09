import axe from "axe-core";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { getMetricsSnapshot } from "../application/getMetricsSnapshot";
import { INSTANT } from "../domain/queries";
import type { MetricsSnapshot } from "../domain/types";
import { MetricsDashboard } from "../presentation/components/MetricsDashboard";
import { NOW, fakeClient, healthy, num, series } from "./fixtures";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

async function snapshot(mutate?: (data: ReturnType<typeof healthy>) => void): Promise<MetricsSnapshot> {
  const data = healthy();
  mutate?.(data);
  const { client } = fakeClient(data, (q) => series([[NOW - 60000, q.includes("0.99") ? 0.5 : 1], [NOW, 2]], { groupname: q.includes("namedprocess") ? "next" : "" }));
  return getMetricsSnapshot(client, "6h", NOW);
}

function mount(snap: MetricsSnapshot): HTMLElement {
  document.documentElement.lang = "vi";
  document.title = "Tình trạng hệ thống";
  // The page lives inside the admin layout's <main>; the test supplies it so
  // landmark rules judge the page content, not a missing wrapper.
  document.body.innerHTML = renderToStaticMarkup(
    <main>
      <MetricsDashboard snapshot={snap} />
    </main>,
  );
  return document.body;
}

// axe runs in jsdom, which has no layout engine, so colour contrast can't be
// measured there; it is checked arithmetically in the last describe block.
async function violations(root: HTMLElement) {
  const result = await axe.run(root, { rules: { "color-contrast": { enabled: false } } });
  return result.violations.map((v) => `${v.id}: ${v.help} -> ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
}

describe("accessibility: healthy page", () => {
  let root: HTMLElement;
  beforeAll(async () => {
    root = mount(await snapshot());
  });

  it("has no axe violations", async () => {
    expect(await violations(root)).toEqual([]);
  });

  it("has exactly one h1 and headings never skip a level", () => {
    expect(root.querySelectorAll("h1")).toHaveLength(1);
    const levels = [...root.querySelectorAll("h1,h2,h3,h4")].map((h) => Number(h.tagName[1]));
    for (let i = 1; i < levels.length; i++) expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
  });

  it("gives every card a heading, text status and a list-item wrapper", () => {
    const items = root.querySelectorAll("section ul > li");
    expect(items.length).toBeGreaterThanOrEqual(13);
    const cardHeadings = root.querySelectorAll("li h3");
    expect(cardHeadings).toHaveLength(13);
    for (const li of root.querySelectorAll("section ul > li:has(h3)")) {
      // Status is conveyed in words, not only colour.
      expect(li.textContent).toMatch(/Trạng thái: (Tốt|Cần chú ý|Cần xử lý|Thông tin|Chưa có dữ liệu)/);
    }
  });

  it("marks decorative icons as hidden from assistive technology", () => {
    const svgs = [...root.querySelectorAll("svg")].filter((svg) => !svg.closest(".recharts-wrapper"));
    expect(svgs.length).toBeGreaterThan(0);
    for (const svg of svgs) expect(svg.getAttribute("aria-hidden")).toBe("true");
  });

  it("announces the overall verdict through a live region", () => {
    const status = root.querySelector('[role="status"]');
    expect(status?.textContent).toContain("Mọi thứ đang bình thường");
  });

  it("range navigation is a labelled nav with the current range marked", () => {
    const nav = root.querySelector('nav[aria-label="Khoảng thời gian của biểu đồ"]');
    expect(nav).not.toBeNull();
    const current = nav!.querySelectorAll('[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0].textContent).toBe("6 giờ");
    expect(nav!.querySelectorAll("a")).toHaveLength(4);
  });

  it("every chart offers a data table with caption and scoped headers", () => {
    const figures = root.querySelectorAll("figure");
    expect(figures.length).toBeGreaterThanOrEqual(3);
    for (const fig of figures) {
      expect(fig.querySelector("details summary")).not.toBeNull();
      expect(fig.querySelector("table caption")).not.toBeNull();
      expect(fig.querySelectorAll('thead th[scope="col"]').length).toBeGreaterThanOrEqual(2);
      expect(fig.querySelectorAll('tbody th[scope="row"]').length).toBeGreaterThan(0);
      // A text summary sits next to the picture.
      expect(fig.querySelector("figcaption")?.textContent).toMatch(/mới nhất|Chưa có số liệu/);
    }
  });

  it("auto-refresh can be paused and every control has a name", () => {
    const buttons = [...root.querySelectorAll("button")];
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(["Làm mới ngay", "Tạm dừng tự làm mới"]);
    expect(buttons[1].getAttribute("aria-pressed")).toBe("false");
    expect(root.querySelector("time")?.getAttribute("datetime")).toBe(new Date(NOW).toISOString());
  });
});

describe("accessibility: other states", () => {
  it("unreachable Prometheus still renders an accessible page", async () => {
    const client = { instant: async () => { throw new Error("down"); }, range: async () => { throw new Error("down"); } };
    const root = mount(await getMetricsSnapshot(client, "6h", NOW));
    expect(await violations(root)).toEqual([]);
    expect(root.querySelector('[role="status"]')?.textContent).toContain("Không lấy được số liệu");
    expect(root.textContent).toContain("Chưa có đủ số liệu để vẽ biểu đồ");
    // Must not claim "no alerts" when the alert source could not be queried.
    expect(root.textContent).not.toContain("Hiện không có cảnh báo nào");
    expect(root.textContent).toContain("Không lấy được thông tin cảnh báo");
  });

  it("a critical alert is announced and listed, with no axe violations", async () => {
    const root = mount(
      await snapshot((d) => {
        d.set(INSTANT.firingAlerts, [{ metric: { alertname: "HostMemoryAvailableLow", severity: "critical" }, value: 1 }]);
        d.set(INSTANT.memoryAvailable, num(300 * 1024 ** 2));
      }),
    );
    expect(await violations(root)).toEqual([]);
    expect(root.querySelector('[role="status"]')?.textContent).toContain("Có vấn đề cần xử lý");
    expect(root.querySelector("#alerts-heading")?.closest("section")?.textContent).toContain("Máy chủ sắp hết bộ nhớ");
  });
});

// ---- colour contrast, computed (WCAG 1.4.3 needs 4.5:1 for normal text) -----
function channel(c: number) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}
function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}
function ratio(fg: string, bg: string) {
  const [a, b] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}
function blend(hex: string, over: string, alpha: number) {
  const f = parseInt(hex.slice(1), 16);
  const o = parseInt(over.slice(1), 16);
  const mix = (shift: number) => Math.round(((f >> shift) & 255) * alpha + ((o >> shift) & 255) * (1 - alpha));
  return `#${[16, 8, 0].map((s) => mix(s).toString(16).padStart(2, "0")).join("")}`;
}

describe("status colours meet 4.5:1 contrast", () => {
  // Hex values are the Tailwind palette steps the badge classes use (the v4
  // palette is defined in oklch; these are its sRGB equivalents, so ratios are
  // accurate to within rounding). Dark badges sit at 50% opacity over the
  // near-black card.
  const light: Array<[string, string, string]> = [
    ["ok", "#166534", "#f0fdf4"], // green-800 on green-50
    ["warn", "#78350f", "#fffbeb"], // amber-900 on amber-50
    ["bad", "#991b1b", "#fef2f2"], // red-800 on red-50
    ["info", "#0c4a6e", "#f0f9ff"], // sky-900 on sky-50
  ];
  const dark: Array<[string, string, string]> = [
    ["ok", "#86efac", blend("#052e16", "#0a0a0a", 0.5)], // green-300 on green-950/50
    ["warn", "#fcd34d", blend("#451a03", "#0a0a0a", 0.5)], // amber-300 on amber-950/50
    ["bad", "#fca5a5", blend("#450a0a", "#0a0a0a", 0.5)], // red-300 on red-950/50
    ["info", "#7dd3fc", blend("#082f49", "#0a0a0a", 0.5)], // sky-300 on sky-950/50
  ];

  it.each(light)("light %s", (_name, fg, bg) => expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5));
  it.each(dark)("dark %s", (_name, fg, bg) => expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5));
});
