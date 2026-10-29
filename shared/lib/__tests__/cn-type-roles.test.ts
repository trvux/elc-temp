import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { cn, TYPE_ROLES } from "@/shared/lib/utils";

describe("cn() with type-* roles", () => {
  it("later type-* beats earlier size/weight/leading/tracking", () => {
    expect(cn("text-lg font-bold leading-7 tracking-tight", "type-body")).toBe("type-body");
  });

  it("later size/weight beats earlier type-*", () => {
    expect(cn("type-body", "text-lg")).toBe("text-lg");
    expect(cn("type-body", "font-bold")).toBe("font-bold");
  });

  it("later type-* replaces earlier type-*", () => {
    expect(cn("type-body", "type-caption")).toBe("type-caption");
  });

  it("keeps color and spacing next to type-*", () => {
    expect(cn("type-caption text-muted-foreground mt-2")).toBe("type-caption text-muted-foreground mt-2");
    expect(cn("text-sm text-muted-foreground")).toBe("text-sm text-muted-foreground");
  });

  it("does not treat text colors as font sizes", () => {
    expect(cn("type-body", "text-foreground")).toBe("type-body text-foreground");
  });

  it("existing behavior unchanged for plain utilities", () => {
    expect(cn("px-2 px-4", "text-sm", "text-lg")).toBe("px-4 text-lg");
  });
});

describe("TYPE_ROLES stays in sync with globals.css", () => {
  const css = readFileSync(path.resolve(__dirname, "../../../app/globals.css"), "utf8");
  const defined = [...css.matchAll(/@utility type-([\w-]+)/g)].map((m) => m[1]).sort();
  it("lists exactly the @utility type-* that exist", () => {
    expect([...TYPE_ROLES].sort()).toEqual(defined);
  });
});
