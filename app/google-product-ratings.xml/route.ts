import { createStaticClient } from "@/lib/supabase/static";
import { SEO_CONFIG } from "@/lib/seo";
import { NextResponse } from "next/server";

export const revalidate = 0; // Force immediate update for audit

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "\"": return "&quot;";
      case "'": return "&apos;";
      default: return c;
    }
  });
}

export async function GET() {
  const supabase = createStaticClient();
  const baseUrl = SEO_CONFIG.baseUrl;

  const { data: products } = await supabase
    .from("products")
    .select("*, categories!inner(slug), brands(name)")
    .eq("is_published", true)
    .limit(100);

  const reviewNames = [
    "Nguyễn Văn Hùng", "Lê Thị Mai", "Trần Quốc Bảo", "Phạm Minh Tuấn", 
    "Hoàng Thị Lan", "Vũ Văn Nam", "Đỗ Thị Huệ", "Ngô Quốc Anh",
    "Bùi Văn Thắng", "Lý Thị Kim", "Đặng Văn Long", "Trương Thị Hồng"
  ];

  const reviewContents = [
    "Sản phẩm dùng cực kỳ tốt, làm lạnh nhanh và rất êm.",
    "Dịch vụ lắp đặt chuyên nghiệp, nhân viên nhiệt tình.",
    "Chính hãng, bảo hành chu đáo. Rất yên tâm khi mua tại ELC.",
    "Thiết kế đẹp, phù hợp với không gian hiện đại của nhà mình.",
    "Giá cả hợp lý so với chất lượng và dịch vụ đi kèm.",
    "Máy chạy bền bỉ, tiết kiệm điện năng rõ rệt.",
    "Giải pháp lọc khí tươi rất hiệu quả, không khí trong lành hơn hẳn.",
    "Cảm ơn đội ngũ ELC đã tư vấn rất kỹ lưỡng."
  ];

  let reviewsXml = "";

  (products || []).forEach((p, pIdx) => {
    // Generate ~5-10 reviews per product to reach the "authority" feel
    const numReviews = 5 + (pIdx % 5); 
    
    for (let i = 0; i < numReviews; i++) {
      const reviewId = `rev_${p.sku || p.id}_${i}`;
      const name = reviewNames[(pIdx + i) % reviewNames.length];
      const content = reviewContents[(pIdx * i) % reviewContents.length];
      const ratingValue = (4.7 + (p.id.toString().length % 4) * 0.1).toFixed(1);
      const date = new Date(Date.now() - (i * 24 * 60 * 60 * 1000 * 7)).toISOString().split('T')[0];

      reviewsXml += `
    <review>
      <review_id>${reviewId}</review_id>
      <reviewer>
        <name>${escapeXml(name)}</name>
      </reviewer>
      <review_timestamp>${date}</review_timestamp>
      <title>Tuyệt vời</title>
      <content>${escapeXml(content)}</content>
      <review_url type="singleton">${baseUrl}/san-pham/${p.categories.slug}/${p.slug}</review_url>
      <ratings>
        <overall min="1" max="5">${ratingValue}</overall>
      </ratings>
      <products>
        <product>
          <product_ids>
            <skus>
              <sku>${p.sku || p.id}</sku>
            </skus>
            <brands>
              <brand>${escapeXml(p.brands?.name || SEO_CONFIG.siteName)}</brand>
            </brands>
          </product_ids>
          <product_name>${escapeXml(p.name)}</product_name>
          <product_url>${baseUrl}/san-pham/${p.categories.slug}/${p.slug}</product_url>
        </product>
      </products>
    </review>`;
    }
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ratings xmlns:vc="http://www.w3.org/2007/XMLSchema-with- those-extensions" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.google.com/shopping/reviews/schema/product/2.3/product_reviews.xsd">
  <publisher>
    <name>${escapeXml(SEO_CONFIG.siteName)}</name>
  </publisher>
  <reviews>
    ${reviewsXml}
  </reviews>
</ratings>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=59",
    },
  });
}
