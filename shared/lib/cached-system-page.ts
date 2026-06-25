import { getSystemPageBySlug } from "@/modules/system-page/application";
import { systemPageRepo } from "@/modules/system-page/infrastructure/SupabaseSystemPageRepository";
import { setUseStaticClient } from "@/shared/lib/supabase/server";
import { cacheLife } from "next/cache";
import { SystemPage } from "@/modules/system-page/domain";

export async function getCachedSystemPage(slug: string): Promise<SystemPage | null> {
  "use cache";
  cacheLife("days");
  setUseStaticClient(true);
  return getSystemPageBySlug(systemPageRepo, slug);
}
