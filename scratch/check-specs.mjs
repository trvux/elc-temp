import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSpecs() {
  const { data, error } = await supabase
    .from('products')
    .select('name, specs')
    .not('specs', 'is', null);

  if (error) {
    console.error(error);
    return;
  }

  const allValues = new Map();

  data.forEach(p => {
    if (Array.isArray(p.specs)) {
      p.specs.forEach(s => {
        if (!allValues.has(s.label)) allValues.set(s.label, new Set());
        const items = Array.isArray(s.items) ? s.items : Array.isArray(s.value) ? s.value : [s.value];
        items.forEach(i => {
           const val = typeof i === 'object' ? i?.value : i;
           if (val) allValues.get(s.label).add(val);
        });
      });
    }
  });

  console.log('\n--- Tech & Filter related ---');
  for (const [label, values] of allValues) {
    const l = label.toLowerCase();
    if (l.includes('công nghệ') || l.includes('lọc') || l.includes('kháng khuẩn') || l.includes('tính năng')) {
      console.log(`${label}:`, Array.from(values));
    }
  }
}

checkSpecs();
