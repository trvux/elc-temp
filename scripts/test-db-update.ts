import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Error: Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testDatabaseAttributes() {
  const projectId = "ac0ec2fd-1b74-4fb4-80ed-b0e41fbd78cb"; // Mr. Vĩnh
  console.log(`Checking project ID ${projectId}...`);

  const testDescription = {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [
          {
            type: "text",
            text: "Direct DB Test Heading Level 2"
          }
        ]
      }
    ]
  };

  console.log("Updating project directly in DB...");
  const { data: updateData, error: updateError } = await supabase
    .from("projects")
    .update({ description: testDescription })
    .eq("id", projectId)
    .select("id, title, description")
    .single();

  if (updateError) {
    console.error("Update failed:", updateError.message);
    process.exit(1);
  }

  console.log("Direct DB update successful!");
  console.log("Returned row description:");
  console.log(JSON.stringify(updateData.description, null, 2));

  console.log("\nReading the row back in a separate query to be absolutely sure...");
  const { data: readData, error: readError } = await supabase
    .from("projects")
    .select("id, title, description")
    .eq("id", projectId)
    .single();

  if (readError) {
    console.error("Read failed:", readError.message);
    process.exit(1);
  }

  console.log("Read row description from separate query:");
  console.log(JSON.stringify(readData.description, null, 2));
}

testDatabaseAttributes().catch(console.error);
