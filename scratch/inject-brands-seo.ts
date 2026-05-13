
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const SHOP_NAME = "Điện máy ELC";

function generateBrandSEO(name: string) {
  const title = `Máy lạnh ${name} chính hãng, giá rẻ nhất`;
  const description = `Chuyên cung cấp các dòng máy lạnh ${name} (Điều hòa ${name}) chính hãng tại ${SHOP_NAME}. Bảo hành uy tín, thi công lắp đặt chuyên nghiệp, giá tốt nhất thị trường. Xem ngay báo giá mới nhất!`;
  
  return {
    meta_title: title.replace(/\s+/g, " ").trim(),
    meta_description: description.replace(/\s+/g, " ").trim()
  };
}

async function bulkUpdateBrandsSEO() {
  console.log("🚀 Starting Brands SEO injection...");
  
  const { data: brands, error: fetchError } = await supabase
    .from('brands')
    .select('id, name');
    
  if (fetchError) {
    console.error("❌ Error fetching brands:", fetchError);
    return;
  }
  
  console.log(`📦 Found ${brands.length} brands. Injecting data...`);
  
  let count = 0;
  for (const brand of brands) {
    const updates = generateBrandSEO(brand.name);
    
    const { error: updateError } = await supabase
      .from('brands')
      .update(updates)
      .eq('id', brand.id);
      
    if (updateError) {
      console.error(`❌ Error updating brand ${brand.name}:`, updateError.message);
    } else {
      console.log(`✅ Updated SEO for ${brand.name}`);
      count++;
    }
  }
  
  console.log(`\n✨ Successfully injected SEO data for ${count} brands!`);
}

bulkUpdateBrandsSEO();
