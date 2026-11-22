import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { htmlToMarkdownPage } from "@/shared/lib/agent-markdown/from-html";

const BASE = "https://dienmayelc.com.vn";
const fx = (n: string) => readFileSync(path.join(__dirname, "fixtures", n), "utf8");
const conv = (html: string) => htmlToMarkdownPage(html, { publicBaseUrl: BASE });
const wrap = (main: string, head = "") =>
  `<html><head>${head}</head><body><header><a href="/x">SITE HEADER</a></header><main>${main}</main><footer>SITE FOOTER</footer></body></html>`;

describe("htmlToMarkdownPage: fixtures", () => {
  const product = conv(fx("product.html"));
  const category = conv(fx("category.html"));
  const news = conv(fx("news.html"));

  it("extracts <main> only and metadata from <head>", () => {
    expect(product.markdown).toContain("# Máy lạnh Daikin Inverter 1HP FTKB25ZVMV");
    expect(product.markdown).toContain("## Thông số kỹ thuật");
    expect(product.title).toMatch(/FTKB25ZVMV/);
    expect(product.description).toMatch(/9\.200 BTU/);
    expect(product.canonicalUrl).toBe(`${BASE}/san-pham/may-lanh-daikin-inverter-mot-chieu-1hp-ftkb25zvmv`);
    expect(product.updatedAt).toMatch(/^2026-/);
    expect(category.markdown).toContain("# Máy lạnh");
    expect(news.markdown).toContain("# Cool là gì trong điều hòa");
  });

  it("drops breadcrumbs, footer nav, scripts and hidden/aria-hidden content", () => {
    for (const r of [product, category, news]) {
      expect(r.markdown).not.toMatch(/Đường dẫn trang|Trang chủ \//);
      expect(r.markdown).not.toContain("<script");
      expect(r.markdown).not.toContain("@context");
    }
  });

  it("unwraps /_next/image and never leaks it, data: URIs or localhost", () => {
    for (const r of [product, category, news]) {
      expect(r.markdown).not.toContain("/_next/image");
      expect(r.markdown).not.toContain("data:image");
      expect(r.markdown).not.toMatch(/localhost|127\.0\.0\.1/);
    }
    expect(product.markdown).toContain("![Máy lạnh Daikin Inverter 1HP FTKB25ZVMV](https://pub-");
  });

  it("makes every link absolute", () => {
    for (const r of [product, category, news]) {
      expect(r.markdown).not.toMatch(/\]\(\/[^)]/);
      expect(r.markdown).toContain(`](${BASE}/`);
    }
  });

  it("fills collapsed FAQ answers from the FAQPage JSON-LD of the same HTML", () => {
    expect(product.markdown).toContain("## Câu hỏi thường gặp");
    expect(product.markdown).toMatch(/Dùng gas R32/);
    expect(category.markdown).toMatch(/Câu hỏi thường gặp[\s\S]*Máy lạnh giá bao nhiêu\?/);
  });

  it("has no consecutive duplicate blocks and no triple blank lines", () => {
    for (const r of [product, category, news]) {
      const blocks = r.markdown.split("\n\n");
      for (let i = 1; i < blocks.length; i++) {
        if (blocks[i].length >= 3) expect(blocks[i]).not.toBe(blocks[i - 1]);
      }
      expect(r.markdown).not.toMatch(/\n{3,}/);
    }
  });

  it("keeps no stray button labels", () => {
    for (const r of [product, category]) {
      expect(r.markdown).not.toMatch(/^(Lọc|Xem thêm nội dung|Mua ngay)$/m);
      expect(r.markdown).not.toMatch(/\[Mua ngay\]/);
    }
  });
});

