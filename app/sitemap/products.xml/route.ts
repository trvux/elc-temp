import { NextResponse } from 'next/server';
import { createStaticClient } from '@/shared/lib/supabase/static';


export async function GET() {
  const BASE_URL = 'https://dienmayelc.com.vn';
  const supabase = createStaticClient();

  const { data: products } = await supabase
    .from('products')
    .select('slug')
    .eq('is_published', true)
    .is('deleted_at', null);

  const productRoutes = (products || [])
    .filter((prod) => prod.slug)
    .map((prod) => ({
      url: `${BASE_URL}/san-pham/${prod.slug}`,
    }));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${productRoutes.map(r => `
  <url>
    <loc>${r.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>`).join('')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
