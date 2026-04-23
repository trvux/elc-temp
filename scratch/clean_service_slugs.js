
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) env[key.trim()] = value.join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanServiceSlugs() {
  console.log('--- Bắt đầu chiến dịch làm sạch Slug Dịch vụ ---');
  
  const { data: services, error } = await supabase.from('services').select('id, title, slug');
  if (error) return console.error(error);

  let updatedCount = 0;

  for (const s of services) {
    if (s.slug) {
      // Triệt tiêu nhiều dấu gạch ngang liên tiếp và trim
      const newSlug = s.slug.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
      
      if (s.slug !== newSlug) {
        console.log(`Làm sạch: ${s.slug} -> ${newSlug}`);
        await supabase.from('services').update({ slug: newSlug }).eq('id', s.id);
        updatedCount++;
      }
    }
  }

  console.log(`--- Hoàn tất! Đã làm sạch ${updatedCount} slug dịch vụ. ---`);
}

cleanServiceSlugs();
