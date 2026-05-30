-- ============================================================================
-- BULLETPROOF SLUG REGISTRY SETUP WITH CONFLICT PREVENTION
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

-- 4. BULLETPROOF TRIGGERS (PREVENTS SILENT OVERWRITE OF ACTIVE SLUGS)

-- A. Trigger function for group_categories
CREATE OR REPLACE FUNCTION sync_group_slug_registry() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.slug IS NOT NULL AND NEW.slug <> '' AND NEW.deleted_at IS NULL THEN
      -- Verify if active slug is already taken by another entity
      IF EXISTS (
        SELECT 1 FROM slug_registry 
        WHERE slug = NEW.slug 
          AND deleted_at IS NULL 
          AND (entity_id <> NEW.id OR entity_type <> 'group')
      ) THEN
        RAISE EXCEPTION 'Slug "%" is already in use by another active entity.', NEW.slug;
      END IF;

      INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
      VALUES (NEW.slug, 'group', NEW.id, NOW()) 
      ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
    END IF; 
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- On Soft Delete
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      UPDATE slug_registry SET deleted_at = NEW.deleted_at, updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'group';
      
    -- On Restore
    ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        -- Verify if active slug is already taken
        IF EXISTS (
          SELECT 1 FROM slug_registry 
          WHERE slug = NEW.slug 
            AND deleted_at IS NULL 
            AND (entity_id <> NEW.id OR entity_type <> 'group')
        ) THEN
          RAISE EXCEPTION 'Slug "%" is already in use by another active entity.', NEW.slug;
        END IF;

        INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
        VALUES (NEW.slug, 'group', NEW.id, NOW()) 
        ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
      END IF;
      
    -- On Slug Change
    ELSIF OLD.slug IS DISTINCT FROM NEW.slug AND NEW.deleted_at IS NULL THEN
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        -- Verify if active slug is already taken
        IF EXISTS (
          SELECT 1 FROM slug_registry 
          WHERE slug = NEW.slug 
            AND deleted_at IS NULL 
            AND (entity_id <> NEW.id OR entity_type <> 'group')
        ) THEN
          RAISE EXCEPTION 'Slug "%" is already in use by another active entity.', NEW.slug;
        END IF;
      END IF;

      UPDATE slug_registry SET deleted_at = NOW(), updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'group';
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
        VALUES (NEW.slug, 'group', NEW.id, NOW()) 
        ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
      END IF;
      
    -- Normal updates
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

-- B. Trigger function for categories
CREATE OR REPLACE FUNCTION sync_category_slug_registry() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.slug IS NOT NULL AND NEW.slug <> '' AND NEW.deleted_at IS NULL THEN
      -- Verify if active slug is already taken by another entity
      IF EXISTS (
        SELECT 1 FROM slug_registry 
        WHERE slug = NEW.slug 
          AND deleted_at IS NULL 
          AND (entity_id <> NEW.id OR entity_type <> 'category')
      ) THEN
        RAISE EXCEPTION 'Slug "%" is already in use by another active entity.', NEW.slug;
      END IF;

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
        -- Verify if active slug is already taken
        IF EXISTS (
          SELECT 1 FROM slug_registry 
          WHERE slug = NEW.slug 
            AND deleted_at IS NULL 
            AND (entity_id <> NEW.id OR entity_type <> 'category')
        ) THEN
          RAISE EXCEPTION 'Slug "%" is already in use by another active entity.', NEW.slug;
        END IF;

        INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
        VALUES (NEW.slug, 'category', NEW.id, NOW()) 
        ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
      END IF;
    ELSIF OLD.slug IS DISTINCT FROM NEW.slug AND NEW.deleted_at IS NULL THEN
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        -- Verify if active slug is already taken
        IF EXISTS (
          SELECT 1 FROM slug_registry 
          WHERE slug = NEW.slug 
            AND deleted_at IS NULL 
            AND (entity_id <> NEW.id OR entity_type <> 'category')
        ) THEN
          RAISE EXCEPTION 'Slug "%" is already in use by another active entity.', NEW.slug;
        END IF;
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

-- C. Trigger function for brands
CREATE OR REPLACE FUNCTION sync_brand_slug_registry() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.slug IS NOT NULL AND NEW.slug <> '' AND NEW.deleted_at IS NULL THEN
      -- Verify if active slug is already taken by another entity
      IF EXISTS (
        SELECT 1 FROM slug_registry 
        WHERE slug = NEW.slug 
          AND deleted_at IS NULL 
          AND (entity_id <> NEW.id OR entity_type <> 'brand')
      ) THEN
        RAISE EXCEPTION 'Slug "%" is already in use by another active entity.', NEW.slug;
      END IF;

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
        -- Verify if active slug is already taken
        IF EXISTS (
          SELECT 1 FROM slug_registry 
          WHERE slug = NEW.slug 
            AND deleted_at IS NULL 
            AND (entity_id <> NEW.id OR entity_type <> 'brand')
        ) THEN
          RAISE EXCEPTION 'Slug "%" is already in use by another active entity.', NEW.slug;
        END IF;

        INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
        VALUES (NEW.slug, 'brand', NEW.id, NOW()) 
        ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
      END IF;
    ELSIF OLD.slug IS DISTINCT FROM NEW.slug AND NEW.deleted_at IS NULL THEN
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        -- Verify if active slug is already taken
        IF EXISTS (
          SELECT 1 FROM slug_registry 
          WHERE slug = NEW.slug 
            AND deleted_at IS NULL 
            AND (entity_id <> NEW.id OR entity_type <> 'brand')
        ) THEN
          RAISE EXCEPTION 'Slug "%" is already in use by another active entity.', NEW.slug;
        END IF;
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

-- D. Trigger function for products
CREATE OR REPLACE FUNCTION sync_product_slug_registry() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.slug IS NOT NULL AND NEW.slug <> '' AND NEW.deleted_at IS NULL THEN
      -- Verify if active slug is already taken by another entity
      IF EXISTS (
        SELECT 1 FROM slug_registry 
        WHERE slug = NEW.slug 
          AND deleted_at IS NULL 
          AND (entity_id <> NEW.id OR entity_type <> 'product')
      ) THEN
        RAISE EXCEPTION 'Slug "%" is already in use by another active entity.', NEW.slug;
      END IF;

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
        -- Verify if active slug is already taken
        IF EXISTS (
          SELECT 1 FROM slug_registry 
          WHERE slug = NEW.slug 
            AND deleted_at IS NULL 
            AND (entity_id <> NEW.id OR entity_type <> 'product')
        ) THEN
          RAISE EXCEPTION 'Slug "%" is already in use by another active entity.', NEW.slug;
        END IF;

        INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
        VALUES (NEW.slug, 'product', NEW.id, NOW()) 
        ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
      END IF;
    ELSIF OLD.slug IS DISTINCT FROM NEW.slug AND NEW.deleted_at IS NULL THEN
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        -- Verify if active slug is already taken
        IF EXISTS (
          SELECT 1 FROM slug_registry 
          WHERE slug = NEW.slug 
            AND deleted_at IS NULL 
            AND (entity_id <> NEW.id OR entity_type <> 'product')
        ) THEN
          RAISE EXCEPTION 'Slug "%" is already in use by another active entity.', NEW.slug;
        END IF;
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
