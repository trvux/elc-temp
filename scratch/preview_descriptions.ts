
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gdzihzsjfczuggwpykjk.supabase.co'
const supabaseKey = 'sb_secret_RxWGBdFX0qPBKWBpI-2Eeg_b3jplqTo'
const supabase = createClient(supabaseUrl, supabaseKey)

// --- FINAL DUAL-LAYER SEO LOGIC ---
function generateProductSmartDescription(product: any): string {
  const specs = product.specs || [];
  const getSpec = (labels: string[]) => {
    const s = specs.find((item: any) =>
      labels.some((l) => item.label?.toLowerCase().includes(l.toLowerCase())),
    );
    if (!s) return null;
    if (s.value) return s.value.toString().replace(/\t/g, "").trim();
    if (s.items && s.items.length > 0) {
      return s.items
        .map((i: any) => i.value)
        .join(", ")
        .replace(/\t/g, "")
        .trim();
    }
    return null;
  };

  const xuatXu = getSpec(["Xuất xứ", "Origin"]);
  const gas = getSpec(["Gas", "Môi chất"]);
  const dienTich = getSpec(["phòng", "Diện tích", "Area", "Phạm vi"]);
  const cspf = getSpec(["CSPF", "Hiệu suất"]);

  const name = product.name || "";
  const sku = product.sku || "";
  const nameLower = name.toLowerCase();
  const seed = (sku + name).length % 3;

  let roomTarget = "";
  let serviceHighlight = "Thi công trọn gói, lắp đặt chuyên nghiệp";
  let targetAudience = ""; // Dành cho người không chuyên
  
  if (nameLower.includes("1hp") || nameLower.includes("1.5hp")) {
    roomTarget = "phòng ngủ, căn hộ nhỏ";
    targetAudience = "Giải pháp làm lạnh êm ái, bảo vệ giấc ngủ";
  } else if (nameLower.includes("2hp") || nameLower.includes("2.5hp") || nameLower.includes("3hp")) {
    roomTarget = "phòng khách, shop thời trang, căn hộ cao cấp";
    targetAudience = "Làm lạnh nhanh, thiết kế sang trọng cho không gian chung";
    serviceHighlight = "Tư vấn thiết kế & thi công thẩm mỹ";
  } else if (nameLower.includes("4hp") || nameLower.includes("5hp") || nameLower.includes("6hp") || nameLower.includes("10hp")) {
    roomTarget = "văn phòng, nhà hàng, biệt thự lớn";
    targetAudience = "Hệ thống công suất lớn, vận hành bền bỉ";
    serviceHighlight = "Giải pháp hệ thống điều hòa trung tâm chuyên sâu";
  }

  const genericBenefits = [
    `${targetAudience || "Giải pháp điều hòa bền bỉ"}. ${serviceHighlight} bởi đội ngũ kỹ thuật ELC.`,
    `Không gian mát lạnh${roomTarget ? ` cho ${roomTarget}` : ""}. ELC thiết kế hệ thống tối ưu thẩm mỹ và công suất.`,
    `Vận hành cực êm, độ bền cao. Dịch vụ thi công lắp đặt trọn gói, bảo hành chính hãng dài lâu.`,
  ];
  const inverterBenefits = [
    `Công nghệ Inverter tiết kiệm điện tối đa${roomTarget ? ` cho ${roomTarget}` : ""}. ELC tư vấn thiết kế trọn gói.`,
    `Làm lạnh nhanh, vận hành thông minh. Giải pháp điều hòa tối ưu chi phí và thẩm mỹ công trình.`,
    `Tận hưởng không khí mát lành, êm ái. Kỹ thuật thi công chuyên nghiệp, chuẩn xác từng chi tiết.`,
  ];

  let benefit = genericBenefits[seed];
  if (nameLower.includes("lọc") || nameLower.includes("cấp khí") || nameLower.includes("khử nồm")) {
    benefit = "Giải pháp không khí sạch, thoáng đãng, lọc bụi PM2.5 và khử ẩm. ELC chuyên thi công hệ thống khí tươi hồi nhiệt Menred cao cấp.";
  } else if (nameLower.includes("inverter")) {
    benefit = inverterBenefits[seed];
  } else if (nameLower.includes("âm trần") || nameLower.includes("giấu trần")) {
    benefit = `Nâng tầm thẩm mỹ không gian${roomTarget ? ` ${roomTarget}` : ""}. Chuyên gia thiết kế & thi công máy lạnh giấu trần nối ống gió đẳng cấp.`;
  }

  const manualDesc = (product.meta_description || product.short_description || "").trim();
  if (manualDesc.length > 20) {
    let cleanedDesc = manualDesc;
    if (cleanedDesc.toLowerCase().startsWith(nameLower)) {
      const potentialBenefit = cleanedDesc.substring(name.length).trim().replace(/^[:;.,\s-]+/, "");
      if (potentialBenefit.length > 15) {
        cleanedDesc = potentialBenefit.charAt(0).toUpperCase() + potentialBenefit.slice(1);
        benefit = cleanedDesc;
      }
    } else {
      benefit = manualDesc;
    }
  }

  const rawParts = [
    `${name}${sku ? ` (${sku})` : ""}.`,
    dienTich ? `Phù hợp ${dienTich.includes("diện tích") ? dienTich : `diện tích ${dienTich}`}.` : "",
    benefit.endsWith(".") ? benefit : `${benefit}.`,
    gas ? `Sử dụng môi chất ${gas}.` : "",
    cspf ? `Tiết kiệm điện CSPF ${cspf}.` : "",
    xuatXu ? `Hàng nhập khẩu ${xuatXu}.` : "",
    "Giá tốt nhất tại ELC.",
  ];

  let result = "";
  const MAX_LENGTH = 160;
  for (let i = 0; i < rawParts.length; i++) {
    const part = rawParts[i];
    if (!part) continue;
    const currentLen = result.length;
    const nextPart = (currentLen > 0 ? " " : "") + part;
    if (currentLen + nextPart.length <= MAX_LENGTH) {
      result += nextPart;
    } else {
      if (i === 2) {
        const remaining = MAX_LENGTH - currentLen - 5;
        if (remaining > 20) {
          result += (currentLen > 0 ? " " : "") + part.substring(0, remaining) + "...";
        }
      }
      break;
    }
  }
  return result.trim();
}

async function previewProducts() {
  const slugs = [
    'may-cap-khi-tuoi-khu-nom-g2', // Máy cấp khí tươi
    'may-lanh-giau-tran-noi-ong-gio-5hp-daikin-inverter-3-pha', // 5HP Giấu trần
    'daikin-15hp-mot-chieu-inverter-ftkb35zvmv-rkb35zvmv' // 1.5HP
  ]

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .in('slug', slugs)

  if (!products) return;

  console.log('--- PREVIEW DUAL-LAYER SEO ---')
  products.forEach(p => {
    const desc = generateProductSmartDescription(p);
    console.log(`URL: .../${p.slug}`)
    console.log(`Snippet (${desc.length} chars):`)
    console.log(`> ${desc}`)
    console.log('-------------------')
  })
}

previewProducts()
