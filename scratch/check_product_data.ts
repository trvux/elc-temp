
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gdzihzsjfczuggwpykjk.supabase.co'
const supabaseKey = 'sb_secret_RxWGBdFX0qPBKWBpI-2Eeg_b3jplqTo'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkProduct() {
  const slug = 'daikin-15hp-mot-chieu-inverter-ftkb35zvmv-rkb35zvmv'
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    return
  }

  console.log('Product columns found:', Object.keys(data))
  console.log('--- DATA ---')
  console.log('name:', data.name)
  console.log('meta_description:', data.meta_description)
  console.log('short_description:', data.short_description)
  console.log('description (length):', data.description?.length)
}

checkProduct()
