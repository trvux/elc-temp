-- FIX RLS TẤT CẢ 4 BẢNG - CHẠY 1 LẦN LÀ XONG

-- 1. group_categories
DROP POLICY IF EXISTS "Allow Soft Delete for Admin_group" ON group_categories;
DROP POLICY IF EXISTS "Allow authenticated users to delete groups" ON group_categories;
DROP POLICY IF EXISTS "Allow authenticated users to insert groups" ON group_categories;
DROP POLICY IF EXISTS "Allow authenticated users to update groups" ON group_categories;
DROP POLICY IF EXISTS "Allow public read-only access for groups" ON group_categories;
DROP POLICY IF EXISTS "public_read" ON group_categories;
DROP POLICY IF EXISTS "admin_all" ON group_categories;

CREATE POLICY "public_read" ON group_categories
  FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "admin_all" ON group_categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. category
DROP POLICY IF EXISTS "Allow Soft Delete for Admin_cat" ON category;
DROP POLICY IF EXISTS "Allow authenticated users to delete category" ON category;
DROP POLICY IF EXISTS "Allow authenticated users to insert category" ON category;
DROP POLICY IF EXISTS "Allow authenticated users to update category" ON category;
DROP POLICY IF EXISTS "Allow public read-only access for category" ON category;
DROP POLICY IF EXISTS "public_read" ON category;
DROP POLICY IF EXISTS "admin_all" ON category;

CREATE POLICY "public_read" ON category
  FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "admin_all" ON category
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. brands
DROP POLICY IF EXISTS "Allow Soft Delete for Admin_brand" ON brands;
DROP POLICY IF EXISTS "Allow authenticated users to delete brands" ON brands;
DROP POLICY IF EXISTS "Allow authenticated users to insert brands" ON brands;
DROP POLICY IF EXISTS "Allow authenticated users to update brands" ON brands;
DROP POLICY IF EXISTS "Allow public read-only access for brands" ON brands;
DROP POLICY IF EXISTS "public_read" ON brands;
DROP POLICY IF EXISTS "admin_all" ON brands;

CREATE POLICY "public_read" ON brands
  FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "admin_all" ON brands
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. products
DROP POLICY IF EXISTS "Allow Soft Delete for Admin_prod" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to delete products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to insert products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to update products" ON products;
DROP POLICY IF EXISTS "Allow public read-only access for products" ON products;
DROP POLICY IF EXISTS "public_read" ON products;
DROP POLICY IF EXISTS "admin_all" ON products;

CREATE POLICY "public_read" ON products
  FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "admin_all" ON products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
