import { z } from "zod";

try {
  console.log("z.iso type:", typeof (z as any).iso);
  if ((z as any).iso) {
    console.log("z.iso.datetime type:", typeof (z as any).iso.datetime);
  }
} catch (e) {
  console.log("z.iso check failed:", e);
}
