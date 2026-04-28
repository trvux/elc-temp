import { createStaticClient } from '../lib/supabase/static';

async function checkAllUrlsLive() {
  const supabase = createStaticClient();
  const baseUrl = "https://dienmayelc.com.vn";

  console.log('🧐 Đang kiểm tra độ "sống" của các URL...');

  const urls: string[] = [baseUrl];
  
  // Thu thập tương tự script indexing
  const { data: products } = await supabase.from('products').select('slug, categories(slug)').eq('is_published', true);
  products?.forEach(p => {
    const catSlug = (p.categories as any)?.slug || 'khac';
    let prodSlug = p.slug;
    if (prodSlug.startsWith(`${catSlug}-`)) prodSlug = prodSlug.replace(`${catSlug}-`, "");
    urls.push(`${baseUrl}/san-pham/${catSlug}/${prodSlug}`);
  });

  const { data: projects } = await supabase.from('projects').select('slug, categories(slug)').eq('is_published', true);
  projects?.forEach(p => {
    const catSlug = (p.categories as any)?.slug || 'khac';
    urls.push(`${baseUrl}/du-an/${catSlug}/${p.slug}`);
  });

  let errorCount = 0;
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.status === 200) {
        console.log(`✅ 200 OK: ${url}`);
      } else {
        console.error(`❌ ${res.status} LỖI: ${url}`);
        errorCount++;
      }
    } catch (e) {
      console.error(`❌ FAILED: ${url}`);
      errorCount++;
    }
  }

  console.log(`\nTổng kết: ${urls.length} link. Lỗi: ${errorCount}`);
  if (errorCount === 0) {
    console.log('🚀 Mọi thứ hoàn hảo! Bạn có thể chạy script push_indexing_all.ts ngay.');
  }
}

checkAllUrlsLive();
