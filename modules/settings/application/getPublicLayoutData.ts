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
    { data: groupsData },
    { data: catsData },
    { data: minPriceProd },
    { data: maxPriceProd },
    { data: brandsData }
  ] = await Promise.all([
    supabase.from("site_settings").select("*"),
    supabase.from("contacts").select("*").eq("is_active", true).order("order_index", { ascending: true }),
    supabase.from("branches").select("*").is("deleted_at", null),
    supabase.from("projects").select("id, title, slug").eq("is_published", true).is("deleted_at", null).limit(5),
    supabase.from("pages").select("id, title, slug").eq("is_published", true).is("deleted_at", null),
    supabase.from("group_categories").select("id, name, slug").is("deleted_at", null).order("name", { ascending: true }),
    supabase.from("categories").select("id, name, slug, group_id").is("deleted_at", null).order("name", { ascending: true }),
    supabase.from("products").select("price").eq("is_published", true).is("deleted_at", null).gt("price", 0).order("price", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("products").select("price").eq("is_published", true).is("deleted_at", null).gt("price", 0).order("price", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("brands").select("id, name, slug").is("deleted_at", null).order("name", { ascending: true })
  ]);

  const categories = [
    ...(groupsData || [])
      .filter(g => !g.name.toLowerCase().includes("chưa phân loại"))
      .map(g => ({ id: g.id, name: g.name, slug: g.slug || "", parent_id: null })),
    ...(catsData || [])
      .filter(c => !c.name.toLowerCase().includes("chưa phân loại"))
      .map(c => ({ id: c.id, name: c.name, slug: c.slug || "", parent_id: c.group_id }))
  ];

  const brands = (brandsData || [])
    .filter(b => !b.name.toLowerCase().includes("chưa phân loại"))
    .map(b => ({ id: b.id, name: b.name, slug: b.slug || "" }));

  const groupCategories = (groupsData || [])
    .filter(g => !g.name.toLowerCase().includes("chưa phân loại"))
    .map(g => ({ id: g.id, name: g.name, slug: g.slug || "" }));

  const categoriesList = (catsData || [])
    .filter(c => !c.name.toLowerCase().includes("chưa phân loại"))
    .map(c => ({ id: c.id, name: c.name, slug: c.slug || "" }));

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
    brands: brands || [],
    groupCategories: groupCategories || [],
    categoriesList: categoriesList || [],
    priceRange
  };
}
