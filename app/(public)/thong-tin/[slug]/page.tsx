import { notFound } from "next/navigation";
import { setUseStaticClient } from "@/shared/lib/supabase/server";
import { cacheLife } from "next/cache";


export default async function Page() {
  "use cache";
  cacheLife("hours");
  setUseStaticClient(true);

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold">Thông tin</h1>
    </div>
  );
}
