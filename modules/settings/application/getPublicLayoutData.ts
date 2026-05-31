import { createStaticClient } from "@/shared/lib/supabase/static";
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
    { data: brandsData },
    { data: serviceTypesData },
  ] = await Promise.all([
    supabase.from("site_settings").select("*"),
    supabase
      .from("contacts")
      .select("*")
      .eq("is_active", true)
      .order("order_index", { ascending: true }),
    supabase.from("branches").select("*").is("deleted_at", null),
    supabase
      .from("projects")
      .select("id, title, slug, service_type_id, service_type(id, name, slug)")
      .eq("is_published", true)
      .is("deleted_at", null)
      .limit(40),
    supabase
      .from("pages")
      .select("id, title, slug")
      .eq("is_published", true)
      .is("deleted_at", null),
    supabase
      .from("group_categories")
      .select("id, name, slug")
      .is("deleted_at", null)
      .order("name", { ascending: true }),
    supabase
      .from("categories")
      .select("id, name, slug, group_id")
      .is("deleted_at", null)
      .order("name", { ascending: true }),
    supabase
      .from("products")
      .select("price")
      .eq("is_published", true)
      .is("deleted_at", null)
      .gt("price", 0)
      .order("price", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("products")
      .select("price")
      .eq("is_published", true)
      .is("deleted_at", null)
      .gt("price", 0)
      .order("price", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("brands")
      .select("id, name, slug, logo_url, products!inner(id)")
      .is("deleted_at", null)
      .eq("products.is_published", true)
      .is("products.deleted_at", null)
      .order("name", { ascending: true }),
    supabase
      .from("service_type")
      .select("id, name, slug")
      .is("deleted_at", null)
      .order("order_index", { ascending: true }),
  ]);

  const categories = [
    ...(groupsData || [])
      .filter((g) => !g.name.toLowerCase().includes("chưa phân loại"))
      .map((g) => ({ id: g.id, name: g.name, slug: g.slug || "", parent_id: null })),
    ...(catsData || [])
      .filter((c) => !c.name.toLowerCase().includes("chưa phân loại"))
      .map((c) => ({ id: c.id, name: c.name, slug: c.slug || "", parent_id: c.group_id })),
  ];

  const brands = (brandsData || [])
    .filter((b) => !b.name.toLowerCase().includes("chưa phân loại"))
    .map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug || "",
      logoUrl: b.logo_url || "",
    }));

  const groupCategories = (groupsData || [])
    .filter((g) => !g.name.toLowerCase().includes("chưa phân loại"))
    .map((g) => ({ id: g.id, name: g.name, slug: g.slug || "" }));

  const categoriesList = (catsData || [])
    .filter((c) => !c.name.toLowerCase().includes("chưa phân loại"))
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug || "",
      groupId: c.group_id as string | null,
    }));

  const settings: Record<string, string> = {};
  settingsData?.forEach((item) => {
    settings[item.key] = item.value || "";
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

  const priceRange =
    minPriceProd && maxPriceProd
      ? `${formatCurrency(minPriceProd.price)} - ${formatCurrency(maxPriceProd.price)}`
      : "10.000.000đ - 100.000.000đ";

  const mappedProjects = (projects || []).map((p) => {
    const rawSt = p.service_type;
    const st = (Array.isArray(rawSt) ? rawSt[0] : rawSt) as { id: string; name: string; slug: string } | null;
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      serviceTypeId: p.service_type_id as string | null,
      serviceTypeName: st?.name ?? null,
      serviceTypeSlug: st?.slug ?? null,
    };
  });

  const serviceTypes = (serviceTypesData || []).map((st) => ({
    id: st.id,
    name: st.name,
    slug: st.slug || "",
  }));

  return {
    settings,
    contacts: (contacts || []).map(mapContactRowToDomain),
    branches: branches || [],
    projects: mappedProjects,
    pages: pages || [],
    categories: categories || [],
    brands: brands || [],
    groupCategories: groupCategories || [],
    categoriesList: categoriesList || [],
    serviceTypes,
    priceRange,
  };
}
