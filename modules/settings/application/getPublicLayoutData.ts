import { createStaticClient } from "@/shared/lib/supabase/static";
import { contactRepo } from "@/modules/contact/infrastructure";
import { mapContactRowToDomain } from "@/modules/contact/domain";

export async function getPublicLayoutData() {
  const supabase = createStaticClient();

  const [
    { data: settingsData },
    { data: contacts },
    { data: branches },
    { data: projects },
    { data: pages },
    { data: categories },
    { data: minPriceProd },
    { data: maxPriceProd }
  ] = await Promise.all([
    supabase.from("site_settings").select("*"),
    supabase.from("contacts").select("*").eq("is_active", true).order("order_index", { ascending: true }),
    supabase.from("branches").select("*").is("deleted_at", null),
    supabase.from("projects").select("id, title, slug").eq("is_published", true).is("deleted_at", null).limit(5),
    supabase.from("pages").select("id, title, slug").eq("is_published", true).is("deleted_at", null),
    supabase.from("categories")
      .select("id, name, slug, parent_id")
      .eq("type", "product")
      .is("deleted_at", null)
      .not("name", "ilike", "%chưa phân loại%")
      .not("name", "ilike", "%test%")
      .order("name", { ascending: true }),
    supabase.from("products").select("price").eq("is_published", true).is("deleted_at", null).gt("price", 0).order("price", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("products").select("price").eq("is_published", true).is("deleted_at", null).gt("price", 0).order("price", { ascending: false }).limit(1).maybeSingle()
  ]);

  const settings: Record<string, string> = {};
  settingsData?.forEach((item) => {
    settings[item.key] = item.value || "";
  });

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  
  const priceRange = minPriceProd && maxPriceProd 
    ? `${formatCurrency(minPriceProd.price)} - ${formatCurrency(maxPriceProd.price)}`
    : "10.000.000đ - 100.000.000đ";

  return {
    settings,
    contacts: (contacts || []).map(mapContactRowToDomain),
    branches: branches || [],
    projects: projects || [],
    pages: pages || [],
    categories: categories || [],
    priceRange
  };
}
