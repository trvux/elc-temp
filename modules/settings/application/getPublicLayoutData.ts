import { createStaticClient } from "@/shared/lib/supabase/static";
import { getContactHref } from "@/modules/contact";
import { cacheLife, cacheTag } from "next/cache";
import { Branch } from "@/modules/branch/domain";
import { getSiteSettingsAction } from "@/modules/settings/presentation/actions";
import { getPagesAction } from "@/modules/page/presentation/actions";

export async function getPublicLayoutData() {
  "use cache";
  cacheTag("layout");
  
  const supabase = createStaticClient();

  const [
    settingsResult,
    contactsResult,
    branchesResult,
    projectsResult,
    pagesResult,
    groupsResult,
    catsResult,
    minPriceResult,
    maxPriceResult,
    brandsResult,
    projectTypesResult,
  ] = await Promise.allSettled([
    getSiteSettingsAction(),
    supabase
      .from("contacts")
      .select("*")
      .eq("is_active", true)
      .order("order_index", { ascending: true }),
    supabase
      .from("branches")
      .select("*")
      .eq("is_published", true)
      .is("deleted_at", null),
    supabase
      .from("projects")
      .select("id, title, slug, project_type_id, project_type(id, name, slug)")
      .eq("is_published", true)
      .is("deleted_at", null)
      .limit(40),
    getPagesAction(),
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
      .select("sale_price, original_price")
      .eq("is_published", true)
      .is("deleted_at", null)
      .gt("sale_price", 0)
      .order("sale_price", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("products")
      .select("sale_price, original_price")
      .eq("is_published", true)
      .is("deleted_at", null)
      .gt("sale_price", 0)
      .order("sale_price", { ascending: false })
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
      .from("project_type")
      .select("id, name, slug")
      .is("deleted_at", null)
      .order("order_index", { ascending: true }),
  ]);

  // Ham nay gop nhieu nguon doc lap (Go API + nhieu bang Supabase) cho 1 cache
  // dung chung cho toan bo layout (header/footer/sticky button) -- neu throw
  // thang khi 1 nguon loi se lam sap ca site. Nen giu graceful-degrade: nguon
  // nao loi thi tra ve rong cho phan do, nhung PHAI danh dau lai de quyet dinh
  // cacheLife dung (retry nhanh khi co loi that, khong phai "days" nhu the
  // moi thu deu binh thuong) -- neu khong se dong bang trang thai loi ca ngay.
  let hadError = false;
  const markError = () => {
    hadError = true;
  };

  const settingsData = settingsResult.status === "fulfilled" && !settingsResult.value.error
    ? settingsResult.value.data
    : (markError(), null);
  const contacts = contactsResult.status === "fulfilled" && !contactsResult.value.error
    ? contactsResult.value.data
    : (markError(), null);
  const branches = branchesResult.status === "fulfilled" && !branchesResult.value.error
    ? branchesResult.value.data
    : (markError(), null);
  const projects = projectsResult.status === "fulfilled" && !projectsResult.value.error
    ? projectsResult.value.data
    : (markError(), null);
  const pages = pagesResult.status === "fulfilled" && !pagesResult.value.error
    ? pagesResult.value.data
    : (markError(), null);
  const groupsData = groupsResult.status === "fulfilled" && !groupsResult.value.error
    ? groupsResult.value.data
    : (markError(), null);
  const catsData = catsResult.status === "fulfilled" && !catsResult.value.error
    ? catsResult.value.data
    : (markError(), null);
  const minPriceProd = minPriceResult.status === "fulfilled" && !minPriceResult.value.error
    ? minPriceResult.value.data
    : (markError(), null);
  const maxPriceProd = maxPriceResult.status === "fulfilled" && !maxPriceResult.value.error
    ? maxPriceResult.value.data
    : (markError(), null);
  const brandsData = brandsResult.status === "fulfilled" && !brandsResult.value.error
    ? brandsResult.value.data
    : (markError(), null);
  const projectTypesData = projectTypesResult.status === "fulfilled" && !projectTypesResult.value.error
    ? projectTypesResult.value.data
    : (markError(), null);

  if (hadError) {
    cacheLife("retry");
  } else {
    cacheLife("days");
  }

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

  const minPrice = minPriceProd ? (minPriceProd.sale_price || minPriceProd.original_price || 0) : 0;
  const maxPrice = maxPriceProd ? (maxPriceProd.sale_price || maxPriceProd.original_price || 0) : 0;

  const priceRange =
    minPrice && maxPrice
      ? `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`
      : "10.000.000đ - 100.000.000đ";

  const mappedProjects = (projects || []).map((p) => {
    const rawSt = p.project_type;
    const st = (Array.isArray(rawSt) ? rawSt[0] : rawSt) as { id: string; name: string; slug: string } | null;
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      projectTypeId: p.project_type_id as string | null,
      projectTypeName: st?.name ?? null,
      projectTypeSlug: st?.slug ?? null,
    };
  });

  const projectTypes = (projectTypesData || []).map((st) => ({
    id: st.id,
    name: st.name,
    slug: st.slug || "",
  }));

  const mappedBranches: Branch[] = (branches || []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug || "",
    address: row.address || "",
    phone: row.phone || "",
    email: row.email || "",
    mapsUrl: row.maps_url || "",
    mapsEmbed: row.maps_embed || "",
    description: row.description || null,
    imageUrl: row.image_url || null,
    isPublished: row.is_published ?? false,
    metaTitle: row.meta_title || null,
    metaDescription: row.meta_description || null,
    orderIndex: row.order_index ?? 0,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    deletedAt: null,
  }));

  return {
    settings,
    contacts: (contacts || []).map((row) => {
      const href = getContactHref(row.type || "", row.value || "");
      return {
        id: row.id,
        type: row.type || "",
        label: row.label || null,
        value: row.value || "",
        isActive: row.is_active ?? true,
        orderIndex: row.order_index || 0,
        href,
        isExternal: !href.startsWith("tel:") && !href.startsWith("mailto:"),
      };
    }),
    branches: mappedBranches,
    projects: mappedProjects,
    pages: pages || [],
    categories: categories || [],
    brands: brands || [],
    groupCategories: groupCategories || [],
    categoriesList: categoriesList || [],
    projectTypes,
    priceRange,
    currentYear: new Date().getFullYear(),
  };
}
