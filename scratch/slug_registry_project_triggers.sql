-- 0. Cap nhat CHECK constraint cua bang slug_registry de cho phep 'service_type' va 'project'
ALTER TABLE slug_registry DROP CONSTRAINT IF EXISTS slug_registry_entity_type_check;

ALTER TABLE slug_registry ADD CONSTRAINT slug_registry_entity_type_check 
CHECK (entity_type IN ('group', 'category', 'categories', 'brand', 'product', 'service_type', 'project'));


-- 1. Trigger cho service_type
CREATE OR REPLACE FUNCTION sync_service_type_slug_registry() RETURNS TRIGGER 
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.slug IS NOT NULL AND NEW.slug <> '' AND NEW.deleted_at IS NULL THEN
      INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
      VALUES (NEW.slug, 'service_type', NEW.id, NOW()) 
      ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
    END IF; 
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Khi Soft Delete
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      UPDATE slug_registry SET deleted_at = NEW.deleted_at, updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'service_type';
      
    -- Khi Khoi phuc (Restore)
    ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
        VALUES (NEW.slug, 'service_type', NEW.id, NOW()) 
        ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
      END IF;
      
    -- Khi doi Slug binh thuong
    ELSIF OLD.slug IS DISTINCT FROM NEW.slug AND NEW.deleted_at IS NULL THEN
      UPDATE slug_registry SET deleted_at = NOW(), updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'service_type';
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
        VALUES (NEW.slug, 'service_type', NEW.id, NOW()) 
        ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
      END IF;
      
    -- Khi update cac truong khac
    ELSIF NEW.deleted_at IS NULL THEN
      UPDATE slug_registry SET updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'service_type';
    END IF; 
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN 
    -- Hard delete
    DELETE FROM slug_registry WHERE entity_id = OLD.id AND entity_type = 'service_type'; 
    RETURN OLD;
  END IF; 
  RETURN NULL;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_service_type_slug ON service_type;
CREATE TRIGGER trg_sync_service_type_slug
AFTER INSERT OR UPDATE OR DELETE ON service_type
FOR EACH ROW EXECUTE FUNCTION sync_service_type_slug_registry();


-- 2. Trigger cho projects (du an)
CREATE OR REPLACE FUNCTION sync_project_slug_registry() RETURNS TRIGGER 
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.slug IS NOT NULL AND NEW.slug <> '' AND NEW.deleted_at IS NULL THEN
      INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
      VALUES (NEW.slug, 'project', NEW.id, NOW()) 
      ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
    END IF; 
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Khi Soft Delete
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      UPDATE slug_registry SET deleted_at = NEW.deleted_at, updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'project';
      
    -- Khi Khoi phuc (Restore)
    ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
        VALUES (NEW.slug, 'project', NEW.id, NOW()) 
        ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
      END IF;
      
    -- Khi doi Slug binh thuong
    ELSIF OLD.slug IS DISTINCT FROM NEW.slug AND NEW.deleted_at IS NULL THEN
      UPDATE slug_registry SET deleted_at = NOW(), updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'project';
      IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
        INSERT INTO slug_registry (slug, entity_type, entity_id, created_at) 
        VALUES (NEW.slug, 'project', NEW.id, NOW()) 
        ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();
      END IF;
      
    -- Khi update cac truong khac
    ELSIF NEW.deleted_at IS NULL THEN
      UPDATE slug_registry SET updated_at = NOW() WHERE entity_id = OLD.id AND entity_type = 'project';
    END IF; 
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN 
    -- Hard delete
    DELETE FROM slug_registry WHERE entity_id = OLD.id AND entity_type = 'project'; 
    RETURN OLD;
  END IF; 
  RETURN NULL;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_project_slug ON projects;
CREATE TRIGGER trg_sync_project_slug
AFTER INSERT OR UPDATE OR DELETE ON projects
FOR EACH ROW EXECUTE FUNCTION sync_project_slug_registry();


-- 3. Dong bo du lieu hien tai vao slug_registry
INSERT INTO slug_registry (slug, entity_type, entity_id, created_at)
SELECT slug, 'service_type', id, NOW()
FROM service_type
WHERE slug IS NOT NULL AND slug <> '' AND deleted_at IS NULL
ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();

INSERT INTO slug_registry (slug, entity_type, entity_id, created_at)
SELECT slug, 'project', id, NOW()
FROM projects
WHERE slug IS NOT NULL AND slug <> '' AND deleted_at IS NULL
ON CONFLICT (slug) DO UPDATE SET deleted_at = NULL, entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, updated_at = NOW();


-- 4. RLS cho service_type
ALTER TABLE service_type ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read" ON service_type;
CREATE POLICY "public_read" ON service_type FOR SELECT USING (deleted_at IS NULL);
DROP POLICY IF EXISTS "admin_all" ON service_type;
CREATE POLICY "admin_all" ON service_type FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 5. RLS cho projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read" ON projects;
CREATE POLICY "public_read" ON projects FOR SELECT USING (deleted_at IS NULL);
DROP POLICY IF EXISTS "admin_all" ON projects;
CREATE POLICY "admin_all" ON projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
