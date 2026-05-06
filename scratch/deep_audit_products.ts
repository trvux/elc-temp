import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function deepAuditProducts() {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .limit(175);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`--- TỔNG KIỂM TRA ${products.length} SẢN PHẨM ---`);
  
  const findings = products.map(p => {
    const info: any = {
      id: p.id,
      name: p.name,
      // Check installation in name
      instInName: p.name.match(/treo tường|âm trần|áp trần|tủ đứng|giấu trần|nối ống gió|cassette/i)?.[0] || 'N/A',
      // Check specs
      specs: []
    };

    if (p.specs && Array.isArray(p.specs)) {
      p.specs.forEach((s: any) => {
        const label = (s.label || '').toLowerCase();
        const value = JSON.stringify(s.value || s.items);
        
        // Find capacity
        if (label.includes('công suất') || label.includes('btu') || label.includes('hp')) {
          info.specs.push({ label: s.label, value, type: 'Công suất' });
        }
        // Find technology
        if (label.includes('inverter') || label.includes('tiết kiệm') || label.includes('công nghệ')) {
          info.specs.push({ label: s.label, value, type: 'Công nghệ' });
        }
        // Find installation in specs
        if (label.includes('kiểu') || label.includes('loại máy') || label.includes('dòng máy')) {
          info.specs.push({ label: s.label, value, type: 'Lắp đặt' });
        }
        // Find direction
        if (label.includes('chiều') || label.includes('lạnh')) {
          info.specs.push({ label: s.label, value, type: 'Số chiều' });
        }
      });
    }

    return info;
  });

  // Print a summary of findings
  findings.forEach((f, i) => {
    console.log(`\n[${i+1}] ${f.name}`);
    console.log(`   > Lắp đặt (trong tên): ${f.instInName}`);
    f.specs.forEach((s: any) => {
      console.log(`   > Spec [${s.type}]: "${s.label}" = ${s.value}`);
    });
  });
}

deepAuditProducts();
