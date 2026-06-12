import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  console.log('Fetching site_settings from DB...');
  const { data: settings, error } = await supabase
    .from('site_settings')
    .select('*');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Site settings in DB:', settings);
  }
}

run();
