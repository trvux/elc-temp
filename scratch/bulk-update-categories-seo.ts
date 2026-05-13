import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const SHOP_NAME = "Điện máy ELC";

function generateCategorySEO(name: string, type: string) {
    const isAirCon = name.toLowerCase().includes("máy lạnh") || name.toLowerCase().includes("điều hòa");
    const synonym = isAirCon ? " (Điều hòa)" : "";
    const displayName = name + synonym;

    let metaTitle = "";
    let metaDescription = "";

    if (type === 'project') {
        metaTitle = `Dịch vụ ${name} chuyên nghiệp, uy tín`;
        metaDescription = `ELC chuyên cung cấp giải pháp ${name} cho căn hộ, biệt thự, văn phòng. Đội ngũ kỹ thuật tay nghề cao, thi công nhanh chóng, thẩm mỹ. Liên hệ ngay để được tư vấn!`;
    } else {
        metaTitle = `${displayName} chính hãng, giá rẻ nhất`;
        metaDescription = `Mua ${displayName} chính hãng tại ${SHOP_NAME}. Cam kết chất lượng cao, bảo hành lâu dài, lắp đặt chuyên nghiệp, trả góp 0%. Xem ngay báo giá mới nhất!`;
    }

    return { 
        meta_title: metaTitle.replace(/\s+/g, " ").trim(), 
        meta_description: metaDescription.replace(/\s+/g, " ").trim() 
    };
}

async function bulkUpdateCategoriesSEO() {
    console.log("🚀 Starting bulk Categories SEO update...");

    // 1. Fetch all categories (Catch EVERYTHING)
    const { data: categories, error: fetchError } = await supabase
        .from('categories')
        .select('id, name, type');

    if (fetchError) {
        console.error("❌ Error fetching categories:", fetchError);
        return;
    }

    console.log(`📦 Found ${categories.length} categories. Processing...`);

    let count = 0;
    for (const category of categories) {
        const updates = generateCategorySEO(category.name, category.type);
        
        const { error: updateError } = await supabase
            .from('categories')
            .update(updates)
            .eq('id', category.id);

        if (updateError) {
            console.error(`❌ Error updating category ${category.id}:`, updateError);
        } else {
            count++;
        }
    }

    console.log(`\n✨ Successfully updated SEO for ${count} categories!`);
}

bulkUpdateCategoriesSEO();
