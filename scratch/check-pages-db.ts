import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  console.log('Fetching pages from DB...');
  const { data: pages, error } = await supabase
    .from('pages')
    .select('*');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Pages in DB:', pages);
  }
}

run();
