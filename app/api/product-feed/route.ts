import { createStaticClient } from "@/shared/lib/supabase/static";
import { NextResponse } from "next/server";

interface FeedProduct {
  id: string;
  name: string;
  sku: string;
  slug: string;
  original_price: number | null;
  sale_price: number | null;
  images: string[] | null;
  description: unknown;
  stock_status: string | null;
  category: { slug: string } | null;
  brand: { name: string; slug: string } | null;
}

export async function GET() {
  const supabase = createStaticClient();

  // Fetch all published products with brand and category slug
  const { data: rawProducts, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      sku,
      slug,
      original_price,
      sale_price,
      images,
      description,
      stock_status,
      category:categories(slug),
      brand:brands(name, slug)
    `,
    )
    .eq("is_published", true)
    .is("deleted_at", null);

  if (error || !rawProducts) {
    return new NextResponse("Error fetching products", { status: 500 });
  }

  const products = rawProducts as unknown as FeedProduct[];

  const BASE_URL = "https://dienmayelc.com.vn";

  // Helper to escape special XML characters
  const escapeXml = (unsafe: string) => {
    if (!unsafe) return "";
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case "&":
          return "&amp;";
        case "'":
          return "&apos;";
        case '"':
          return "&quot;";
        default:
          return c;
      }
    });
  };

  // Helper to strip HTML tags for product description
  const stripHtml = (htmlStr: string) => {
    if (!htmlStr) return "";
    return htmlStr.replace(/<[^>]*>/g, "").trim();
  };

  interface DescriptionNode {
    text?: string;
    content?: DescriptionNode[];
  }

  // Helper to parse Tiptap JSON description if it is JSON
  const getProductDescription = (descJson: unknown, productName: string) => {
    try {
      if (!descJson) {
        return `Sản phẩm ${productName} chính hãng chất lượng cao tại Điện máy ELC.`;
      }
      if (typeof descJson === "string") {
        if (descJson.startsWith("{")) {
          const parsed = JSON.parse(descJson) as DescriptionNode;
          let text = "";
          const traverse = (node: DescriptionNode) => {
            if (node.text) text += node.text + " ";
            if (node.content) {
              node.content.forEach(traverse);
            }
          };
          traverse(parsed);
          return (
            text.trim() ||
            `Sản phẩm ${productName} chính hãng chất lượng cao tại Điện máy ELC.`
          );
        }
        return stripHtml(descJson);
      }
      if (typeof descJson === "object" && descJson !== null) {
        let text = "";
        const traverse = (node: DescriptionNode) => {
          if (node.text) text += node.text + " ";
          if (node.content) {
            node.content.forEach(traverse);
          }
        };
        traverse(descJson as DescriptionNode);
        return (
          text.trim() ||
          `Sản phẩm ${productName} chính hãng chất lượng cao tại Điện máy ELC.`
        );
      }
    } catch {
      // fallback
    }
    return `Sản phẩm ${productName} chính hãng chất lượng cao tại Điện máy ELC.`;
  };

  let xml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Điện máy ELC</title>
    <link>${BASE_URL}</link>
    <description>Siêu thị máy lạnh và Giải pháp không khí chính hãng, giá tốt nhất</description>
`;

  for (const prod of products) {
    const categorySlug = prod.category?.slug;
    const brandSlug = prod.brand?.slug;
    const brandName = prod.brand?.name || "ELC";

    if (!categorySlug || !brandSlug) continue;

    const productUrl = `${BASE_URL}/san-pham/${categorySlug}/${brandSlug}/${prod.slug}`;
    const imageUrl = prod.images?.[0] || "";
    const additionalImages =
      prod.images && prod.images.length > 1 ? prod.images.slice(1) : [];

    const id = prod.sku || prod.id;
    const title = escapeXml(`${prod.name} | Điện máy ELC`);
    const desc = escapeXml(
      getProductDescription(prod.description, prod.name).substring(0, 1000),
    );

    const priceVal = prod.original_price || prod.sale_price || 0;

    // Case 3: Giá Liên hệ (original_price & sale_price <= 0 hoặc rỗng)
    // Google Shopping bắt buộc phải có giá lớn hơn 0, nếu gửi giá 0 hoặc rỗng sẽ bị khóa tài khoản GMC.
    // Vì vậy, ta bắt buộc phải bỏ qua các sản phẩm "Liên hệ" khỏi Google Shopping Feed.
    if (priceVal <= 0) continue;

    const salePriceVal = prod.sale_price;

    const price = `${priceVal} VND`;

    let availability = "in_stock";
    if (prod.stock_status === "out_of_stock") {
      availability = "out_of_stock";
    } else if (prod.stock_status === "pre_order") {
      availability = "preorder";
    }

    xml += `    <item>
      <g:id>${escapeXml(id)}</g:id>
      <g:title>${title}</g:title>
      <g:description>${desc}</g:description>
      <g:link>${escapeXml(productUrl)}</g:link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>\n`;

    for (const imgUrl of additionalImages) {
      xml += `      <g:additional_image_link>${escapeXml(
        imgUrl,
      )}</g:additional_image_link>\n`;
    }

    xml += `      <g:availability>${availability}</g:availability>
      <g:price>${price}</g:price>
`;

    if (salePriceVal && salePriceVal < priceVal) {
      xml += `      <g:sale_price>${salePriceVal} VND</g:sale_price>\n`;
    }

    xml += `      <g:brand>${escapeXml(brandName)}</g:brand>\n`;
    if (prod.sku) {
      xml += `      <g:mpn>${escapeXml(prod.sku)}</g:mpn>\n`;
    }
    xml += `      <g:condition>new</g:condition>\n`;

    // Nếu là máy lạnh thì gán mã máy lạnh, còn lại gán mã điện máy chung
    if (
      categorySlug.includes("may-lanh") ||
      categorySlug.includes("dieu-hoa")
    ) {
      xml += `      <g:google_product_category>3429</g:google_product_category>\n`;
    } else {
      xml += `      <g:google_product_category>505307</g:google_product_category>\n`;
    }

    xml += `    </item>\n`;
  }

  xml += `  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, no-cache, no-transform",
    },
  });
}
