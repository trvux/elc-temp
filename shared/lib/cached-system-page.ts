import { getSystemPageBySlugAction } from "@/modules/system-page/presentation/actions";
import { cacheLife } from "next/cache";
import { SystemPage } from "@/modules/system-page/domain";

export async function getCachedSystemPage(slug: string): Promise<SystemPage | null> {
  "use cache";
  cacheLife("days");
  const { data } = await getSystemPageBySlugAction(slug);
  return data;
}
