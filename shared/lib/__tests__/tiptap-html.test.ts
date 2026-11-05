import { describe, expect, it } from "vitest";
import { enhanceTiptapHtml } from "@/shared/lib/tiptap-html";

describe("enhanceTiptapHtml: links", () => {
  it("adds rel to a link that opens a new tab", () => {
    const out = enhanceTiptapHtml('<p><a target="_blank" class="x" href="https://example.com">a</a></p>');
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener noreferrer"');
  });

  it("merges into an existing rel instead of replacing it", () => {
    const out = enhanceTiptapHtml('<a target="_blank" rel="nofollow" href="https://example.com">a</a>');
    expect(out).toMatch(/rel="nofollow noopener noreferrer"/);
  });

  it("leaves same-tab links alone", () => {
    const html = '<a class="x" href="/dich-vu">a</a>';
    expect(enhanceTiptapHtml(html)).toBe(html);
  });
});

describe("enhanceTiptapHtml: images", () => {
  it("adds lazy loading and async decoding", () => {
    const out = enhanceTiptapHtml('<img class="x" src="/a.webp" alt="a">');
    expect(out).toContain('loading="lazy"');
    expect(out).toContain('decoding="async"');
  });

  it("does not override hints that are already set", () => {
    const out = enhanceTiptapHtml('<img src="/a.webp" alt="a" loading="eager" decoding="sync">');
    expect(out).toContain('loading="eager"');
    expect(out).toContain('decoding="sync"');
    expect(out.match(/loading=/g)).toHaveLength(1);
  });

  it("survives a > inside an attribute value", () => {
    const out = enhanceTiptapHtml('<img src="/a.webp" alt="a > b">');
    expect(out).toContain('alt="a > b"');
    expect(out).toContain('loading="lazy"');
  });
});

describe("enhanceTiptapHtml: tables", () => {
  const cell = (tag: "th" | "td", body: string) => `<${tag} colspan="1" rowspan="1"><p>${body}</p></${tag}>`;
  const table = (rows: string[]) =>
    `<table class="w-full"><colgroup><col></colgroup><tbody>${rows.map((r) => `<tr>${r}</tr>`).join("")}</tbody></table>`;

  it("moves a leading all-th row into thead with scope=col", () => {
    const out = enhanceTiptapHtml(table([cell("th", "A") + cell("th", "B"), cell("td", "1") + cell("td", "2")]));
    expect(out).toMatch(/<thead><tr><th scope="col"><p>A<\/p><\/th><th scope="col"><p>B<\/p><\/th><\/tr><\/thead>/);
    expect(out).toMatch(/<tbody><tr><td>/);
    expect(out.match(/<thead>/g)).toHaveLength(1);
  });

  it("keeps colgroup before thead", () => {
    const out = enhanceTiptapHtml(table([cell("th", "A"), cell("td", "1")]));
    expect(out.indexOf("<colgroup>")).toBeLessThan(out.indexOf("<thead>"));
  });

  it("does not create thead when the first row has data cells", () => {
    const out = enhanceTiptapHtml(table([cell("td", "1") + cell("td", "2")]));
    expect(out).not.toContain("<thead>");
  });

  it("marks a th that leads a row of data cells as scope=row", () => {
    const out = enhanceTiptapHtml(table([cell("th", "H1") + cell("th", "H2"), cell("th", "Row") + cell("td", "1")]));
    expect(out).toMatch(/<th scope="row"><p>Row<\/p><\/th><td>/);
  });

  it("drops colspan=1 and rowspan=1 noise but keeps real spans", () => {
    const out = enhanceTiptapHtml(
      table([cell("td", "1")]).replace('<td colspan="1" rowspan="1">', '<td colspan="2" rowspan="1">'),
    );
    expect(out).toContain('colspan="2"');
    expect(out).not.toContain('rowspan="1"');
  });

  it("wraps every table in the scrollable region and falls back to a generic label", () => {
    const out = enhanceTiptapHtml(table([cell("td", "1")]) + table([cell("td", "2")]));
    expect(out.match(/<section class="table-wrapper" tabindex="0" aria-label="Bảng dữ liệu">/g)).toHaveLength(2);
    expect(out.match(/<\/table><\/section>/g)).toHaveLength(2);
  });

  it("names each region after the nearest heading above its table", () => {
    const out = enhanceTiptapHtml(
      `<h2>Chọn loại máy</h2>${table([cell("td", "1")])}<h3>Chọn <strong>công suất</strong> "đúng"</h3>${table([cell("td", "2")])}`,
    );
    expect(out).toContain('aria-label="Chọn loại máy"');
    expect(out).toContain('aria-label="Chọn công suất &quot;đúng&quot;"');
    expect(out).not.toContain('aria-label="Bảng dữ liệu"');
  });
});
