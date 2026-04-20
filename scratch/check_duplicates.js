const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabase
    .from('products')
    .select('name, short_description, meta_description');

  if (error) {
    console.error(error);
    return;
  }

  const counts = {};
  data.forEach(p => {
    const desc = p.short_description || "NULL";
    counts[desc] = (counts[desc] || 0) + 1;
  });

  console.log("THỐNG KÊ TRÙNG LẶP MÔ TẢ:");
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  sorted.forEach(([desc, count]) => {
    if (count > 1) {
      console.log(`- [Lặp ${count} lần]: "${desc.substring(0, 100)}..."`);
    }
  });

  console.log("\nSOI CHI TIẾT MỘT VÀI EM ĐANG BỊ TRÙNG:");
  sorted.slice(0, 3).forEach(([desc, count]) => {
    if (count > 1) {
      const examples = data.filter(p => p.short_description === desc).slice(0, 3).map(p => p.name);
      console.log(`  + Các máy bị trùng: ${examples.join(", ")}`);
    }
  });
}

check();
