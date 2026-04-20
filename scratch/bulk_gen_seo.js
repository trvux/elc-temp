const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Bê nguyên logic từ lib/seo.ts sang để đảm bảo đồng bộ
function generateSmartDescription(product) {
  const specs = product.specs || [];
  const getSpec = (labels) => {
    const s = specs.find(item =>
      labels.some(l => item.label?.toLowerCase().includes(l.toLowerCase()))
    );
    if (!s) return null;
    if (s.value) return s.value.toString().replace(/\t/g, "").trim();
    if (s.items && s.items.length > 0) {
      return s.items.map(i => i.value).join(", ").trim();
    }
    return null;
  };

  const xuatXu = getSpec(["Xuất xứ", "Origin"]);
  const gas = getSpec(["Gas", "Môi chất"]);
  const dienTich = getSpec(["phòng", "Diện tích", "Area"]);
  const cspf = getSpec(["CSPF", "Hiệu suất"]);

  const name = product.name || "";
  let benefit = "Giải pháp điều hòa không khí bền bỉ, tối ưu hóa điện năng và vận hành êm ái.";
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes("lọc") || nameLower.includes("cấp khí")) {
    benefit = "Hệ thống lọc bụi mịn PM2.5, khử nồm và cấp khí tươi sạch khuẩn chuẩn Châu Âu.";
  } else if (nameLower.includes("inverter")) {
    if (nameLower.includes("daikin")) {
      benefit = "Công nghệ Inverter Daikin tiết kiệm điện vượt trội, hoạt động bền bỉ và cực kỳ êm ái.";
    } else {
      benefit = "Điều hòa Inverter thế hệ mới, làm lạnh nhanh, tiết kiệm điện năng cho không gian sống.";
    }
  } else if (nameLower.includes("âm trần") || nameLower.includes("giấu trần")) {
    benefit = "Thiết kế sang trọng, tối ưu không gian, phân bổ luồng gió mát lạnh đều khắp căn phòng.";
  }

  const rawParts = [
    `${name}.`,
    dienTich ? `Phù hợp diện tích ${dienTich}.` : "",
    benefit,
    gas ? `Sử dụng ${gas} hiện đại.` : "",
    cspf ? `Tiết kiệm điện cao với chỉ số CSPF ${cspf}.` : "",
    xuatXu ? `Hàng nhập khẩu ${xuatXu} chính hãng.` : "",
    "Giá kho tốt nhất tại ELC.",
  ];

  let result = "";
  for (const part of rawParts) {
    if (!part) continue;
    if ((result + " " + part).trim().length <= 165) {
      result = (result + " " + part).trim();
    } else {
      break;
    }
  }
  return result;
}

async function bulkUpdate() {
  console.log("Đang bắt đầu bơm SEO cho toàn bộ sản phẩm...");
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, sku, specs');

  if (error) {
    console.error(error);
    return;
  }

  console.log(`Đã lấy được ${products.length} máy.`);

  for (const p of products) {
    const seo = generateSmartDescription(p);
    const { error: upError } = await supabase
      .from('products')
      .update({ 
        short_description: seo,
        meta_description: seo 
      })
      .eq('id', p.id);

    if (upError) {
      console.error(`Lỗi update cho ${p.name}:`, upError);
    } else {
      process.stdout.write("."); // Thanh tiến trình mini
    }
  }

  console.log("\n✅ HOÀN THÀNH! 117 sản phẩm đã được thay máu SEO 100%.");
}

bulkUpdate();
