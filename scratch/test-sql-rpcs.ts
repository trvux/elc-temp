
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function attemptSql() {
  const sql = `
    ALTER TABLE brands 
    ADD COLUMN IF NOT EXISTS meta_title TEXT,
    ADD COLUMN IF NOT EXISTS meta_description TEXT;
  `
  
  const rpcs = [
    { name: 'exec_sql', param: 'sql' },
    { name: 'exec_sql', param: 'query' },
    { name: 'exec_sql', param: 'sql_query' },
    { name: 'run_sql', param: 'sql' },
    { name: 'run_sql', param: 'query' },
    { name: 'run_sql', param: 'sql_query' },
  ]

  for (const rpc of rpcs) {
    console.log(`Trying RPC: ${rpc.name} with param: ${rpc.param}...`)
    const { data, error } = await supabase.rpc(rpc.name, { [rpc.param]: sql })
    if (!error) {
      console.log(`✅ Success with ${rpc.name}(${rpc.param})!`)
      return
    }
    console.log(`❌ Failed: ${error.message}`)
  }

  console.log('\nAll common RPCs failed.')
}

attemptSql()
