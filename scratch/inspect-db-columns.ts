import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const TABLES = [
  'about_blocks',
  'branches',
  'brands',
  'categories',
  'contacts',
  'news',
  'pages',
  'products',
  'projects',
  'services',
  'site_settings',
  'tracking_events'
]

async function inspectDb() {
  console.log('--- DATABASE INSPECTION START ---')
  console.log(`Supabase URL: ${supabaseUrl}`)
  
  for (const tableName of TABLES) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ Table "${tableName}": Failed to query. Error: ${error.message}`)
        continue
      }
      
      if (data && data.length > 0) {
        const columns = Object.keys(data[0])
        console.log(`✅ Table "${tableName}": Found ${columns.length} columns:`)
        console.log(`   Columns: ${columns.join(', ')}`)
      } else {
        // Table is empty, so we try to get metadata or columns by querying info (if possible),
        // or just report that it is empty but reachable.
        console.log(`ℹ️ Table "${tableName}": Reachable but empty (0 rows).`)
      }
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e)
      console.log(`❌ Table "${tableName}": Exception. Error: ${errMsg}`)
    }
  }
  console.log('--- DATABASE INSPECTION END ---')
}

inspectDb().catch(console.error)
