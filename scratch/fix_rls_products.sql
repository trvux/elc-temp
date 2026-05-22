DROP POLICY IF EXISTS "Allow Soft Delete for Admin_prod" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to delete products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to insert products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to update products" ON products;
DROP POLICY IF EXISTS "Allow public read-only access for products" ON products;
DROP POLICY IF EXISTS "public_read" ON products;
DROP POLICY IF EXISTS "admin_all" ON products;
CREATE POLICY "public_read" ON products FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "admin_all" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
