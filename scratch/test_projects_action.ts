import { projectRepo } from "../modules/project/infrastructure/projectRepo";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function testGetProjects() {
  console.log("Testing getProjects...");
  try {
    const data = await projectRepo.getAll();
    console.log("SUCCESS! Fetched projects count:", data.length);
    if (data.length > 0) {
      console.log("First project sample:", JSON.stringify(data[0], null, 2));
    }
  } catch (error) {
    console.error("FAILED to fetch projects:", error);
  }
}

testGetProjects();
