-- ==========================================
-- PHẦN 1: THIẾT LẬP RLS POLICY CHO SLUG_REGISTRY
-- ==========================================
ALTER TABLE slug_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cho phép tất cả mọi người đọc" ON slug_registry;
CREATE POLICY "Cho phép tất cả mọi người đọc"
ON slug_registry FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Cho phép Admin toàn quyền CRUD" ON slug_registry;
CREATE POLICY "Cho phép Admin toàn quyền CRUD"
ON slug_registry FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- ==========================================
-- PHẦN 2: CẬP NHẬT LẠI TRIGGER (BỎ SECURITY DEFINER)
-- ==========================================

-- 1. Trigger cho group_categories
CREATE OR REPLACE FUNCTION sync_group_slug_registry() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.slug IS NOT NULL AND NEW.slug <> '' AND NEW.deleted_at IS NULL THEN
      INSERT INTO slug_registry (slug, entity_type, entity_id) VALUES (NEW.slug, 'group', NEW.id) ON CONFLICT (slug) DO NOTHING;
    END IF; RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      DELETE FROM slug_registry WHERE entity_id = OLD.id AND entity_type = 'group';
    ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        INSERT INTO slug_registry (slug, entity_type, entity_id) VALUES (NEW.slug, 'group', NEW.id) ON CONFLICT (slug) DO NOTHING;
      END IF;
    ELSIF OLD.slug IS DISTINCT FROM NEW.slug AND NEW.deleted_at IS NULL THEN
      DELETE FROM slug_registry WHERE entity_id = OLD.id AND entity_type = 'group';
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        INSERT INTO slug_registry (slug, entity_type, entity_id) VALUES (NEW.slug, 'group', NEW.id) ON CONFLICT (slug) DO NOTHING;
      END IF;
    END IF; RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN 
    DELETE FROM slug_registry WHERE entity_id = OLD.id AND entity_type = 'group'; RETURN OLD;
  END IF; RETURN NULL;
END; $$ LANGUAGE plpgsql;

-- 2. Trigger cho category
CREATE OR REPLACE FUNCTION sync_category_slug_registry() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.slug IS NOT NULL AND NEW.slug <> '' AND NEW.deleted_at IS NULL THEN
      INSERT INTO slug_registry (slug, entity_type, entity_id) VALUES (NEW.slug, 'category', NEW.id) ON CONFLICT (slug) DO NOTHING;
    END IF; RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      DELETE FROM slug_registry WHERE entity_id = OLD.id AND entity_type = 'category';
    ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        INSERT INTO slug_registry (slug, entity_type, entity_id) VALUES (NEW.slug, 'category', NEW.id) ON CONFLICT (slug) DO NOTHING;
      END IF;
    ELSIF OLD.slug IS DISTINCT FROM NEW.slug AND NEW.deleted_at IS NULL THEN
      DELETE FROM slug_registry WHERE entity_id = OLD.id AND entity_type = 'category';
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        INSERT INTO slug_registry (slug, entity_type, entity_id) VALUES (NEW.slug, 'category', NEW.id) ON CONFLICT (slug) DO NOTHING;
      END IF;
    END IF; RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM slug_registry WHERE entity_id = OLD.id AND entity_type = 'category'; RETURN OLD;
  END IF; RETURN NULL;
END; $$ LANGUAGE plpgsql;

-- 3. Trigger cho brands
CREATE OR REPLACE FUNCTION sync_brand_slug_registry() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.slug IS NOT NULL AND NEW.slug <> '' AND NEW.deleted_at IS NULL THEN
      INSERT INTO slug_registry (slug, entity_type, entity_id) VALUES (NEW.slug, 'brand', NEW.id) ON CONFLICT (slug) DO NOTHING;
    END IF; RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      DELETE FROM slug_registry WHERE entity_id = OLD.id AND entity_type = 'brand';
    ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        INSERT INTO slug_registry (slug, entity_type, entity_id) VALUES (NEW.slug, 'brand', NEW.id) ON CONFLICT (slug) DO NOTHING;
      END IF;
    ELSIF OLD.slug IS DISTINCT FROM NEW.slug AND NEW.deleted_at IS NULL THEN
      DELETE FROM slug_registry WHERE entity_id = OLD.id AND entity_type = 'brand';
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        INSERT INTO slug_registry (slug, entity_type, entity_id) VALUES (NEW.slug, 'brand', NEW.id) ON CONFLICT (slug) DO NOTHING;
      END IF;
    END IF; RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM slug_registry WHERE entity_id = OLD.id AND entity_type = 'brand'; RETURN OLD;
  END IF; RETURN NULL;
END; $$ LANGUAGE plpgsql;

-- 4. Trigger cho products
CREATE OR REPLACE FUNCTION sync_product_slug_registry() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.slug IS NOT NULL AND NEW.slug <> '' AND NEW.deleted_at IS NULL THEN
      INSERT INTO slug_registry (slug, entity_type, entity_id) VALUES (NEW.slug, 'product', NEW.id) ON CONFLICT (slug) DO NOTHING;
    END IF; RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      DELETE FROM slug_registry WHERE entity_id = OLD.id AND entity_type = 'product';
    ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        INSERT INTO slug_registry (slug, entity_type, entity_id) VALUES (NEW.slug, 'product', NEW.id) ON CONFLICT (slug) DO NOTHING;
      END IF;
    ELSIF OLD.slug IS DISTINCT FROM NEW.slug AND NEW.deleted_at IS NULL THEN
      DELETE FROM slug_registry WHERE entity_id = OLD.id AND entity_type = 'product';
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        INSERT INTO slug_registry (slug, entity_type, entity_id) VALUES (NEW.slug, 'product', NEW.id) ON CONFLICT (slug) DO NOTHING;
      END IF;
    END IF; RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM slug_registry WHERE entity_id = OLD.id AND entity_type = 'product'; RETURN OLD;
  END IF; RETURN NULL;
END; $$ LANGUAGE plpgsql;
