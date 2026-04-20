const { createClient } = require('@supabase/supabase-client');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function analyzeProductPortfolio() {
  const { data, error } = await supabase
    .from('products')
    .select('name');

  if (error) {
    console.error(error);
    return;
  }

  const stats = {
    'Treo tường': 0,
    'Âm trần Cassette': 0,
    'Giấu trần nối ống gió': 0,
    'Áp trần': 0,
    'Tủ đứng': 0,
    'Khác': 0
  };

  const hpStats = {
    '1HP': 0,
    '1.5HP': 0,
    '2HP': 0,
    '2.5HP': 0,
    '3HP trở lên': 0
  };

  data.forEach(p => {
    const name = p.name.toLowerCase();
    
    // Type analysis
    if (name.includes('treo tường')) stats['Treo tường']++;
    else if (name.includes('âm trần') && !name.includes('nối ống gió')) stats['Âm trần Cassette']++;
    else if (name.includes('giấu trần') || name.includes('nối ống gió')) stats['Giấu trần nối ống gió']++;
    else if (name.includes('áp trần')) stats['Áp trần']++;
    else if (name.includes('tủ đứng')) stats['Tủ đứng']++;
    else stats['Khác']++;

    // HP analysis
    if (name.includes('1hp')) hpStats['1HP']++;
    else if (name.includes('1.5hp')) hpStats['1.5HP']++;
    else if (name.includes('2hp')) hpStats['2HP']++;
    else if (name.includes('2.5hp')) hpStats['2.5HP']++;
    else if (name.includes('3hp') || name.includes('4hp') || name.includes('5hp')) hpStats['3HP trở lên']++;
  });

  console.log('--- Product Type Portfolio ---');
  console.table(stats);
  console.log('--- HP Power Distribution ---');
  console.table(hpStats);
}

analyzeProductPortfolio();
