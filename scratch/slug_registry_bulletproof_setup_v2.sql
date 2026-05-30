-- ============================================================================
-- BULLETPROOF SLUG REGISTRY SETUP V2 WITH DETAILED VIETNAMESE CONFLICT ERRORS
-- ============================================================================

-- 1. Ensure slug_registry has the correct columns
ALTER TABLE slug_registry 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Setup RLS Policies for Admin Soft Delete
DROP POLICY IF EXISTS "Allow Soft Delete for Admin_group" ON group_categories;
DROP POLICY IF EXISTS "Allow Soft Delete for Admin_cat" ON categories;
DROP POLICY IF EXISTS "Allow Soft Delete for Admin_brand" ON brands;
DROP POLICY IF EXISTS "Allow Soft Delete for Admin_prod" ON products;

CREATE POLICY "Allow Soft Delete for Admin_group" ON group_categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow Soft Delete for Admin_cat" ON categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow Soft Delete for Admin_brand" ON brands FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow Soft Delete for Admin_prod" ON products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 3. RLS Policies for slug_registry
ALTER TABLE slug_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cho phép tất cả mọi người đọc" ON slug_registry;
CREATE POLICY "Cho phép tất cả mọi người đọc" ON slug_registry FOR SELECT USING (true);

DROP POLICY IF EXISTS "Cho phép Admin toàn quyền CRUD" ON slug_registry;
CREATE POLICY "Cho phép Admin toàn quyền CRUD" ON slug_registry FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. CENTRALIZED CONFLICT CHECK FUNCTION (Vietnamese error message with details)
CREATE OR REPLACE FUNCTION check_slug_conflict(p_slug TEXT, p_entity_id UUID, p_entity_type TEXT) RETURNS VOID AS $$
DECLARE
  conflicting_record RECORD;
  type_vn TEXT;
  entity_name TEXT := '';
BEGIN
  -- Look for an active conflicting row in slug_registry
  SELECT entity_type, entity_id INTO conflicting_record FROM slug_registry 
  WHERE slug = p_slug 
    AND deleted_at IS NULL 
    AND (entity_id <> p_entity_id OR entity_type <> p_entity_type);
    
  IF FOUND THEN
    -- Map entity type to Vietnamese string and fetch its name
    IF conflicting_record.entity_type = 'group' THEN
      type_vn := 'nhóm danh mục';
      SELECT name INTO entity_name FROM group_categories WHERE id = conflicting_record.entity_id;
    ELSIF conflicting_record.entity_type = 'category' THEN
      type_vn := 'danh mục sản phẩm';
      SELECT name INTO entity_name FROM categories WHERE id = conflicting_record.entity_id;
    ELSIF conflicting_record.entity_type = 'brand' THEN
      type_vn := 'thương hiệu';
      SELECT name INTO entity_name FROM brands WHERE id = conflicting_record.entity_id;
    ELSIF conflicting_record.entity_type = 'product' THEN
      type_vn := 'sản phẩm';
      SELECT name INTO entity_name FROM products WHERE id = conflicting_record.entity_id;
    ELSE
      type_vn := conflicting_record.entity_type;
    END IF;
    
    -- Raise detailed user-friendly exception
    RAISE EXCEPTION 'Đường dẫn (slug) "%" đã trùng với % "%" đang hoạt động trong hệ thống. Vui lòng chọn đường dẫn khác.', 
      p_slug, type_vn, COALESCE(entity_name, 'chưa xác định');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. BULLETPROOF TRIGGERS CALLING THE CONFLICT CHECK FUNCTION

-- A. Trigger for group_categories
CREATE OR REPLACE FUNCTION sync_group_slug_registry() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.slug IS NOT NULL AND NEW.slug <> '' AND NEW.deleted_at IS NULL THEN
      PERFORM check_slug_conflict(NEW.slug, NEW.id, 'group');

      INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
      VALUES (NEW.slug, 'group', NEW.id, NOW()) 
      ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
    END IF; 
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Soft delete
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      UPDATE slug_registry SET deleted_at = NEW.deleted_at, updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'group';
      
    -- Restore
    ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        PERFORM check_slug_conflict(NEW.slug, NEW.id, 'group');

        INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
        VALUES (NEW.slug, 'group', NEW.id, NOW()) 
        ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
      END IF;
      
    -- Slug change
    ELSIF OLD.slug IS DISTINCT FROM NEW.slug AND NEW.deleted_at IS NULL THEN
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        PERFORM check_slug_conflict(NEW.slug, NEW.id, 'group');
      END IF;

      UPDATE slug_registry SET deleted_at = NOW(), updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'group';
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
        VALUES (NEW.slug, 'group', NEW.id, NOW()) 
        ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
      END IF;
      
    -- Normal update
    ELSIF NEW.deleted_at IS NULL THEN
      UPDATE slug_registry SET updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'group';
    END IF; 
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN 
    DELETE FROM slug_registry WHERE entity_id = OLD.id AND entity_type = 'group'; 
    RETURN OLD;
  END IF; 
  RETURN NULL;
