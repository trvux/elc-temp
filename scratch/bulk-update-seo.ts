import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const SHOP_NAME = "Điện máy ELC";

function generateSEO(name: string, sku: string, specs: any) {
    let hp = "";
    const hpMatch = name.match(/(\d+(\.\d+)?\s*HP)/i);
    if (hpMatch) {
        hp = hpMatch[1].toUpperCase();
    } else {
        // Try to find in specs array/JSON
        const specsStr = JSON.stringify(specs);
        const hpSpecMatch = specsStr.match(/(\d+(\.\d+)?\s*HP)/i);
        if (hpSpecMatch) hp = hpSpecMatch[1].toUpperCase();
    }

    let category = "Máy lạnh";
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes("âm trần")) category = "Máy lạnh âm trần";
    else if (lowerName.includes("áp trần")) category = "Máy lạnh áp trần";
    else if (lowerName.includes("tủ đứng")) category = "Máy lạnh tủ đứng";
    else if (lowerName.includes("giấu trần")) category = "Máy lạnh giấu trần";
    else if (lowerName.includes("treo tường")) category = "Máy lạnh treo tường";
    else if (lowerName.includes("lọc") && lowerName.includes("khí")) category = "Máy lọc không khí";
    else if (lowerName.includes("cấp khí tươi")) category = "Máy cấp khí tươi";
    else if (lowerName.includes("phụ kiện")) category = "Phụ kiện máy lạnh";

    let brand = "";
    if (lowerName.includes("daikin")) brand = "Daikin";
    else if (lowerName.includes("lg")) brand = "LG";
    else if (lowerName.includes("panasonic")) brand = "Panasonic";
    else if (lowerName.includes("casper")) brand = "Casper";
    else if (lowerName.includes("funiki")) brand = "Funiki";
    else if (lowerName.includes("gree")) brand = "Gree";
    else if (lowerName.includes("menred")) brand = "Menred";
    else if (lowerName.includes("hagisu")) brand = "Hagisu";

    let cleanSku = (sku || "").split(/[\/\+]/)[0].trim();
    const isAccessory = category === "Phụ kiện máy lạnh" || cleanSku.toUpperCase() === "PHUKIEN";
    
    // Local terminology: 1HP = 1 ngựa
    const hpLocal = hp ? ` (${hp.replace(/HP/i, "ngựa")})` : "";

    if (cleanSku.toUpperCase() === "PHUKIEN") {
        cleanSku = ""; // Don't add PHUKIEN to title if it's generic
    }

    const isAirCon = category.includes("Máy lạnh") && !isAccessory;
    const synonym = isAirCon ? "(Điều hòa)" : "";

    let metaTitle = "";
    if (isAccessory) {
        metaTitle = `${category} chính hãng ${cleanSku}`.trim();
    } else {
        metaTitle = `${category} ${synonym} ${brand} ${hp} ${cleanSku} Inverter`.replace(/\s+/g, " ").trim();
    }

    const metaDescription = `Mua ngay ${category} ${brand} ${cleanSku} ${hp}${hpLocal} chính hãng tại ${SHOP_NAME}. ${isAirCon ? "Điều hòa " + brand : ""} giá tốt nhất, tiết kiệm điện vượt trội, trả góp 0%. Giao hàng nhanh toàn quốc. Xem ngay!`.replace(/\s+/g, " ").trim();

    return { meta_title: metaTitle, meta_description: metaDescription };
}

async function bulkUpdateSEO() {
    console.log("🚀 Starting bulk SEO update...");

    // 1. Fetch all products (Removing filters to catch EVERYTHING that is NULL)
    const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, name, sku, specs');

    if (fetchError) {
        console.error("❌ Error fetching products:", fetchError);
        return;
    }

    console.log(`📦 Found ${products.length} products. Processing...`);

    let count = 0;
    for (const product of products) {
        const updates = generateSEO(product.name, product.sku, product.specs);
        
        const { error: updateError } = await supabase
            .from('products')
            .update(updates)
            .eq('id', product.id);

        if (updateError) {
            console.error(`❌ Error updating product ${product.id}:`, updateError);
        } else {
            count++;
            if (count % 20 === 0) console.log(`✅ Updated ${count}/${products.length} products...`);
        }
    }

    console.log(`\n✨ Successfully updated SEO for ${count} products!`);
}

bulkUpdateSEO();
