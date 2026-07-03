import { NextResponse } from 'next/server';
import { createStaticClient } from '@/shared/lib/supabase/static';


export async function GET() {
  const BASE_URL = 'https://dienmayelc.com.vn';
  const supabase = createStaticClient();

  const { data: news } = await supabase
    .from('news')
    .select('slug')
    .eq('is_published', true)
    .is('deleted_at', null);

  const { data: projects } = await supabase
    .from('projects')
    .select('slug, meta_title, meta_description')
    .eq('is_published', true)
    .is('deleted_at', null);

  const { data: projectTypes } = await supabase
    .from('project_type')
    .select('slug, meta_title, meta_description')
    .is('deleted_at', null);

  const newsRoutes = (news || [])
    .filter((n) => n.slug)
    .map((n) => ({
      url: `${BASE_URL}/tin-tuc/${n.slug}`,
    }));

  const projectRoutes = (projects || [])
    .filter((proj) => proj.slug && proj.meta_title && proj.meta_description)
    .map((proj) => ({
      url: `${BASE_URL}/du-an/${proj.slug}`,
    }));

  const projectTypeRoutes = (projectTypes || [])
    .filter((pt) => pt.slug && pt.meta_title && pt.meta_description)
    .map((pt) => ({
      url: `${BASE_URL}/du-an/${pt.slug}`,
    }));

  const allRoutes = [
    ...newsRoutes,
    ...projectRoutes,
    ...projectTypeRoutes,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allRoutes.map(r => `
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
