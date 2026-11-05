// @vitest-environment node
import { describe, expect, it } from "vitest";
import { generateHTML } from "@tiptap/html/server";
import { getTiptapExtensionsForRender, normalizeTiptapJson } from "@/shared/lib/tiptap-render";

// Locks the mapping from Tiptap marks/nodes to HTML elements for everything
// that reaches a public page. If an extension upgrade or a config change ever
// turns bold into <b> or italic into <i>, or drops <figcaption>, this fails.

const text = (value: string, marks?: Array<{ type: string; attrs?: Record<string, unknown> }>) => ({
  type: "text",
  text: value,
  ...(marks ? { marks } : {}),
});

const render = (...content: unknown[]) =>
  generateHTML(normalizeTiptapJson({ type: "doc", content }) as never, getTiptapExtensionsForRender());

const paragraph = (...children: unknown[]) => ({ type: "paragraph", content: children });

describe("Tiptap render: semantic elements", () => {
  it("maps marks to the semantic inline elements", () => {
    const html = render(
      paragraph(
        text("b", [{ type: "bold" }]),
        text("i", [{ type: "italic" }]),
        text("u", [{ type: "underline" }]),
        text("s", [{ type: "strike" }]),
        text("c", [{ type: "code" }]),
        text("p", [{ type: "superscript" }]),
        text("q", [{ type: "subscript" }]),
        text("h", [{ type: "highlight", attrs: { color: "#ff0" } }]),
      ),
    );
    expect(html).toContain("<strong>b</strong>");
    expect(html).toContain("<em>i</em>");
    expect(html).toContain("<u>u</u>");
    expect(html).toContain("<s>s</s>");
    expect(html).toContain("<code>c</code>");
    expect(html).toContain("<sup>p</sup>");
    expect(html).toContain("<sub>q</sub>");
    expect(html).toMatch(/<mark\b[^>]*>h<\/mark>/);
  });

  it("never emits presentational elements for bold or italic", () => {
    const html = render(
      paragraph(text("x", [{ type: "bold" }, { type: "italic" }])),
    );
    expect(html).toMatch(/<strong>.*<em>x<\/em>.*<\/strong>|<em>.*<strong>x<\/strong>.*<\/em>/);
    expect(html).not.toMatch(/<(b|i|font|center)\b/);
  });

  it("maps block nodes to the semantic block elements", () => {
    const html = render(
      { type: "heading", attrs: { level: 2 }, content: [text("h2")] },
      { type: "heading", attrs: { level: 3 }, content: [text("h3")] },
      { type: "bulletList", content: [{ type: "listItem", content: [paragraph(text("li"))] }] },
      { type: "orderedList", attrs: { start: 1 }, content: [{ type: "listItem", content: [paragraph(text("oli"))] }] },
      { type: "blockquote", content: [paragraph(text("quote"))] },
      { type: "codeBlock", attrs: { language: null }, content: [text("code")] },
      { type: "horizontalRule" },
    );
    expect(html).toContain("<h2>h2</h2>");
    expect(html).toContain("<h3>h3</h3>");
    expect(html).toMatch(/<ul>\s*<li>/);
    expect(html).toMatch(/<ol>\s*<li>/);
    expect(html).toContain("<blockquote>");
    expect(html).toMatch(/<pre><code>code<\/code><\/pre>/);
    expect(html).toContain("<hr");
  });

  it("wraps a captioned image in figure and figcaption", () => {
    const html = render({ type: "image", attrs: { src: "/a.webp", alt: "alt", title: "caption" } });
    expect(html).toContain("<figure>");
    expect(html).toContain("<figcaption>caption</figcaption>");
  });

  it("clamps headings to the allowed levels (body never has an h1)", () => {
    const html = render({ type: "heading", attrs: { level: 1 }, content: [text("old h1")] });
    expect(html).toContain("<h2>old h1</h2>");
    expect(html).not.toContain("<h1");
  });
});

describe("normalizeTiptapJson: empty text nodes", () => {
  const tableWithEmptyHeader = {
    type: "table",
    content: [
      {
        type: "tableRow",
        content: [
          { type: "tableHeader", attrs: { colspan: 1, rowspan: 1, colwidth: null }, content: [paragraph(text(""))] },
          { type: "tableHeader", attrs: { colspan: 1, rowspan: 1, colwidth: null }, content: [paragraph(text("Cột"))] },
        ],
      },
    ],
  };

  it("does not throw and keeps the rest of the document", () => {
    const html = render(paragraph(text("giữ lại")), tableWithEmptyHeader);
    expect(html).toContain("<p>giữ lại</p>");
    expect(html).toContain("Cột");
  });

  it("leaves a paragraph without children as a valid empty paragraph", () => {
    const html = render(paragraph(text("")));
    expect(html).toContain("<p></p>");
  });
});
