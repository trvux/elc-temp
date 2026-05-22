import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function auditCategoriesNew() {
  console.log("Starting New Structure Audit...");
  
  // 1. Fetch products
  const { data: products, error: prodError } = await supabase
    .from("products")
    .select("id, name, category_id");
  if (prodError || !products) {
    console.error("Error fetching products:", prodError);
    return;
  }

  // 2. Fetch new groups
  const { data: newGroups, error: groupError } = await supabase
    .from("group_categories")
    .select("id, name");
  if (groupError || !newGroups) {
    console.error("Error fetching new groups:", groupError);
    return;
  }

  // 3. Fetch new categories
  const { data: newCats, error: newCatError } = await supabase
    .from("category")
    .select("id, name, group_id");
  if (newCatError || !newCats) {
    console.error("Error fetching new categories:", newCatError);
    return;
  }

  console.log("\n=== CURRENT ACTIVE DATABASE STATS ===");
  console.log(`Total Products in Database: ${products.length}`);
  console.log(`Total New Groups: ${newGroups.length}`);
  console.log(`Total New Categories: ${newCats.length}`);

  // Count products per new category ID
  const productCountPerNewCat = new Map<string, number>();
  products.forEach(p => {
    const count = productCountPerNewCat.get(p.category_id) || 0;
    productCountPerNewCat.set(p.category_id, count + 1);
  });

  console.log("\n=== AUDIT REPORT: PRODUCTS PER NEW GROUP & CATEGORY ===");
  
  let totalCounted = 0;

  newGroups.forEach(group => {
    console.log(`\nNhóm Danh Mục: [${group.name}]`);
    const catsInGroup = newCats.filter(c => c.group_id === group.id);
    
    if (catsInGroup.length === 0) {
      console.log("  - Không có danh mục con nào.");
    } else {
      catsInGroup.forEach(cat => {
        const count = productCountPerNewCat.get(cat.id) || 0;
        totalCounted += count;
        
        // Match with typical old counterparts for display
        let oldCounterparts = "";
        if (cat.name === "Máy lạnh treo tường") {
          oldCounterparts = "(Treo tường, Điều hòa tủ đứng)";
        } else if (cat.name === "Máy lạnh âm trần đa hướng thổi") {
          oldCounterparts = "(Âm trần đa hướng thổi)";
        } else if (cat.name === "Máy lạnh áp trần") {
          oldCounterparts = "(Áp trần)";
        } else if (cat.name === "Máy lạnh giấu trần nối ống gió") {
          oldCounterparts = "(Giấu trần nối ống gió)";
        } else if (cat.name === "Máy cấp khí tươi, lọc không khí") {
          oldCounterparts = "(Máy cấp khí tươi, lọc không khí, Lọc không khí)";
        } else if (cat.name === "Phụ kiện đồng bộ của hệ thống cấp gió tươi") {
          oldCounterparts = "(Phụ kiện đồng bộ...)";
        } else if (cat.name === "Máy lọc nước RO 3 in 1") {
          oldCounterparts = "(Máy lọc nước RO 3 IN 1 MENRED)";
        } else {
          oldCounterparts = "(Được tạo mới / Khác)";
        }

        console.log(`  - Danh Mục Mới: [${cat.name}] | Số lượng sản phẩm: ${count} sản phẩm`);
        console.log(`    -> Nguồn chuyển đổi từ danh mục cũ: ${oldCounterparts}`);
      });
    }
  });

  const unmappedCount = products.length - totalCounted;

  console.log("\n=== SUMMARY ===");
  console.log(`Số sản phẩm đã khớp cấu trúc mới thành công: ${totalCounted}/${products.length} sản phẩm (${(totalCounted/products.length*100).toFixed(1)}%)`);
  if (unmappedCount > 0) {
    console.log(`Cảnh báo: Có ${unmappedCount} sản phẩm chưa được gán vào cấu trúc mới hoặc đang trỏ tới ID không tồn tại.`);
  } else {
    console.log("Chúc mừng! 100% sản phẩm đã được phân bổ khớp hoàn toàn vào các Nhóm danh mục & Danh mục mới!");
  }
}

auditCategoriesNew();
