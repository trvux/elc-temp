
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gdzihzsjfczuggwpykjk.supabase.co'
const supabaseKey = 'sb_secret_RxWGBdFX0qPBKWBpI-2Eeg_b3jplqTo'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkContentVolume() {
  const [
    { count: productCount },
    { count: newsCount },
    { count: projectCount }
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('news').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true })
  ])

  console.log('--- THỐNG KÊ NỘI DUNG HIỆN TẠI ---')
  console.log(`Số lượng sản phẩm: ${productCount}`)
  console.log(`Số lượng tin tức/blog: ${newsCount}`)
  console.log(`Số lượng dự án thi công: ${projectCount}`)
}

checkContentVolume()
