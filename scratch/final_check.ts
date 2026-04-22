import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gdzihzsjfczuggwpykjk.supabase.co'
const supabaseKey = 'sb_publishable_9FuWwtEAJfMxdYSnoGcWKA_EQWxwIQ3'
const supabase = createClient(supabaseUrl, supabaseKey)

async function finalCheck() {
  const { data, error } = await supabase.from('projects').select('description').limit(1)
  if (error) console.error(error.message)
  if (data && data.length > 0) {
    console.log('Final Data Type:', typeof data[0].description)
    console.log('Final Data Sample:', JSON.stringify(data[0].description).slice(0, 100))
  }
}

finalCheck()
