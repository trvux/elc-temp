import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Utility function to generate slug (copied from shared/lib/utils.ts)
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
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // I might need service role if RLS is on
// Note: User should use service_role key if they want to bypass RLS.
// For now I'll try with anon key, but usually migrations need service_role.

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSlugs() {
  console.log('--- Checking for products with invalid slugs (spaces) ---');
  
  // Find products where slug contains a space
  const { data: products, error } = await supabase
    .from('products')
    .select('id, slug, name')
    .ilike('slug', '% %'); // Slugs containing spaces

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
    
    const { error: updateError } = await supabase
      .from('products')
      .update({ slug: newSlug })
      .eq('id', product.id);

    if (updateError) {
      console.error(`Failed to update ${product.id}:`, updateError.message);
    }
  }

  console.log('--- Slug fix completed ---');
}

fixSlugs();
