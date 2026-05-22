require('dotenv').config({ path: '.env.local' });
const https = require('https');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const tables = [
  { table: 'group_categories', suffix: 'groups', label: 'group' },
  { table: 'category', suffix: 'category', label: 'cat' },
  { table: 'brands', suffix: 'brands', label: 'brand' },
  { table: 'products', suffix: 'products', label: 'prod' },
];

async function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const req = https.request({
      hostname: SUPABASE_URL,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function fixRLS() {
  for (const { table, suffix, label } of tables) {
    console.log(`\nFixing RLS for: ${table}`);
    const drops = [
      `DROP POLICY IF EXISTS "Allow Soft Delete for Admin_${label}" ON ${table}`,
      `DROP POLICY IF EXISTS "Allow authenticated users to delete ${suffix}" ON ${table}`,
      `DROP POLICY IF EXISTS "Allow authenticated users to insert ${suffix}" ON ${table}`,
      `DROP POLICY IF EXISTS "Allow authenticated users to update ${suffix}" ON ${table}`,
      `DROP POLICY IF EXISTS "Allow public read-only access for ${suffix}" ON ${table}`,
      `DROP POLICY IF EXISTS "public_read" ON ${table}`,
      `DROP POLICY IF EXISTS "admin_all" ON ${table}`,
      `CREATE POLICY "public_read" ON ${table} FOR SELECT USING (deleted_at IS NULL)`,
      `CREATE POLICY "admin_all" ON ${table} FOR ALL TO authenticated USING (true) WITH CHECK (true)`,
    ];
    for (const sql of drops) {
      const r = await runSQL(sql);
      if (r.status !== 200 && r.status !== 204) {
        console.log(`  WARN [${r.status}]: ${sql.substring(0, 60)}...`);
        console.log(`  Response: ${r.body}`);
      } else {
        console.log(`  OK: ${sql.substring(0, 60)}...`);
      }
    }
  }
  console.log('\nDone!');
}

fixRLS().catch(console.error);
