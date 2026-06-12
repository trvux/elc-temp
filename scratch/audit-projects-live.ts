import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEV_SERVER_URL = 'http://127.0.0.1:3000';

async function fetchPageSEO(path: string) {
  const url = `${DEV_SERVER_URL}${path}`;
  try {
    const res = await fetch(url, { headers: { 'Accept-Encoding': 'identity' } });
    if (res.status !== 200) {
      return { status: res.status, error: `HTTP status ${res.status}` };
    }
    const html = await res.text();

    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
    const robotsMatch = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i);
    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);

    // Extract all JSON-LD schemas
    const jsonLdMatches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    const schemas = jsonLdMatches.map(match => {
      try {
        return JSON.parse(match[1].trim());
      } catch (e) {
        return { error: 'Invalid JSON' };
      }
    });

    return {
      status: 200,
      title: titleMatch ? titleMatch[1] : null,
      description: descMatch ? descMatch[1] : null,
      canonical: canonicalMatch ? canonicalMatch[1] : null,
      robots: robotsMatch ? robotsMatch[1] : null,
      ogImage: ogImageMatch ? ogImageMatch[1] : null,
      schemasCount: schemas.length,
      schemas: schemas
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    return { status: 500, error };
  }
}

async function run() {
  console.log('=== AUDITING ACTIVE PROJECT URLS ===\n');

  // 1. Audit Main Project Page
  console.log('Auditing Main listing page (/du-an)...');
  const mainSeo = await fetchPageSEO('/du-an');
  console.log('Result for /du-an:');
  console.log(JSON.stringify(mainSeo, null, 2));
  console.log('--------------------------------------------------\n');

  // 2. Audit Project Types
  console.log('Fetching active Project Types from DB...');
  const { data: projectTypes } = await supabase
    .from('project_type')
    .select('name, slug, image, meta_title, meta_description')
    .is('deleted_at', null)
    .limit(2);

  if (projectTypes && projectTypes.length > 0) {
    for (const pt of projectTypes) {
      console.log(`Auditing Project Type: ${pt.name} (/du-an/${pt.slug})...`);
      const seo = await fetchPageSEO(`/du-an/${pt.slug}`);
      console.log(`Result for /du-an/${pt.slug}:`);
      console.log(JSON.stringify(seo, null, 2));
      console.log('--------------------------------------------------\n');
    }
  } else {
    console.log('No project types found in DB.\n');
  }

  // 3. Audit Projects
  console.log('Fetching active Projects from DB...');
  const { data: projects } = await supabase
    .from('projects')
    .select('title, slug, meta_title, meta_description, images')
    .eq('is_published', true)
    .is('deleted_at', null)
    .limit(2);

  if (projects && projects.length > 0) {
    for (const p of projects) {
      console.log(`Auditing Project: ${p.title} (/du-an/${p.slug})...`);
      const seo = await fetchPageSEO(`/du-an/${p.slug}`);
      console.log(`Result for /du-an/${p.slug}:`);
      console.log(JSON.stringify(seo, null, 2));
      console.log('--------------------------------------------------\n');
    }
  } else {
    console.log('No projects found in DB.\n');
  }
}

run();
