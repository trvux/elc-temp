const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// USE SERVICE ROLE KEY FOR BYPASSING RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const parentId = "f300f65c-bab7-4351-9a3f-3ef22e5d3b02"; // "Máy lạnh"
  
  console.log(`Force updating children of ID: ${parentId} using Service Role...`);

  // Get all children
  const { data: children } = await supabase
    .from("categories")
    .select("id, name")
    .eq("parent_id", parentId);

  if (!children || children.length === 0) {
    console.log("No child categories found");
    return;
  }

  for (const child of children) {
    const newTitle = `Máy lạnh ${child.name.toLowerCase()} chính hãng, giá rẻ nhất | Điện máy ELC`;
    const newDesc = `Chuyên cung cấp Máy lạnh ${child.name.toLowerCase()} chính hãng tại Điện máy ELC. Giá tốt nhất thị trường, hỗ trợ thi công lắp đặt chuyên nghiệp. Xem ngay!`;
    
    console.log(`Updating ${child.name} -> ${newTitle}`);
    
    const { error } = await supabase
      .from("categories")
      .update({ 
        meta_title: newTitle,
        meta_description: newDesc
      })
      .eq("id", child.id);
    
    if (error) {
      console.error(`Error updating ${child.name}:`, error);
    } else {
      console.log(`Successfully updated ${child.name}`);
    }
  }

  console.log("FORCE Update completed!");
}

run();
