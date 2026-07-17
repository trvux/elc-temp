import { getSystemPageBySlugAction } from "@/modules/system-page/presentation/actions";
import { SystemPage } from "@/modules/system-page/domain";

export async function getCachedSystemPage(slug: string): Promise<SystemPage | null> {
  const { data } = await getSystemPageBySlugAction(slug);
  return data;
}
