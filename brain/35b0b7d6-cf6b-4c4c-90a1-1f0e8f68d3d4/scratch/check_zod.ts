import { z } from "zod";

try {
  console.log("z.uuid type:", typeof (z as any).uuid);
  const schema = (z as any).uuid();
  console.log("z.uuid() created successfully");
} catch (e) {
  console.log("z.uuid() failed:", e);
}
