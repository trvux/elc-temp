import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkNulls() {
    const { count, data, error } = await supabase
        .from('products')
        .select('id, name, meta_title', { count: 'exact' });

    if (error) {
        console.error(error);
        return;
    }

    const nullProducts = data?.filter(p => !p.meta_title) || [];
    
    console.log(`📊 Tổng số sản phẩm: ${count}`);
    console.log(`❌ Số sản phẩm bị NULL meta_title: ${nullProducts.length}`);
    
    if (nullProducts.length > 0) {
        console.log("Danh sách sản phẩm bị NULL (ID và Tên):");
        nullProducts.forEach(p => console.log(`- ID: ${p.id} | Name: ${p.name || "TRỐNG"}`));
    } else {
        console.log("✅ Không còn sản phẩm nào bị NULL meta_title!");
    }
}

checkNulls();
