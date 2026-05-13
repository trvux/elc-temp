
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runSql() {
  const sql = `
    ALTER TABLE brands 
    ADD COLUMN IF NOT EXISTS meta_title TEXT,
    ADD COLUMN IF NOT EXISTS meta_description TEXT;
  `
  
  console.log('Attempting to add SEO columns to brands table...')
  
  // Try to use a common dev-friendly RPC if it exists
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
  
  if (error) {
    console.error('Error executing SQL via RPC:', error)
    console.log('Trying alternative approach...')
    
    // Fallback: If no RPC exists, we might need another way or suggest manual execution
    // However, some Supabase projects have 'run_sql' or similar
    const { error: error2 } = await supabase.rpc('run_sql', { sql })
    if (error2) {
      console.error('Alternative RPC also failed:', error2)
      console.log('\n--- MANUAL ACTION REQUIRED ---')
      console.log('Please run the following SQL in your Supabase SQL Editor:')
      console.log(sql)
      console.log('-------------------------------\n')
    } else {
      console.log('Successfully executed SQL via "run_sql" RPC.')
    }
  } else {
    console.log('Successfully executed SQL via "exec_sql" RPC.')
  }
}

runSql()
