-- ==========================================
-- 1. THÊM CỘT updated_at VÀ deleted_at CHO slug_registry
-- ==========================================
ALTER TABLE slug_registry 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ==========================================
-- 2. SỬA LỖI RLS UPDATE (CHO PHÉP ADMIN SOFT-DELETE TRÊN 4 BẢNG)
-- ==========================================
-- Xóa Policy cũ (nếu có) để tránh xung đột
DROP POLICY IF EXISTS "Allow Soft Delete for Admin_group" ON group_categories;
DROP POLICY IF EXISTS "Allow Soft Delete for Admin_cat" ON category;
DROP POLICY IF EXISTS "Allow Soft Delete for Admin_brand" ON brands;
DROP POLICY IF EXISTS "Allow Soft Delete for Admin_prod" ON products;

-- Thêm Policy cho phép UPDATE (Soft-delete)
CREATE POLICY "Allow Soft Delete for Admin_group" ON group_categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow Soft Delete for Admin_cat" ON category FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow Soft Delete for Admin_brand" ON brands FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow Soft Delete for Admin_prod" ON products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- 3. RLS CHO BẢNG slug_registry
-- ==========================================
ALTER TABLE slug_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cho phép tất cả mọi người đọc" ON slug_registry;
CREATE POLICY "Cho phép tất cả mọi người đọc" ON slug_registry FOR SELECT USING (true);

DROP POLICY IF EXISTS "Cho phép Admin toàn quyền CRUD" ON slug_registry;
CREATE POLICY "Cho phép Admin toàn quyền CRUD" ON slug_registry FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- 4. CẬP NHẬT TRIGGER TỰ ĐỘNG ĐỒNG BỘ (BỎ SECURITY DEFINER + HỖ TRỢ SOFT DELETE TRÊN SLUG_REGISTRY)
-- ==========================================

-- A. Trigger cho group_categories
CREATE OR REPLACE FUNCTION sync_group_slug_registry() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.slug IS NOT NULL AND NEW.slug <> '' AND NEW.deleted_at IS NULL THEN
      INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
      VALUES (NEW.slug, 'group', NEW.id, NOW()) 
      ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
    END IF; 
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Khi Soft Delete (Bấm nút Xóa trên Admin)
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      UPDATE slug_registry SET deleted_at = NEW.deleted_at, updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'group';
      
    -- Khi Khôi phục (Restore)
    ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
        VALUES (NEW.slug, 'group', NEW.id, NOW()) 
        ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
      END IF;
      
    -- Khi đổi Slug bình thường (Xóa mềm slug cũ, tạo slug mới)
    ELSIF OLD.slug IS DISTINCT FROM NEW.slug AND NEW.deleted_at IS NULL THEN
      UPDATE slug_registry SET deleted_at = NOW(), updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'group';
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
        VALUES (NEW.slug, 'group', NEW.id, NOW()) 
        ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
      END IF;
      
    -- Khi update các trường khác (Cập nhật updated_at của slug)
    ELSIF NEW.deleted_at IS NULL THEN
      UPDATE slug_registry SET updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'group';
    END IF; 
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN 
    -- Hard delete
    DELETE FROM slug_registry WHERE entity_id = OLD.id AND entity_type = 'group'; 
    RETURN OLD;
  END IF; 
  RETURN NULL;
END; $$ LANGUAGE plpgsql;

-- B. Trigger cho category
CREATE OR REPLACE FUNCTION sync_category_slug_registry() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.slug IS NOT NULL AND NEW.slug <> '' AND NEW.deleted_at IS NULL THEN
      INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
      VALUES (NEW.slug, 'category', NEW.id, NOW()) 
      ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
    END IF; RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      UPDATE slug_registry SET deleted_at = NEW.deleted_at, updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'category';
    ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
        VALUES (NEW.slug, 'category', NEW.id, NOW()) 
        ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
      END IF;
    ELSIF OLD.slug IS DISTINCT FROM NEW.slug AND NEW.deleted_at IS NULL THEN
      UPDATE slug_registry SET deleted_at = NOW(), updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'category';
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
        VALUES (NEW.slug, 'category', NEW.id, NOW()) 
        ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
      END IF;
    ELSIF NEW.deleted_at IS NULL THEN
      UPDATE slug_registry SET updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'category';
    END IF; RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM slug_registry WHERE entity_id = OLD.id AND entity_type = 'category'; RETURN OLD;
  END IF; RETURN NULL;
END; $$ LANGUAGE plpgsql;

-- C. Trigger cho brands
CREATE OR REPLACE FUNCTION sync_brand_slug_registry() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.slug IS NOT NULL AND NEW.slug <> '' AND NEW.deleted_at IS NULL THEN
      INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
      VALUES (NEW.slug, 'brand', NEW.id, NOW()) 
      ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
    END IF; RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      UPDATE slug_registry SET deleted_at = NEW.deleted_at, updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'brand';
    ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
        VALUES (NEW.slug, 'brand', NEW.id, NOW()) 
        ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
      END IF;
    ELSIF OLD.slug IS DISTINCT FROM NEW.slug AND NEW.deleted_at IS NULL THEN
      UPDATE slug_registry SET deleted_at = NOW(), updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'brand';
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
        VALUES (NEW.slug, 'brand', NEW.id, NOW()) 
        ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
      END IF;
    ELSIF NEW.deleted_at IS NULL THEN
      UPDATE slug_registry SET updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'brand';
    END IF; RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM slug_registry WHERE entity_id = OLD.id AND entity_type = 'brand'; RETURN OLD;
  END IF; RETURN NULL;
END; $$ LANGUAGE plpgsql;

-- D. Trigger cho products
CREATE OR REPLACE FUNCTION sync_product_slug_registry() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.slug IS NOT NULL AND NEW.slug <> '' AND NEW.deleted_at IS NULL THEN
      INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
      VALUES (NEW.slug, 'product', NEW.id, NOW()) 
      ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
    END IF; RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      UPDATE slug_registry SET deleted_at = NEW.deleted_at, updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'product';
    ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
        VALUES (NEW.slug, 'product', NEW.id, NOW()) 
        ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
      END IF;
    ELSIF OLD.slug IS DISTINCT FROM NEW.slug AND NEW.deleted_at IS NULL THEN
      UPDATE slug_registry SET deleted_at = NOW(), updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'product';
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
        VALUES (NEW.slug, 'product', NEW.id, NOW()) 
        ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
      END IF;
    ELSIF NEW.deleted_at IS NULL THEN
      UPDATE slug_registry SET updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'product';
    END IF; RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM slug_registry WHERE entity_id = OLD.id AND entity_type = 'product'; RETURN OLD;
  END IF; RETURN NULL;
END; $$ LANGUAGE plpgsql;