END; $$ LANGUAGE plpgsql;

-- B. Trigger for categories
CREATE OR REPLACE FUNCTION sync_category_slug_registry() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.slug IS NOT NULL AND NEW.slug <> '' AND NEW.deleted_at IS NULL THEN
      PERFORM check_slug_conflict(NEW.slug, NEW.id, 'category');

      INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
      VALUES (NEW.slug, 'category', NEW.id, NOW()) 
      ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
    END IF; 
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      UPDATE slug_registry SET deleted_at = NEW.deleted_at, updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'category';
    ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        PERFORM check_slug_conflict(NEW.slug, NEW.id, 'category');

        INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
        VALUES (NEW.slug, 'category', NEW.id, NOW()) 
        ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
      END IF;
    ELSIF OLD.slug IS DISTINCT FROM NEW.slug AND NEW.deleted_at IS NULL THEN
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        PERFORM check_slug_conflict(NEW.slug, NEW.id, 'category');
      END IF;

      UPDATE slug_registry SET deleted_at = NOW(), updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'category';
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
        VALUES (NEW.slug, 'category', NEW.id, NOW()) 
        ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
      END IF;
    ELSIF NEW.deleted_at IS NULL THEN
      UPDATE slug_registry SET updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'category';
    END IF; 
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM slug_registry WHERE entity_id = OLD.id AND entity_type = 'category'; 
    RETURN OLD;
  END IF; 
  RETURN NULL;
END; $$ LANGUAGE plpgsql;

-- C. Trigger for brands
CREATE OR REPLACE FUNCTION sync_brand_slug_registry() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.slug IS NOT NULL AND NEW.slug <> '' AND NEW.deleted_at IS NULL THEN
      PERFORM check_slug_conflict(NEW.slug, NEW.id, 'brand');

      INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
      VALUES (NEW.slug, 'brand', NEW.id, NOW()) 
      ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
    END IF; 
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      UPDATE slug_registry SET deleted_at = NEW.deleted_at, updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'brand';
    ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        PERFORM check_slug_conflict(NEW.slug, NEW.id, 'brand');

        INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
        VALUES (NEW.slug, 'brand', NEW.id, NOW()) 
        ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
      END IF;
    ELSIF OLD.slug IS DISTINCT FROM NEW.slug AND NEW.deleted_at IS NULL THEN
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        PERFORM check_slug_conflict(NEW.slug, NEW.id, 'brand');
      END IF;

      UPDATE slug_registry SET deleted_at = NOW(), updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'brand';
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
        VALUES (NEW.slug, 'brand', NEW.id, NOW()) 
        ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
      END IF;
    ELSIF NEW.deleted_at IS NULL THEN
      UPDATE slug_registry SET updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'brand';
    END IF; 
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM slug_registry WHERE entity_id = OLD.id AND entity_type = 'brand'; 
    RETURN OLD;
  END IF; 
  RETURN NULL;
END; $$ LANGUAGE plpgsql;

-- D. Trigger for products
CREATE OR REPLACE FUNCTION sync_product_slug_registry() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.slug IS NOT NULL AND NEW.slug <> '' AND NEW.deleted_at IS NULL THEN
      PERFORM check_slug_conflict(NEW.slug, NEW.id, 'product');

      INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
      VALUES (NEW.slug, 'product', NEW.id, NOW()) 
      ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
    END IF; 
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      UPDATE slug_registry SET deleted_at = NEW.deleted_at, updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'product';
    ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        PERFORM check_slug_conflict(NEW.slug, NEW.id, 'product');

        INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
        VALUES (NEW.slug, 'product', NEW.id, NOW()) 
        ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
      END IF;
    ELSIF OLD.slug IS DISTINCT FROM NEW.slug AND NEW.deleted_at IS NULL THEN
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        PERFORM check_slug_conflict(NEW.slug, NEW.id, 'product');
      END IF;

      UPDATE slug_registry SET deleted_at = NOW(), updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'product';
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
        VALUES (NEW.slug, 'product', NEW.id, NOW()) 
        ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
      END IF;
    ELSIF NEW.deleted_at IS NULL THEN
      UPDATE slug_registry SET updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'product';
    END IF; 
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM slug_registry WHERE entity_id = OLD.id AND entity_type = 'product'; 
    RETURN OLD;
  END IF; 
  RETURN NULL;
END; $$ LANGUAGE plpgsql;
