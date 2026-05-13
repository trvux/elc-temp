import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

function generateSlug(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-") 
    .replace(/-+/g, "-") 
    .replace(/^-+|-+$/g, "");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// USE SERVICE ROLE KEY TO BYPASS RLS
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSlugs() {
  console.log('--- Checking for products with invalid slugs (spaces) using SERVICE ROLE ---');
  
  const { data: products, error } = await supabase
    .from('products')
    .select('id, slug, name')
    .ilike('slug', '% %'); 

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  if (!products || products.length === 0) {
    console.log('No products with spaces in slugs found.');
    return;
  }

  console.log(`Found ${products.length} products to fix.`);

  for (const product of products) {
    const newSlug = generateSlug(product.slug);
    console.log(`Fixing: "${product.slug}" -> "${newSlug}" (Product: ${product.name})`);
    
    // Check if the new slug already exists
    const { data: existing } = await supabase.from('products').select('id').eq('slug', newSlug).single();
    if (existing && existing.id !== product.id) {
        console.error(`ERROR: Slug ${newSlug} already exists for another product. Cannot update.`);
        continue;
    }

    const { error: updateError, data: updatedData } = await supabase
      .from('products')
      .update({ slug: newSlug })
      .eq('id', product.id)
      .select();

    if (updateError) {
      console.error(`Failed to update ${product.id}:`, updateError.message);
    } else {
      console.log(`Successfully updated ${product.id}`);
    }
  }

  console.log('--- Slug fix completed ---');
}

fixSlugs();
