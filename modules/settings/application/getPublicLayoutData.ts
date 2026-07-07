import { cacheLife, cacheTag } from "next/cache";
import { getSiteSettingsAction } from "@/modules/settings/presentation/actions";
import { getPagesAction } from "@/modules/page/presentation/actions";
import { getContactsAction } from "@/modules/contact/presentation/actions";
import { getBranchesAction } from "@/modules/branch/presentation/actions";
import { getProjectsAction } from "@/modules/project/presentation/actions";
import { getGroupsAction } from "@/modules/group/presentation/actions";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { getBrandsAction } from "@/modules/brand/presentation/actions";
import { getProjectTypesAction } from "@/modules/project-type/presentation/actions";
import { getProductsAction } from "@/modules/catalog/presentation/actions";

export async function getPublicLayoutData() {
  "use cache";
  cacheTag("layout");

  const [
    settingsResult,
    contactsResult,
    branchesResult,
    projectsResult,
    pagesResult,
    groupsResult,
    catsResult,
    brandsResult,
    projectTypesResult,
    productFacetsResult,
  ] = await Promise.allSettled([
    getSiteSettingsAction(),
    getContactsAction(),
    getBranchesAction({ isPublished: true }),
    getProjectsAction({ isPublished: true, limit: 40 }),
    getPagesAction(),
    getGroupsAction(),
    getCategoriesAction(),
    getBrandsAction(),
    getProjectTypesAction(),
    getProductsAction({ isPublished: true, limit: 1 }),
  ]);

  // Ham nay gop nhieu action Go doc lap cho 1 cache dung chung cho toan bo
  // layout (header/footer/sticky button) -- neu throw thang khi 1 nguon loi
  // se lam sap ca site. Nen giu graceful-degrade: nguon nao loi thi tra ve
  // rong cho phan do, nhung PHAI danh dau lai de quyet dinh cacheLife dung
  // (retry nhanh khi co loi that, khong phai "days" nhu the moi thu deu binh
  // thuong) -- neu khong se dong bang trang thai loi ca ngay.
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
  const brandsData = brandsResult.status === "fulfilled" && !brandsResult.value.error
    ? brandsResult.value.data
    : (markError(), null);
  const projectTypesData = projectTypesResult.status === "fulfilled" && !projectTypesResult.value.error
    ? projectTypesResult.value.data
    : (markError(), null);
  const productFacets = productFacetsResult.status === "fulfilled" && !productFacetsResult.value.error
    ? productFacetsResult.value.facets
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
      .map((c) => ({ id: c.id, name: c.name, slug: c.slug || "", parent_id: c.groupId })),
  ];

  const brandsWithProducts = new Set((productFacets?.brands || []).map((b) => b.id));
  const brands = (brandsData || [])
    .filter((b) => !b.name.toLowerCase().includes("chưa phân loại") && brandsWithProducts.has(b.id))
    .map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug || "",
      logoUrl: b.logoUrl || "",
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
      groupId: c.groupId,
    }));

  const settings: Record<string, string> = {};
  settingsData?.forEach((item) => {
    settings[item.key] = item.value || "";
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

  const minPrice = productFacets?.minPrice || 0;
  const maxPrice = productFacets?.maxPrice || 0;

  const priceRange =
    minPrice && maxPrice
      ? `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`
      : "10.000.000đ - 100.000.000đ";

  const mappedProjects = (projects || []).map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    projectTypeId: p.projectTypeId,
    projectTypeName: p.projectType?.name ?? null,
    projectTypeSlug: p.projectType?.slug ?? null,
  }));

  const projectTypes = (projectTypesData || []).map((st) => ({
    id: st.id,
    name: st.name,
    slug: st.slug || "",
  }));

  return {
    settings,
    contacts: (contacts || []).filter((c) => c.isActive),
    branches: branches || [],
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
