
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gdzihzsjfczuggwpykjk.supabase.co'
const supabaseKey = 'sb_secret_RxWGBdFX0qPBKWBpI-2Eeg_b3jplqTo'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDetailedDescriptions() {
  const { data, error } = await supabase
    .from('products')
    .select('name, slug, meta_description, short_description')
    .order('name')

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`Total products: ${data.length}`)
  console.log('--- SAMPLES ---')
  data.slice(0, 20).forEach(p => {
    console.log(`Product: ${p.name}`)
    console.log(`  Manual Desc: ${p.meta_description || p.short_description || 'EMPTY'}`)
    console.log('-------------------')
  })
}

checkDetailedDescriptions()
