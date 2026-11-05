import { describe, expect, it } from "vitest";
import { buildNavGroups, type ServiceNavRef } from "../navigation";

const build = (services: ServiceNavRef[]) =>
  buildNavGroups({ groupCategories: [], categoriesList: [], brands: [], services, projectTypes: [] });

const svc = (id: string, line: ServiceNavRef["line"]): ServiceNavRef => ({
  id,
  name: `Dịch vụ ${id}`,
  href: `/dich-vu/${id}`,
  line,
});

describe("buildNavGroups: Dịch vụ", () => {
  it("is a plain link to the hub when no service is published", () => {
    const entry = build([]).find((g) => g.label === "Dịch vụ");
    expect(entry).toBeDefined();
    expect(entry?.href).toBe("/dich-vu");
    expect(entry?.columns).toBeUndefined();
  });

  it("lists one column per line in hub order, main business first and big, then the hub link", () => {
    const entry = build([svc("a", "dich-vu"), svc("b", "thi-cong"), svc("c", "dich-vu")]).find(
      (g) => g.label === "Dịch vụ",
    );
    const cols = entry?.columns ?? [];
    expect(cols.map((c) => c.heading)).toEqual(["Thi công hệ thống", "Dịch vụ máy lạnh", "Xem thêm"]);
    expect(cols[0].big).toBe(true);
    expect(cols[0].links.map((l) => l.href)).toEqual(["/dich-vu/b"]);
    expect(cols[1].links.map((l) => l.href)).toEqual(["/dich-vu/a", "/dich-vu/c"]);
    expect(cols[2].links).toEqual([{ label: "Tất cả dịch vụ", href: "/dich-vu" }]);
  });

  it("sits right after Sản phẩm", () => {
    const labels = build([svc("a", "thi-cong")]).map((g) => g.label);
    expect(labels.indexOf("Dịch vụ")).toBe(labels.indexOf("Sản phẩm") + 1);
  });
});
