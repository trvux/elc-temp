// Post-processing for the HTML that Tiptap's generateHTML() produces, applied
// once in PreviewContent so every public page (product, service, news,
// project, page) gets the same fixes. Pure string work: no Tiptap, DOM or
// React imports, so it is cheap to run on the server and trivial to unit test.
//
// What generateHTML() gets right and this file does NOT touch: bold is
// <strong>, italic is <em>, underline <u>, strike <s>, inline code <code>,
// sup/sub, blockquote, lists, <pre><code>, <figure>/<figcaption>. Those are
// locked by shared/lib/__tests__/tiptap-render.test.ts.
//
// What it gets wrong, and what is fixed here:
//  - External links carry target="_blank" but no rel, so the opened page can
//    reach window.opener. Gets rel="noopener noreferrer".
//  - Tables put the header row inside <tbody> with bare <th> cells: no
//    <thead>, no scope, so screen readers cannot tie cells to their headers.
//    The leading all-<th> row becomes <thead> with scope="col"; a <th> that
//    starts a row of data cells gets scope="row".
//  - Cells always carry colspan="1" rowspan="1" noise.
//  - Tables have no <caption>; the scrollable wrapper is named after the
//    nearest heading above it so regions do not all share one label.
//  - Images have no loading/decoding hints, so every image in a long article
//    is fetched immediately.

// A start tag, tolerant of ">" inside quoted attribute values.
const ATTRS = `(?:[^>"']|"[^"]*"|'[^']*')*`;
const LINK_TAG = new RegExp(`<a\\b${ATTRS}>`, "g");
const IMG_TAG = new RegExp(`<img\\b${ATTRS}>`, "g");
const TABLE_BLOCK = /<table\b[\s\S]*?<\/table>/g;

function secureExternalLinks(html: string): string {
  return html.replace(LINK_TAG, (tag) => {
    if (!/\starget="_blank"/.test(tag)) return tag;
    if (/\srel="/.test(tag)) {
      return tag.replace(/\srel="([^"]*)"/, (_match, value: string) => {
        const tokens = new Set(value.split(/\s+/).filter(Boolean));
        tokens.add("noopener");
        tokens.add("noreferrer");
        return ` rel="${[...tokens].join(" ")}"`;
      });
    }
    return tag.replace(/>$/, ' rel="noopener noreferrer">');
  });
}

function lazyImages(html: string): string {
  return html.replace(IMG_TAG, (tag) => {
    let out = tag;
    if (!/\sloading=/.test(out)) out = out.replace(/\s*\/?>$/, (end) => ` loading="lazy"${end}`);
    if (!/\sdecoding=/.test(out)) out = out.replace(/\s*\/?>$/, (end) => ` decoding="async"${end}`);
    return out;
  });
}

function structureTable(block: string): string {
  let out = block.replace(/\scolspan="1"/g, "").replace(/\srowspan="1"/g, "");

  const bodyStart = out.indexOf("<tbody>");
  if (bodyStart === -1) return out;
  const rowsStart = bodyStart + "<tbody>".length;
  const firstRowEnd = out.indexOf("</tr>", rowsStart);
  if (firstRowEnd === -1) return out;

  const firstRow = out.slice(rowsStart, firstRowEnd + "</tr>".length);
  if (/<th\b/.test(firstRow) && !/<td\b/.test(firstRow)) {
    const headRow = firstRow.replace(/<th\b/g, '<th scope="col"');
    out =
      out.slice(0, bodyStart) +
      `<thead>${headRow}</thead><tbody>` +
      out.slice(firstRowEnd + "</tr>".length);
  }

  // A <th> that leads a row of data cells is a row header.
  return out.replace(/<tr>([\s\S]*?)<\/tr>/g, (row, inner: string) =>
    /<th\b/.test(inner) && /<td\b/.test(inner) && !/\sscope=/.test(inner)
      ? row.replace(/<th\b/, '<th scope="row"')
      : row,
  );
}

const HEADING = /<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>/g;
const FALLBACK_TABLE_LABEL = "Bảng dữ liệu";

// A scrollable region (a <section> with a name is a region landmark) needs a name, and several regions on one page must not
// share the same name (axe: landmark-unique). Tiptap tables have no <caption>,
// so the nearest heading above the table names it instead.
function labelFor(htmlBefore: string): string {
  const last = [...htmlBefore.matchAll(HEADING)].pop();
  const text = last ? last[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() : "";
  return (text || FALLBACK_TABLE_LABEL).replace(/"/g, "&quot;");
}

function wrapTables(html: string): string {
  return html.replace(
    TABLE_BLOCK,
    (block, offset: number) =>
      `<section class="table-wrapper" tabindex="0" aria-label="${labelFor(html.slice(0, offset))}">${structureTable(block)}</section>`,
  );
}

export function enhanceTiptapHtml(html: string): string {
  return lazyImages(secureExternalLinks(wrapTables(html)));
}
