const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log("Updating project category titles to use 'Dự án'...");

  // 1. Get all categories of type project
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, type")
    .eq("type", "project");

  if (!categories || categories.length === 0) {
    console.log("No project categories found");
    return;
  }

  for (const cat of categories) {
    const newTitle = `Dự án ${cat.name} tiêu biểu | Điện máy ELC`;
    const newDesc = `Khám phá các công trình ${cat.name} thực tế do ELC thực hiện. Giải pháp không khí chuyên nghiệp, thẩm mỹ và bền bỉ. Xem ngay các dự án tiêu biểu!`;
    
    console.log(`Updating PROJECT category: ${cat.name} -> ${newTitle}`);
    
    await supabase
      .from("categories")
      .update({ 
        meta_title: newTitle,
        meta_description: newDesc
      })
      .eq("id", cat.id);
  }

  console.log("Project titles update completed!");
}

run();
