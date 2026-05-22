import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface ProjectRow {
  id: string;
  title: string;
  slug: string;
  deleted_at: string | null;
}

interface ServiceTypeRow {
  id: string;
  name: string;
  slug: string;
  deleted_at: string | null;
}

interface RegistryRow {
  slug: string;
  entity_type: string;
  entity_id: string;
  deleted_at: string | null;
}

async function checkAndSyncRegistry() {
  console.log('Starting check and sync registry for projects and service types');

  // Fetch all active projects
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, title, slug, deleted_at')
    .is('deleted_at', null);

  if (projectsError) {
    console.error('Error fetching projects:', projectsError.message);
    return;
  }

  console.log(`Fetched ${projects?.length || 0} active projects`);

  // Fetch all active service types
  const { data: serviceTypes, error: serviceTypesError } = await supabase
    .from('service_type')
    .select('id, name, slug, deleted_at')
    .is('deleted_at', null);

  if (serviceTypesError) {
    console.error('Error fetching service types:', serviceTypesError.message);
    return;
  }

  console.log(`Fetched ${serviceTypes?.length || 0} active service types`);

  // Fetch all slug_registry entries for projects and service types
  const { data: registryEntries, error: registryError } = await supabase
    .from('slug_registry')
    .select('slug, entity_type, entity_id, deleted_at')
    .in('entity_type', ['project', 'service_type'])
    .is('deleted_at', null);

  if (registryError) {
    console.error('Error fetching slug registry:', registryError.message);
    return;
  }

  console.log(`Fetched ${registryEntries?.length || 0} active project/service_type registry entries`);

  const registryMap = new Map<string, RegistryRow>();
  if (registryEntries) {
    for (const entry of registryEntries) {
      registryMap.set(`${entry.entity_type}:${entry.entity_id}`, entry);
    }
  }

  // 1. Check projects
  if (projects) {
    for (const proj of projects as ProjectRow[]) {
      const key = `project:${proj.id}`;
      const reg = registryMap.get(key);
      if (!reg) {
        console.log(`Project "${proj.title}" (slug: "${proj.slug}") is missing from slug_registry. Inserting...`);
        const { error: insertError } = await supabase
          .from('slug_registry')
          .insert({
            slug: proj.slug,
            entity_type: 'project',
            entity_id: proj.id,
            created_at: new Date().toISOString()
          });
        if (insertError) {
          console.error(`Failed to insert project "${proj.title}":`, insertError.message);
        } else {
          console.log(`Successfully synced project "${proj.title}"`);
        }
      } else if (reg.slug !== proj.slug) {
        console.log(`Project "${proj.title}" slug mismatch. Registry: "${reg.slug}", Project: "${proj.slug}". Updating...`);
        const { error: updateError } = await supabase
          .from('slug_registry')
          .update({ slug: proj.slug, updated_at: new Date().toISOString() })
          .eq('entity_id', proj.id)
          .eq('entity_type', 'project');
        if (updateError) {
          console.error(`Failed to update project "${proj.title}" slug:`, updateError.message);
        } else {
          console.log(`Successfully updated project "${proj.title}" slug`);
        }
      }
    }
  }

  // 2. Check service types
  if (serviceTypes) {
    for (const st of serviceTypes as ServiceTypeRow[]) {
      const key = `service_type:${st.id}`;
      const reg = registryMap.get(key);
      if (!reg) {
        console.log(`Service type "${st.name}" (slug: "${st.slug}") is missing from slug_registry. Inserting...`);
        const { error: insertError } = await supabase
          .from('slug_registry')
          .insert({
            slug: st.slug,
            entity_type: 'service_type',
            entity_id: st.id,
            created_at: new Date().toISOString()
          });
        if (insertError) {
          console.error(`Failed to insert service type "${st.name}":`, insertError.message);
        } else {
          console.log(`Successfully synced service type "${st.name}"`);
        }
      } else if (reg.slug !== st.slug) {
        console.log(`Service type "${st.name}" slug mismatch. Registry: "${reg.slug}", Service Type: "${st.slug}". Updating...`);
        const { error: updateError } = await supabase
          .from('slug_registry')
          .update({ slug: st.slug, updated_at: new Date().toISOString() })
          .eq('entity_id', st.id)
          .eq('entity_type', 'service_type');
        if (updateError) {
          console.error(`Failed to update service type "${st.name}" slug:`, updateError.message);
        } else {
          console.log(`Successfully updated service type "${st.name}" slug`);
        }
      }
    }
  }

  console.log('Check and sync registry completed');
}

checkAndSyncRegistry();
