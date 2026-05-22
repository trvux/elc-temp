import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "../shared/lib/supabase/server";

interface QueryCategory {
  id: string;
  name: string;
  slug: string;
  deleted_at: string | null;
}

interface QueryProject {
  id: string;
  service_type_id: string | null;
  is_published: boolean;
  deleted_at: string | null;
}

interface QueryRow {
  category: QueryCategory | null;
  projects: QueryProject | null;
}

async function run() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("project_category")
      .select(`
        category:categories(id, name, slug, deleted_at),
        projects!inner(id, service_type_id, is_published, deleted_at)
      `)
      .eq("projects.is_published", true)
      .is("projects.deleted_at", null)
      .is("categories.deleted_at", null);

    if (error) {
      console.error("Supabase Error:", error);
      return;
    }

    const typedData = data as unknown as QueryRow[];
    console.log("Raw rows matched:", typedData ? typedData.length : 0);
    console.log("First 3 rows:", JSON.stringify(typedData ? typedData.slice(0, 3) : [], null, 2));
  } catch (err) {
    console.error("Execution Error:", err);
  }
}

run();
