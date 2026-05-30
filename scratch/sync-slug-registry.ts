import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // use service role key to bypass RLS and perform cleanup

const supabase = createClient(supabaseUrl, serviceRoleKey);

interface RegistryItem {
  slug: string;
  entity_type: string;
  entity_id: string;
  deleted_at: string | null;
}

interface DBEntity {
  id: string;
  slug: string;
  name?: string;
  title?: string;
}

async function syncSlugRegistry() {
  console.log("Starting Slug Registry Synchronization...");

  // 1. Fetch all items in slug_registry
  const { data: registryData, error: registryError } = await supabase
    .from("slug_registry")
    .select("*");

  if (registryError) {
    console.error("Error fetching slug_registry:", registryError.message);
    return;
  }

  const registry = (registryData || []) as RegistryItem[];
  console.log(`Found ${registry.length} items in slug_registry.`);

  // Create lookup maps
  const activeRegistryBySlug = new Map<string, RegistryItem>();
  const deletedRegistryBySlug = new Map<string, RegistryItem[]>();
  const registryByEntity = new Map<string, RegistryItem>();

  registry.forEach((item) => {
    registryByEntity.set(`${item.entity_type}:${item.entity_id}`, item);
    if (item.deleted_at === null) {
      activeRegistryBySlug.set(item.slug, item);
    } else {
      const existing = deletedRegistryBySlug.get(item.slug) || [];
      existing.push(item);
      deletedRegistryBySlug.set(item.slug, existing);
    }
  });

  // Helper function to sync a list of entities
  async function syncEntities(
    tableName: string,
    entityType: string,
    entities: DBEntity[]
  ) {
    console.log(`Processing table: ${tableName} (${entities.length} active items)...`);

    for (const entity of entities) {
      if (!entity.slug) {
        console.warn(`Entity ${entityType}:${entity.id} (${entity.name || entity.title}) has no slug.`);
        continue;
      }

      const entityKey = `${entityType}:${entity.id}`;
      const existingRegistry = registryByEntity.get(entityKey);
      const name = entity.name || entity.title || "Unnamed";

      // Case 1: Entity is not registered at all
      if (!existingRegistry) {
        console.log(`Entity ${entityKey} (${name}, slug: '${entity.slug}') not registered.`);

        // Check if the slug is taken by an active item
        const activeItem = activeRegistryBySlug.get(entity.slug);
        if (activeItem) {
          console.error(
            `Conflict: Slug '${entity.slug}' is already active for ${activeItem.entity_type}:${activeItem.entity_id}. Cannot sync ${entityKey}.`
          );
          continue;
        }

        // Check if the slug is taken by deleted items
        const deletedItems = deletedRegistryBySlug.get(entity.slug);
        if (deletedItems && deletedItems.length > 0) {
          console.log(`Slug '${entity.slug}' was taken by soft-deleted registry items. Cleaning them up...`);
          // Hard delete the deleted conflicting registry items to free up the unique constraint
          const { error: delError } = await supabase
            .from("slug_registry")
            .delete()
            .eq("slug", entity.slug);

          if (delError) {
            console.error(`Failed to delete conflicting soft-deleted slugs:`, delError.message);
            continue;
          }
          // Remove from local maps
          deletedRegistryBySlug.delete(entity.slug);
        }

        // Insert new registry item
        console.log(`Registering active slug '${entity.slug}' for ${entityKey}...`);
        const { error: insError } = await supabase
          .from("slug_registry")
          .insert({
            slug: entity.slug,
            entity_type: entityType,
            entity_id: entity.id,
            created_at: new Date().toISOString()
          });

        if (insError) {
          console.error(`Failed to register slug for ${entityKey}:`, insError.message);
        } else {
          console.log(`Registered successfully.`);
          // Update local registry mapping
          const newRegistryItem = {
            slug: entity.slug,
            entity_type: entityType,
            entity_id: entity.id,
            deleted_at: null
          };
          registryByEntity.set(entityKey, newRegistryItem);
          activeRegistryBySlug.set(entity.slug, newRegistryItem);
        }
      } 
      // Case 2: Entity is registered but has different details
      else {
        // If it's marked as deleted, or has a different slug
        if (existingRegistry.deleted_at !== null || existingRegistry.slug !== entity.slug) {
          console.log(
            `Entity ${entityKey} (${name}) registry mismatch. Current slug: '${existingRegistry.slug}' (deleted: ${existingRegistry.deleted_at !== null}), expected active slug: '${entity.slug}'`
          );

          // Clear any conflicting soft-deleted or matching slug first
          const conflictingActive = activeRegistryBySlug.get(entity.slug);
          if (conflictingActive && conflictingActive.entity_id !== entity.id) {
            console.error(
              `Conflict: Expected slug '${entity.slug}' is active for ${conflictingActive.entity_type}:${conflictingActive.entity_id}.`
            );
            continue;
          }

          // Clean up the registry item by deleting it first to avoid unique key conflicts on upsert
          const { error: delError } = await supabase
            .from("slug_registry")
            .delete()
            .eq("entity_id", entity.id)
            .eq("entity_type", entityType);

          if (delError) {
            console.error(`Failed to clear old registry for ${entityKey}:`, delError.message);
            continue;
          }

          // Delete any deleted registry item using the target slug
          const targetSlugDeleted = deletedRegistryBySlug.get(entity.slug);
          if (targetSlugDeleted && targetSlugDeleted.length > 0) {
            await supabase.from("slug_registry").delete().eq("slug", entity.slug);
            deletedRegistryBySlug.delete(entity.slug);
          }

          // Insert new registry item
          console.log(`Re-registering active slug '${entity.slug}' for ${entityKey}...`);
          const { error: insError } = await supabase
            .from("slug_registry")
            .insert({
              slug: entity.slug,
              entity_type: entityType,
              entity_id: entity.id,
              created_at: new Date().toISOString()
            });

          if (insError) {
            console.error(`Failed to re-register slug for ${entityKey}:`, insError.message);
          } else {
            console.log(`Re-registered successfully.`);
            const newRegistryItem = {
              slug: entity.slug,
              entity_type: entityType,
              entity_id: entity.id,
              deleted_at: null
            };
            registryByEntity.set(entityKey, newRegistryItem);
            activeRegistryBySlug.set(entity.slug, newRegistryItem);
          }
        }
      }
    }
  }

  // Fetch groups
  const { data: groups, error: groupsError } = await supabase
    .from("group_categories")
    .select("id, slug, name")
    .is("deleted_at", null);

  if (groupsError) {
    console.error("Error fetching group_categories:", groupsError.message);
  } else {
    await syncEntities("group_categories", "group", (groups || []) as DBEntity[]);
  }

  // Fetch categories
  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, slug, name")
    .is("deleted_at", null);

  if (categoriesError) {
    console.error("Error fetching categories:", categoriesError.message);
  } else {
    await syncEntities("categories", "category", (categories || []) as DBEntity[]);
  }

  // Fetch brands
  const { data: brands, error: brandsError } = await supabase
    .from("brands")
    .select("id, slug, name")
    .is("deleted_at", null);

  if (brandsError) {
    console.error("Error fetching brands:", brandsError.message);
  } else {
    await syncEntities("brands", "brand", (brands || []) as DBEntity[]);
  }

  // Fetch products
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, slug, name")
    .is("deleted_at", null);

  if (productsError) {
    console.error("Error fetching products:", productsError.message);
  } else {
    await syncEntities("products", "product", (products || []) as DBEntity[]);
  }

  console.log("Synchronization complete.");
}

syncSlugRegistry();
