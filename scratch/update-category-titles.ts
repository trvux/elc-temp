import { createClient } from "./shared/lib/supabase/server";

async function run() {
  const supabase = await createClient();
  
  // 1. Get "Máy lạnh" parent category
  const { data: parent } = await supabase
    .from("categories")
    .select("id, name")
    .eq("name", "Máy lạnh")
    .single();

  if (!parent) {
    console.error("Parent category 'Máy lạnh' not found");
    return;
  }

  console.log(`Found parent: ${parent.name} (${parent.id})`);

  // 2. Get all children
  const { data: children } = await supabase
    .from("categories")
    .select("id, name, meta_title")
    .eq("parent_id", parent.id);

  if (!children || children.length === 0) {
    console.log("No child categories found");
    return;
  }

  for (const child of children) {
    const newTitle = `Máy lạnh ${child.name.toLowerCase()} chính hãng, giá tốt nhất | Điện máy ELC`;
    console.log(`Updating ${child.name} -> ${newTitle}`);
    
    await supabase
      .from("categories")
      .update({ meta_title: newTitle })
      .eq("id", child.id);
  }

  console.log("Update completed!");
}

run();
