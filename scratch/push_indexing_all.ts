import { createStaticClient } from '../lib/supabase/static';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

async function pushIndexingAll() {
  const supabase = createStaticClient();
  const baseUrl = "https://dienmayelc.com.vn";

  // 1. Cấu hình Google Auth
  const keyPath = path.join(process.cwd(), 'service-account.json');
  if (!fs.existsSync(keyPath)) {
    console.error('❌ Không tìm thấy file service-account.json!');
    return;
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });

  const indexing = google.indexing('v3');

  // 2. Thu thập tất cả URL
  console.log('📡 Đang thu thập URL từ Database...');
  const urls: string[] = [baseUrl]; // Thêm trang chủ

  // Lấy Sản phẩm
  const { data: products } = await supabase.from('products').select('slug, categories(slug)').eq('is_published', true);
  products?.forEach(p => {
    const catSlug = (p.categories as any)?.slug || 'khac';
    let prodSlug = p.slug;
    if (prodSlug.startsWith(`${catSlug}-`)) prodSlug = prodSlug.replace(`${catSlug}-`, "");
    urls.push(`${baseUrl}/san-pham/${catSlug}/${prodSlug}`);
  });

  // Lấy Dự án
  const { data: projects } = await supabase.from('projects').select('slug, categories(slug)').eq('is_published', true);
  projects?.forEach(p => {
    const catSlug = (p.categories as any)?.slug || 'khac';
    urls.push(`${baseUrl}/du-an/${catSlug}/${p.slug}`);
  });

  // Lấy Dịch vụ, Tin tức, Chi nhánh
  const tables = ['services', 'news', 'branches'];
  const prefixes = ['dich-vu', 'tin-tuc', 'chi-nhanh'];
  for (let i = 0; i < tables.length; i++) {
    const { data } = await supabase.from(tables[i]).select('slug').eq('is_published', true);
    data?.forEach(item => urls.push(`${baseUrl}/${prefixes[i]}/${item.slug}`));
  }

  console.log(`✅ Đã thu thập ${urls.length} URL. Bắt đầu đẩy lên Google...`);

  // 3. Đẩy từng URL lên Google Indexing API
  for (const url of urls) {
    try {
      const res = await indexing.urlNotifications.publish({
        auth,
        requestBody: {
          url: url,
          type: 'URL_UPDATED',
        },
      });
      console.log(`🚀 OK: ${url}`);
    } catch (error: any) {
      console.error(`❌ Lỗi [${url}]:`, error.response?.data?.error?.message || error.message);
      if (error.response?.data?.error?.message?.includes('quota')) {
        console.warn('⚠️ Hết hạn mức (Quota) của ngày hôm nay. Dừng lại tại đây.');
        break;
      }
    }
    // Nghỉ 1 chút để tránh bị rate limit
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n✨ Hoàn tất quá trình gửi yêu cầu Indexing!');
}

pushIndexingAll();
