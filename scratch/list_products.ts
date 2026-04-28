
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gdzihzsjfczuggwpykjk.supabase.co'
const supabaseKey = 'sb_secret_RxWGBdFX0qPBKWBpI-2Eeg_b3jplqTo'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkMultipleProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('name, slug, meta_description, short_description')
    .limit(10)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('--- PRODUCTS DATA ---')
  data.forEach(p => {
    console.log(`Product: ${p.name} (${p.slug})`)
    console.log(`  meta_desc: ${p.meta_description?.substring(0, 50)}...`)
    console.log(`  short_desc: ${p.short_description?.substring(0, 50)}...`)
    console.log('-------------------')
  })
}

checkMultipleProducts()
