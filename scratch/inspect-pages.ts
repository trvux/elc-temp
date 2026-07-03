import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function inspect() {
  const { data, error } = await supabase
    .from("pages")
    .select("id, slug, title, meta_title, meta_description, is_published")
    .is("deleted_at", null);

  if (error) {
    console.error("Error:", error.message);
    return;
  }

  console.log(`Total pages: ${data.length}`);
  data.forEach((p) => {
    console.log(`\nSlug: ${p.slug}`);
    console.log(`Title: ${p.title}`);
    console.log(`Meta Title: ${p.meta_title || "NULL"}`);
    console.log(`Published: ${p.is_published}`);
  });
}

inspect().catch(console.error);
