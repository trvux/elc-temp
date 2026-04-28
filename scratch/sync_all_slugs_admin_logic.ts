import { createStaticClient } from './lib/supabase/static';

async function syncAllSlugs() {
  const supabase = createStaticClient();
  
  function generateSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s.-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  console.log('🚀 Bắt đầu đồng bộ Slug theo logic Admin Panel...');

  // 1. Đồng bộ Sản phẩm
  const { data: products } = await supabase
    .from('products')
    .select('id, name, sku, slug, category_id, brand_id, categories(name, parent_id, slug), brands(name)');

  if (products) {
    console.log(`📦 Đang xử lý ${products.length} sản phẩm...`);
    for (const p of products) {
      let namePart = p.name.toLowerCase();
      const cat = p.categories as any;
      if (cat) {
        const catName = cat.name.toLowerCase();
        // Xóa tên category khỏi slug nếu nó nằm ở đầu tên sản phẩm
        if (namePart.startsWith(catName)) {
          namePart = namePart.replace(catName, "").trim();
        }
      }
      const brandName = (p.brands as any)?.name || "";
      const finalPart = `${brandName} ${namePart} ${p.sku || ""}`.trim();
      const newSlug = generateSlug(finalPart);

      if (p.slug !== newSlug) {
        await supabase.from('products').update({ slug: newSlug }).eq('id', p.id);
        console.log(`✅ Product: ${p.slug} -> ${newSlug}`);
      }
    }
  }

  // 2. Đồng bộ Dự án (Tương tự)
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, slug, category_id, categories(name)');

  if (projects) {
    console.log(`🏗️ Đang xử lý ${projects.length} dự án...`);
    for (const p of projects) {
      let namePart = p.title.toLowerCase();
      const cat = p.categories as any;
      if (cat) {
        const catName = cat.name.toLowerCase();
        if (namePart.startsWith(catName)) {
          namePart = namePart.replace(catName, "").trim();
        }
      }
      const newSlug = generateSlug(namePart);
      if (p.slug !== newSlug) {
        await supabase.from('projects').update({ slug: newSlug }).eq('id', p.id);
        console.log(`✅ Project: ${p.slug} -> ${newSlug}`);
      }
    }
  }

  console.log('✨ Hoàn tất đồng bộ!');
}

syncAllSlugs();
