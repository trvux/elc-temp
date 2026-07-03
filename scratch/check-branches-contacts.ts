import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: branches, error: branchErr } = await supabase
    .from('branches')
    .select('*');

  console.log('=== BRANCHES ===');
  if (branchErr) console.error('Error:', branchErr);
  else console.log(JSON.stringify(branches, null, 2));

  const { data: contacts, error: contactErr } = await supabase
    .from('contacts')
    .select('*');

  console.log('=== CONTACTS ===');
  if (contactErr) console.error('Error:', contactErr);
  else console.log(JSON.stringify(contacts, null, 2));
}

run();
