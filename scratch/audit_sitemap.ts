import { createStaticClient } from '../lib/supabase/static';

async function auditSitemapVsDB() {
  const supabase = createStaticClient();
  const baseUrl = "https://dienmayelc.com.vn";

  console.log('🔍 Bắt đầu Audit Sitemap vs Database...\n');

  // 1. Audit Products
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, categories!inner(slug, name)")
    .eq("is_published", true);

  if (products) {
    console.log(`--- SẢN PHẨM (${products.length} mục) ---`);
    let pIssues = 0;
    products.forEach(p => {
      const catSlug = p.categories?.slug;
      
      // Kiểm tra xem slug có bị lặp lại tên category không
      if (p.slug.includes(catSlug) && p.slug !== catSlug) {
         console.warn(`⚠️  Trùng lặp: Product [${p.name}] có slug [${p.slug}] chứa category [${catSlug}].`);
         console.warn(`   -> Link sitemap sẽ là: ${baseUrl}/san-pham/${catSlug}/${p.slug.replace(catSlug + '-', '')}`);
         pIssues++;
      }

      // Kiểm tra ký tự lạ
      if (/[^a-z0-9.-]/.test(p.slug)) {
        console.error(`❌  Ký tự lạ: Product [${p.name}] có slug lỗi [${p.slug}]`);
        pIssues++;
      }
    });
    if (pIssues === 0) console.log('✅ Sản phẩm: OK');
  }

  // 2. Audit Projects
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, slug, categories(slug)")
    .eq("is_published", true);

  if (projects) {
    console.log(`\n--- DỰ ÁN (${projects.length} mục) ---`);
    let prIssues = 0;
    projects.forEach(p => {
      if (!p.categories) {
        console.error(`❌  Thiếu Category: Dự án [${p.title}] không có danh mục (Sitemap sẽ gán 'khac').`);
        prIssues++;
      }
    });
    if (prIssues === 0) console.log('✅ Dự án: OK');
  }

  // 3. Audit News, Services, Branches (Kiểm tra slug trống hoặc lỗi)
  const tables = ['news', 'services', 'branches'];
  for (const table of tables) {
    const { data } = await supabase.from(table).select("slug, title, name").eq("is_published", true);
    console.log(`\n--- ${table.toUpperCase()} (${data?.length || 0} mục) ---`);
    if (!data || data.length === 0) continue;
    
    let tIssues = 0;
    data.forEach((item: any) => {
      if (!item.slug || item.slug.length < 3) {
        console.error(`❌  Slug lỗi: [${item.title || item.name}] có slug [${item.slug}]`);
        tIssues++;
      }
    });
    if (tIssues === 0) console.log(`✅ ${table}: OK`);
  }

  console.log('\n✨ Hoàn tất Audit!');
}

auditSitemapVsDB();
