
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gdzihzsjfczuggwpykjk.supabase.co'
const supabaseKey = 'sb_secret_RxWGBdFX0qPBKWBpI-2Eeg_b3jplqTo'
const supabase = createClient(supabaseUrl, supabaseKey)

async function debugProducts() {
  const slugs = [
    'daikin-2hp-mot-chieu-inverter-ftkz50vvmv-rkz50vvmv',
    'da-huong-thoi-2hp-daikin-inverter-1-pha-fcf50cvm-rzf50dvm-brc1e63-bycq125eaf8',
    'may-lanh-giau-tran-noi-ong-gio-3hp-daikin-1-pha',
    'may-lanh-ap-tran-daikin-2hp-1-pha'
  ]

  const { data: products } = await supabase
    .from('products')
    .select('name, slug, meta_description, short_description, specs')
    .in('slug', slugs)

  if (!products) return;

  products.forEach(p => {
    console.log(`PRODUCT: ${p.name}`)
    console.log(`  meta_desc: ${p.meta_description}`)
    console.log(`  short_desc: ${p.short_description}`)
    console.log(`  specs keys: ${p.specs ? Object.keys(p.specs as any) : 'NONE'}`)
    // check if it has the labels we look for
    const labels = (p.specs as any[])?.map((s: any) => s.label) || [];
    console.log(`  spec labels: ${labels.join(', ')}`)
    console.log('-------------------')
  })
}

debugProducts()
