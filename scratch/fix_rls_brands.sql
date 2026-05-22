DROP POLICY IF EXISTS "Allow Soft Delete for Admin_brand" ON brands;
DROP POLICY IF EXISTS "Allow authenticated users to delete brands" ON brands;
DROP POLICY IF EXISTS "Allow authenticated users to insert brands" ON brands;
DROP POLICY IF EXISTS "Allow authenticated users to update brands" ON brands;
DROP POLICY IF EXISTS "Allow public read-only access for brands" ON brands;
DROP POLICY IF EXISTS "public_read" ON brands;
DROP POLICY IF EXISTS "admin_all" ON brands;
CREATE POLICY "public_read" ON brands FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "admin_all" ON brands FOR ALL TO authenticated USING (true) WITH CHECK (true);
