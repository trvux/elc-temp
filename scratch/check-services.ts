import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkServices() {
  const { data, error } = await supabase
    .from('services')
    .select('slug, title, is_published');
  
  if (error) {
    console.error('Error fetching services:', error);
    return;
  }

  console.log('--- Services in Database ---');
  data.forEach(s => {
    console.log(`Title: ${s.title} | Slug: ${s.slug} | Published: ${s.is_published}`);
  });
}

checkServices();
