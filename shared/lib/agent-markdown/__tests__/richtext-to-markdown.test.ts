import { describe, expect, it } from "vitest";
import { richTextToMarkdown } from "../richtext-to-markdown";

const t = (text: string, marks?: unknown[]) => ({ type: "text", text, ...(marks ? { marks } : {}) });
const p = (...c: unknown[]) => ({ type: "paragraph", content: c });
const doc = (...c: unknown[]) => ({ type: "doc", content: c });
const B = "https://example.test";

describe("richTextToMarkdown", () => {
  it("renders paragraphs and headings with blank lines between", () => {
    const md = richTextToMarkdown(
      doc({ type: "heading", attrs: { level: 2 }, content: [t("Title")] }, p(t("Body")), p(t("Two"))),
      { baseUrl: B },
    );
    expect(md).toBe("## Title\n\nBody\n\nTwo");
  });

  it("renders marks", () => {
    const md = richTextToMarkdown(
      doc(p(t("b", [{ type: "bold" }]), t(" "), t("i", [{ type: "italic" }]), t(" "), t("c", [{ type: "code" }]), t(" "), t("l", [{ type: "link", attrs: { href: "https://x.test/a" } }]))),
    );
    expect(md).toBe("**b** *i* `c` [l](https://x.test/a)");
  });

  it("renders hardBreak, hr, blockquote", () => {
    const md = richTextToMarkdown(
      doc(p(t("a"), { type: "hardBreak" }, t("b")), { type: "horizontalRule" }, { type: "blockquote", content: [p(t("q"))] }),
    );
    expect(md).toBe("a  \nb\n\n---\n\n> q");
  });

  it("renders bullet, ordered and nested lists", () => {
    const li = (...c: unknown[]) => ({ type: "listItem", content: c });
    const md = richTextToMarkdown(
      doc(
        { type: "bulletList", content: [li(p(t("a")), { type: "orderedList", content: [li(p(t("one"))), li(p(t("two")))] }), li(p(t("b")))] },
      ),
    );
    expect(md).toBe("- a\n  1. one\n  2. two\n- b");
  });

  it("renders tables as GFM", () => {
    const cell = (type: string, s: string) => ({ type, content: [p(t(s))] });
    const md = richTextToMarkdown(
      doc({
        type: "table",
        content: [
          { type: "tableRow", content: [cell("tableHeader", "H1"), cell("tableHeader", "H2")] },
          { type: "tableRow", content: [cell("tableCell", "a|b"), cell("tableCell", "c")] },
        ],
      }),
    );
    expect(md).toBe("| H1 | H2 |\n| --- | --- |\n| a\\|b | c |");
  });

  it("makes relative links and images absolute", () => {
    const md = richTextToMarkdown(
      doc(p(t("go", [{ type: "link", attrs: { href: "/san-pham/x" } }])), { type: "image", attrs: { src: "/img/a.png", alt: "A" } }),
      { baseUrl: B },
    );
    expect(md).toBe(`[go](${B}/san-pham/x)\n\n![A](${B}/img/a.png)`);
  });

  it("keeps absolute image URLs", () => {
    expect(richTextToMarkdown(doc({ type: "image", attrs: { src: "https://cdn.test/a.jpg" } }))).toBe("![](https://cdn.test/a.jpg)");
  });

  it("accepts JSON strings and returns empty for null/invalid", () => {
    expect(richTextToMarkdown(JSON.stringify(doc(p(t("hi")))))).toBe("hi");
    expect(richTextToMarkdown(null)).toBe("");
    expect(richTextToMarkdown(undefined)).toBe("");
    expect(richTextToMarkdown("not json {")).toBe("");
    expect(richTextToMarkdown(42)).toBe("");
  });

  it("falls back to child text for unknown nodes", () => {
    const md = richTextToMarkdown(doc({ type: "mystery", content: [t("kept")] }, p(t("after"))));
    expect(md).toBe("kept\n\nafter");
  });

  it("renders contentVariable text", () => {
    const md = richTextToMarkdown(doc(p(t("Có "), { type: "contentVariable", attrs: { fallbackText: "10", resolvedText: "12" } })));
    expect(md).toBe("Có 12");
  });

  it("truncates at a block boundary with an ellipsis", () => {
    const d = doc(p(t("aaaa")), p(t("bbbb")), p(t("cccc")));
    expect(richTextToMarkdown(d, { maxChars: 12 })).toBe("aaaa\n\nbbbb\n\n…");
    expect(richTextToMarkdown(d, { maxChars: 100 })).toBe("aaaa\n\nbbbb\n\ncccc");
  });
});