describe("htmlToMarkdownPage: rules", () => {
  it("falls back to <body> without <main>", () => {
    const r = conv("<html><body><h1>Xin chào</h1><p>Nội dung</p></body></html>");
    expect(r.markdown).toBe("# Xin chào\n\nNội dung");
  });

  it("removes chrome and non-content elements", () => {
    const r = conv(
      wrap(
        `<h1>T</h1><p>keep</p><nav aria-label="Đường dẫn trang"><a href="/">Trang chủ</a></nav>
         <form><input name=q><button>Gửi</button></form><dialog>modal</dialog><iframe src="x"></iframe>
         <select><option>opt</option></select><textarea>ta</textarea><svg><text>svgtext</text></svg>
         <template><p>tpl</p></template><noscript>ns</noscript><div hidden>hid</div>
         <div aria-hidden="true">ah</div><style>.a{}</style><script>var a=1</script>`,
      ),
    );
    expect(r.markdown).toBe("# T\n\nkeep");
  });

  it("keeps content navs (not breadcrumbs/menus) and collapsed accordion text", () => {
    const r = conv(
      wrap(
        `<nav aria-label="Xem nhanh"><a href="/a">Nhanh A</a></nav>
         <h3><button data-slot="accordion-trigger">Câu hỏi?</button></h3>
         <div role="region" hidden>Trả lời đầy đủ</div>`,
      ),
    );
    expect(r.markdown).toContain(`[Nhanh A](${BASE}/a)`);
    expect(r.markdown).toContain("### Câu hỏi?");
    expect(r.markdown).toContain("Trả lời đầy đủ");
  });

  it("honours data-md-ignore", () => {
    const r = conv(wrap(`<p>yes</p><div data-md-ignore><p>secret widget</p></div>`));
    expect(r.markdown).toBe("yes");
  });

  it("unwraps next/image, drops data URIs and tracking pixels", () => {
    const r = conv(
      wrap(
        `<img src="/_next/image?url=https%3A%2F%2Fcdn.x%2Fa%20b.webp&amp;w=640&amp;q=75" alt="Ảnh">
         <img src="/_next/image?url=%2Fimages%2Flocal.png&amp;w=64&amp;q=75" alt="Local">
         <img src="data:image/gif;base64,R0lGOD" alt="blur">
         <img src="https://www.facebook.com/tr?id=1" width="1" height="1" alt="">
         <img src="https://cdn.x/px.gif" width="1" height="1" alt="">`,
      ),
    );
    expect(r.markdown).toContain("![Ảnh](https://cdn.x/a%20b.webp)");
    expect(r.markdown).toContain(`![Local](${BASE}/images/local.png)`);
    expect(r.markdown).not.toMatch(/data:|facebook|px\.gif/);
  });

  it("absolutizes links against publicBaseUrl, keeps mailto/tel, drops javascript:/empty/# links but keeps text", () => {
    const r = conv(
      wrap(
        `<a href="/dich-vu/x">dv</a> <a href="https://other.com/p">ext</a> <a href="mailto:a@b.c">mail</a>
         <a href="tel:0123">tel</a> <a href="javascript:void(0)">js</a> <a href="#top">top</a> <a href="">nolink</a>
         <a href="/empty"></a>`,
      ),
    );
    expect(r.markdown).toContain(`[dv](${BASE}/dich-vu/x)`);
    expect(r.markdown).toContain("[ext](https://other.com/p)");
    expect(r.markdown).toContain("(mailto:a@b.c)");
    expect(r.markdown).toContain("(tel:0123)");
    expect(r.markdown).not.toContain("javascript:");
    expect(r.markdown).not.toContain("(#top)");
    expect(r.markdown).toMatch(/js/);
    expect(r.markdown).not.toContain("[](");
  });

  it("collapses duplicated responsive blocks and drops empty headings/items", () => {
    const block = "<h2>Bảng giá</h2><p>Giá từ 6 triệu</p>";
    const r = conv(wrap(`<div class="md:hidden">${block}</div><div class="hidden md:block">${block}</div><h3> </h3><ul><li></li><li>ok</li></ul>`));
    expect(r.markdown.match(/## Bảng giá/g)).toHaveLength(1);
    expect(r.markdown).not.toMatch(/^#+\s*$/m);
    expect(r.markdown).toContain("- ok");
    expect(r.markdown).not.toMatch(/^-\s*$/m);
  });

  it("drops button-only noise but keeps 'Hiển thị thêm N sản phẩm'", () => {
    const r = conv(wrap(`<p>x</p><button>Mua ngay</button><button>Lọc</button><button>Hiển thị thêm 12 sản phẩm</button><p>Mua ngay</p>`));
    expect(r.markdown).toContain("Hiển thị thêm 12 sản phẩm");
    expect(r.markdown).not.toMatch(/Mua ngay|Lọc/);
  });

  it("reads dateModified (fallback datePublished) from JSON-LD, including @graph", () => {
    const ld = (o: unknown) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;
    expect(conv(wrap("<p>a</p>", ld({ "@graph": [{ "@type": "Article", datePublished: "2026-01-01", dateModified: "2026-02-02" }] }))).updatedAt).toBe("2026-02-02");
    expect(conv(wrap("<p>a</p>", ld({ datePublished: "2026-01-01" }))).updatedAt).toBe("2026-01-01");
    expect(conv(wrap("<p>a</p>", "<script type=\"application/ld+json\">{bad</script>")).updatedAt).toBeNull();
  });

  it("returns empty metadata gracefully", () => {
    const r = conv("<html><body><main><p>a</p></main></body></html>");
    expect(r).toMatchObject({ title: "", description: "", canonicalUrl: null, updatedAt: null });
  });
});

describe("htmlToMarkdownPage: readability", () => {
  const product = conv(fx("product.html"));
  const category = conv(fx("category.html"));
  const news = conv(fx("news.html"));

  describe("spec rows", () => {
    it("turns dl/dt/dd rows into '- **Label**: value' and keeps sub-section headings", () => {
      const r = conv(
        wrap(
          `<h2>Thông số</h2><dl><div><dt>Loại gas</dt><dd>R32</dd></div><div><dt>Điện năng</dt><dd>930 W</dd></div></dl>
           <h3>Dàn lạnh</h3><dl><dt>Trọng lượng</dt><dd>8 kg</dd><dt>Độ ồn</dt><dd>19 dBA</dd></dl>`,
        ),
      );
      expect(r.markdown).toBe(
        "## Thông số\n\n- **Loại gas**: R32\n- **Điện năng**: 930 W\n\n### Dàn lạnh\n\n- **Trọng lượng**: 8 kg\n- **Độ ồn**: 19 dBA",
      );
    });

    it("detects div/span two-cell rows when a container has several of them", () => {
      const rows = `<div><span>Màu</span><span>Trắng</span></div><div><span>Bảo hành</span><span>12 tháng</span></div><div><span>Xuất xứ</span><span>Thái Lan</span></div>`;
      const r = conv(wrap(`<section>${rows}</section>`));
      expect(r.markdown).toBe("- **Màu**: Trắng\n- **Bảo hành**: 12 tháng\n- **Xuất xứ**: Thái Lan");
      // fewer than 3 rows is not treated as a spec list
      expect(conv(wrap(`<section><div><span>a</span><span>b</span></div><div><span>c</span><span>d</span></div></section>`)).markdown).not.toContain("**");
    });

    it("renders the product fixture spec section as bold-label lines", () => {
      expect(product.markdown).toContain("- **Tình trạng sản phẩm**: Mới");
      expect(product.markdown).toContain("- **Công nghệ Inverter**: Có");
      expect(product.markdown).toMatch(/### Dàn lạnh\n\n- \*\*Kích thước \(Cao x Rộng x Sâu\)\*\*: 291 × 775 × 242 mm/);
      expect(product.markdown).toMatch(/### Dàn nóng\n\n- \*\*/);
      expect(product.markdown).not.toMatch(/Tình trạng sản phẩm\n\nMới/);
    });
  });

  describe("cards", () => {
    it("collapses an image+text link into '- [Title](url): secondary' without the image and repeated title", () => {
      const r = conv(
        wrap(
          `<a href="/san-pham/a"><div><img src="/a.png" alt="Máy A 1HP"><span>Còn hàng</span></div><div><span>daikin</span><h3>Máy A 1HP</h3></div>
           <div><span>MÁY A 1HP</span></div><div><span>9.000.000<span>đ</span></span></div></a>`,
        ),
      );
      expect(r.markdown).toBe(`- [Máy A 1HP](${BASE}/san-pham/a): Còn hàng · daikin · 9.000.000đ`);
    });

    it("keeps old price and discount readable and does not nest inside an existing list item", () => {
      const r = conv(
        wrap(
          `<ul><li><div><a href="/p"><img src="/p.png" alt="Máy B"><div><span>hot</span><h2>Máy B</h2></div>
           <div><span>31.308.000<span>đ</span></span><span><s>34.031.000<span>đ</span></s></span><span>-<!-- -->8<!-- -->%</span></div></a>
           <div><a href="https://zalo.me/1">Mua ngay</a></div></div></li></ul>`,
        ),
      );
      expect(r.markdown).toBe(`- [Máy B](${BASE}/p): hot · 31.308.000đ (giá cũ 34.031.000đ, -8%)`);
    });

    it("uses the alt as title for news cards and drops a title copy with odd spacing", () => {
      const r = conv(
        wrap(`<ul><li><a href="/tin-tuc/x"><img src="/x.png" alt="Bụi mịn PM2.5 là gì ?"><time>15 tháng 7, 2026</time><h3>Bụi mịn PM2.5 là gì ?</h3><p>Mô tả ngắn.</p></a></li></ul>`),
      );
      expect(r.markdown).toBe(`- [Bụi mịn PM2.5 là gì ?](${BASE}/tin-tuc/x): 15 tháng 7, 2026 · Mô tả ngắn.`);
    });

    it("handles image-less news cards and strips an UPPERCASE title copy opening the excerpt", () => {
      const r = conv(
        wrap(
          `<ul><li><a href="/tin-tuc/y"><div><time>17 tháng 11, 2026</time><h2>Chiller là gì?</h2><p>CHILLER LÀ GÌ? Trong các công trình lớn...</p></div></a></li></ul>
           <h2><a href="/dv">Chỉ tiêu đề</a></h2>`,
        ),
      );
      expect(r.markdown).toContain(`- [Chiller là gì?](${BASE}/tin-tuc/y): 17 tháng 11, 2026 · Trong các công trình lớn...`);
      expect(r.markdown).toContain(`## [Chỉ tiêu đề](${BASE}/dv)`);
    });

    it("leaves a plain captioned image link alone", () => {
      const r = conv(wrap(`<p><a href="/z"><img src="/z.png" alt="Logo">Logo</a></p>`));
      expect(r.markdown).toContain("![Logo]");
    });

    it("cleans related-product, category and news-index cards in the fixtures", () => {
      for (const r of [product, category, news]) {
        expect(r.markdown).not.toMatch(/\[!\[[^\]]*\]\([^)]*\)[^\]]/); // no image-in-link blob
      }
      expect(product.markdown).toMatch(
        /^- \[Máy lạnh Daikin Inverter 1\.5HP FTKB35ZVMV\]\(https:\/\/dienmayelc\.com\.vn\/san-pham\/[^)]+\): Còn hàng · daikin · 11\.380\.000đ$/m,
      );
      expect(category.markdown).toMatch(/31\.308\.000đ \(giá cũ 34\.031\.000đ, -8%\)/);
      expect(news.markdown).toMatch(/^- \[Bụi mịn PM2\.5 là gì \?\]\([^)]+\): 15 tháng 7, 2026$/m);
    });
  });

  describe("reviews", () => {
    it("separates author and date and keeps the star rating text", () => {
      const r = conv(
        wrap(
          `<ul><li><div><span>Nguyễn Thị Ngọc Nhi</span><time datetime="2026-07-20">20/7/2026</time></div>
           <div role="img" aria-label="5.0 trên 5 sao"><svg></svg></div><p>Rất tốt</p></li></ul>`,
        ),
      );
      expect(r.markdown).toContain("Nguyễn Thị Ngọc Nhi — 20/7/2026");
      expect(r.markdown).toContain("5.0 trên 5 sao");
      expect(r.markdown).toContain("Rất tốt");
      expect(r.markdown).not.toContain("Nhi20/7/2026");
    });

    it("fixture review reads 'Name — date'", () => {
      expect(product.markdown).toContain("Nguyễn Thị Ngọc Nhi — 20/7/2026");
      expect(product.markdown).not.toMatch(/Nhi\s?20\/7\/2026/);
    });
  });

  describe("gallery", () => {
    it("puts leading image-only blocks after the H1 and summary, in one block, deduplicated", () => {
      const imgs = ["a", "b", "c", "d", "e"].map((n) => `<img src="/${n}.png" alt="SP">`).join("") + `<img src="/a.png" alt="SP">`;
      const r = conv(wrap(`<div>${imgs}</div><h1>Tên SP</h1><p>Model: X1</p><p>Mô tả</p>`));
      const [h1, summary, gallery, rest] = r.markdown.split("\n\n");
      expect(h1).toBe("# Tên SP");
      expect(summary).toBe("Model: X1");
      expect(gallery.split("\n")).toHaveLength(5);
      expect(gallery).toContain(`![SP](${BASE}/e.png)`);
      expect(rest).toBe("Mô tả");
    });

    it("fixture: H1 comes first and all distinct gallery images are kept after it", () => {
      expect(product.markdown.startsWith("# Máy lạnh Daikin Inverter 1HP FTKB25ZVMV\n\nModel:")).toBe(true);
      const block = product.markdown.split("\n\n")[2];
      expect(block.split("\n")).toHaveLength(4);
      expect(block).toMatch(/^!\[/);
    });

    it("does not reorder when non-image content precedes the H1", () => {
      const r = conv(wrap(`<p>Intro</p><img src="/a.png" alt="A"><h1>T</h1>`));
      expect(r.markdown.startsWith("Intro")).toBe(true);
    });
  });
});
