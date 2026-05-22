import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function inspectSchema() {
  const url = `${supabaseUrl}/rest/v1/`;
  try {
    const resSpec = await fetch(url, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    const spec = await resSpec.json() as any;
    console.log('Exposed tables/views/RPCs:');
    const paths = Object.keys(spec.paths || {});
    paths.forEach(p => {
      console.log(`  ${p}`);
    });
  } catch (err) {
    console.error('Error fetching specs:', err);
  }
}

inspectSchema();
