import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

import * as fs from 'fs';

async function run() {
  console.log('=== AUDITING DATABASE ===');

  // Pages
  const { data: pages } = await supabase
    .from('pages')
    .select('slug, title, is_published, deleted_at, updated_at');

  // News
  const { data: news } = await supabase
    .from('news')
    .select('slug, title, is_published, deleted_at, updated_at');

  // Branches
  const { data: branches } = await supabase
    .from('branches')
    .select('slug, name, is_published, deleted_at, updated_at');

  // Categories
  const { data: categories } = await supabase
    .from('categories')
    .select('slug, name, deleted_at, updated_at');

  // Brands
  const { data: brands } = await supabase
    .from('brands')
    .select('slug, name, deleted_at, updated_at');

  // Services
  const { data: services } = await supabase
    .from('services')
    .select('slug, title, is_published, deleted_at, updated_at');

  // Projects
  const { data: projects } = await supabase
    .from('projects')
    .select('slug, title, is_published, deleted_at, updated_at');

  // Products
  const { data: products } = await supabase
    .from('products')
    .select('slug, name, is_published, deleted_at, updated_at');

  const auditResults = {
    pagesSummary: pages?.map(p => ({ slug: p.slug, title: p.title, is_published: p.is_published, deleted_at: p.deleted_at })),
    newsSummary: news?.map(n => ({ slug: n.slug, title: n.title, is_published: n.is_published, deleted_at: n.deleted_at })),
    branchesSummary: branches?.map(b => ({ slug: b.slug, name: b.name, is_published: b.is_published, deleted_at: b.deleted_at })),
    categoriesSummary: categories?.map(c => ({ slug: c.slug, name: c.name, deleted_at: c.deleted_at })),
    brandsSummary: brands?.map(b => ({ slug: b.slug, name: b.name, deleted_at: b.deleted_at })),
    servicesSummary: services?.map(s => ({ slug: s.slug, title: s.title, is_published: s.is_published, deleted_at: s.deleted_at })),
    projectsSummary: projects?.map(p => ({ slug: p.slug, title: p.title, is_published: p.is_published, deleted_at: p.deleted_at })),
    productsCount: products?.length || 0,
    productsSample: products?.slice(0, 10).map(p => ({ slug: p.slug, name: p.name, is_published: p.is_published, deleted_at: p.deleted_at }))
  };

  fs.writeFileSync('scratch/audit-results.json', JSON.stringify(auditResults, null, 2));
  console.log('Saved audit results to scratch/audit-results.json');
}

run();
