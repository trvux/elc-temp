import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSpecsInDetail() {
  const { data: products, error } = await supabase
    .from('products')
    .select('name, specs')
    .limit(20);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('--- CHI TIẾT DỮ LIỆU CÔNG SUẤT TRONG DB ---');
  
  products.forEach(p => {
    console.log(`\nSản phẩm: ${p.name}`);
    if (p.specs && Array.isArray(p.specs)) {
      const capacitySpecs = p.specs.filter((s: any) => 
        s.label?.toLowerCase().includes('công suất') || 
        s.label?.toLowerCase().includes('btu') || 
        s.label?.toLowerCase().includes('ngựa') ||
        s.label?.toLowerCase().includes('hp')
      );
      
      if (capacitySpecs.length > 0) {
        capacitySpecs.forEach((s: any) => {
          console.log(`  - Nhãn: "${s.label}" | Giá trị: ${JSON.stringify(s.value || s.items)}`);
        });
      } else {
        console.log('  (Không tìm thấy spec liên quan đến công suất)');
      }
    } else {
      console.log('  (Specs không phải là mảng hoặc bị trống)');
    }
  });
}

checkSpecsInDetail();
