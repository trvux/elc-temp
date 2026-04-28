import { google } from 'googleapis';
import { createStaticClient } from '../lib/supabase/static';
import fs from 'fs';
import path from 'path';

async function pushToGoogle() {
  const keyPath = path.join(process.cwd(), 'service-account.json');
  
  if (!fs.existsSync(keyPath)) {
    console.error('❌ Lỗi: Không tìm thấy file service-account.json trong thư mục gốc.');
    return;
  }

  const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  console.log(`📧 Sử dụng Service Account: ${key.client_email}`);
  console.log(`⚠️  Đảm bảo email trên đã được thêm làm OWNER trong Search Console.`);

  const jwtClient = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ['https://www.googleapis.com/auth/indexing']
  });

  try {
    console.log('⏳ Đang xác thực với Google API...');
    await jwtClient.authorize();
    
    const supabase = createStaticClient();
    const baseUrl = "https://dienmayelc.com.vn";

    console.log('🔍 Đang lấy danh sách sản phẩm từ database...');
    const { data: products, error } = await supabase
      .from("products")
      .select("slug, categories!inner(slug)")
      .eq("is_published", true);

    if (error || !products) {
      console.error('❌ Lỗi lấy dữ liệu Supabase:', error);
      return;
    }

    const urls = [
      baseUrl,
      `${baseUrl}/san-pham`,
      `${baseUrl}/tin-tuc`,
      `${baseUrl}/du-an`,
      ...products.map(p => {
        const categorySlug = Array.isArray(p.categories) ? p.categories[0]?.slug : (p.categories as { slug: string })?.slug;
        return `${baseUrl}/san-pham/${categorySlug}/${p.slug}`;
      })
    ];
    
    console.log(`🚀 Chuẩn bị đẩy ${urls.length} URL lên Google Indexing...`);

    const indexing = google.indexing('v3');

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        await indexing.urlNotifications.publish({
          auth: jwtClient,
          requestBody: {
            url: url,
            type: 'URL_UPDATED'
          }
        });
        console.log(`[${i + 1}/${urls.length}] ✅ OK: ${url}`);
      } catch (err: any) {
        const status = err.response?.status;
        const message = err.errors?.[0]?.message || err.message;
        
        console.error(`[${i + 1}/${urls.length}] ❌ Lỗi (${status}): ${url} -> ${message}`);
        
        if (status === 403) {
          console.error('‼️ DỪNG: Lỗi quyền truy cập (403). Hãy kiểm tra xem Service Account đã là OWNER của site trong Search Console chưa.');
          break;
        }
        if (status === 429) {
          console.error('‼️ DỪNG: Quá hạn mức (Quota) của Google API.');
          break;
        }
      }
      // Delay nhẹ để tránh bị rate limit
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log('🏁 Hoàn tất!');

  } catch (err: any) {
    console.error('❌ Lỗi hệ thống:', err.message);
  }
}

pushToGoogle();
