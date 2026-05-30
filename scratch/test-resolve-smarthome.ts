import { resolveProductPath } from "../modules/catalog/application/resolveProductPath";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function verify() {
  console.log("Resolving slug 'smarthome'...");
  const result = await resolveProductPath("smarthome");
  if (result) {
    console.log("Resolution success! Type:", result.type);
    console.log("Entity data:", {
      id: result.data.id,
      name: (result.data as { name: string }).name,
      slug: (result.data as { slug: string }).slug,
    });
  } else {
    console.error("Resolution failed! Returned null.");
  }
}

verify();
