import fs from 'fs';
import path from 'path';

const SQL_FILE_PATH = path.join(process.cwd(), 'scratch/databaseFromSupabase/products_rows.sql');
const OUTPUT_FILE_PATH = path.join(process.cwd(), 'scratch/update_products_seo.sql');

const SHOP_NAME = "Điện máy ELC";

function generateSEO(name: string, sku: string, specsStr: string) {
    // 1. Extract HP from name or specs
    let hp = "";
    const hpMatch = name.match(/(\d+(\.\d+)?\s*HP)/i);
    if (hpMatch) {
        hp = hpMatch[1].toUpperCase();
    } else {
        const hpSpecMatch = specsStr.match(/(\d+(\.\d+)?\s*HP)/i);
        if (hpSpecMatch) hp = hpSpecMatch[1].toUpperCase();
    }

    // 2. Clean Category & Brand (simplified for SEO)
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

    // 3. Clean SKU
    const cleanSku = sku.replace(/'/g, "").split(/[\/\+]/)[0].trim();

    // 4. Synonym logic
    const isAirCon = category.includes("Máy lạnh");
    const synonym = isAirCon ? "(Điều hòa)" : "";

    // 5. Build Meta Title
    const metaTitle = `${category} ${synonym} ${brand} ${hp} ${cleanSku} Inverter`.replace(/\s+/g, " ").trim() + ` | ${SHOP_NAME}`;

    // 6. Build Meta Description
    const metaDescription = `Mua ngay ${category} ${brand} ${cleanSku} ${hp} chính hãng tại ${SHOP_NAME}. ${synonym ? "Điều hòa " + brand : ""} giá tốt nhất, tiết kiệm điện vượt trội, trả góp 0%. Giao hàng nhanh toàn quốc. Xem ngay!`.replace(/\s+/g, " ").trim();

    return { title: metaTitle, desc: metaDescription };
}

async function run() {
    const content = fs.readFileSync(SQL_FILE_PATH, 'utf8');
    
    // Regex to match the values inside INSERT INTO ... VALUES (...)
    // This is a bit tricky for 2MB file, we'll process it line by line if possible or use a more robust split
    const valuesMatch = content.match(/\((['"].*?['"]|NULL|ARRAY\[.*?\]|{.*?}),.*?\)/g);
    
    if (!valuesMatch) {
        console.log("No values found in SQL file.");
        return;
    }

    let sqlUpdates = "-- Auto-generated SEO updates\n";

    valuesMatch.forEach((row) => {
        // Split values by comma, but respect strings and arrays
        // Simple approach: we know the positions in your SQL
        // id: 0, cat_id: 1, name: 2, sku: 3, description: 4, images: 5, original_price: 6, discount: 7, sale_price: 8, specs: 9 ...
        
        // This is a very rough split for demo, for production SQL we use a proper parser
        // For this task, let's use a more targeted approach
        const parts = row.match(/'(.*?)'|NULL|ARRAY\[.*?\]|(?<=\{).*?(?=\})|(\d+(\.\d+)?)/g);
        
        if (parts && parts.length > 5) {
            const id = parts[0].replace(/'/g, "");
            const name = parts[2]?.replace(/'/g, "") || "";
            const sku = parts[3]?.replace(/'/g, "") || "";
            const specs = parts[9] || "";

            if (id && name) {
                const { title, desc } = generateSEO(name, sku, specs);
                sqlUpdates += `UPDATE "public"."products" SET "meta_title" = '${title.replace(/'/g, "''")}', "meta_description" = '${desc.replace(/'/g, "''")}' WHERE "id" = '${id}';\n`;
            }
        }
    });

    fs.writeFileSync(OUTPUT_FILE_PATH, sqlUpdates);
    console.log(`Generated SEO updates for ${valuesMatch.length} products in ${OUTPUT_FILE_PATH}`);
}

run();
