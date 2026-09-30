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
import { PRODUCT_STATUS } from "@/modules/catalog/domain";

export async function getPublicLayoutData() {
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
    // limit: 1 — only here for facets.brands (per-brand published-product
    // counts, computed server-side in one query), not the products array
    // itself. Lets hasOfferCatalog (below) list only brands that actually
    // have something for sale, the same "0 products -> excluded" rule
    // already applied to brand pages going noindex and to sitemap.
    getProductsAction({ status: PRODUCT_STATUS.PUBLISHED, limit: 1 }),
  ]);

  const settingsData = settingsResult.status === "fulfilled" && !settingsResult.value.error
    ? settingsResult.value.data
    : null;
  const contacts = contactsResult.status === "fulfilled" && !contactsResult.value.error
    ? contactsResult.value.data
    : null;
  const branches = branchesResult.status === "fulfilled" && !branchesResult.value.error
    ? branchesResult.value.data
    : null;
  const projects = projectsResult.status === "fulfilled" && !projectsResult.value.error
    ? projectsResult.value.data
    : null;
  const pages = pagesResult.status === "fulfilled" && !pagesResult.value.error
    ? pagesResult.value.data
    : null;
  const groupsData = groupsResult.status === "fulfilled" && !groupsResult.value.error
    ? groupsResult.value.data
    : null;
  const catsData = catsResult.status === "fulfilled" && !catsResult.value.error
    ? catsResult.value.data
    : null;
  const brandsData = brandsResult.status === "fulfilled" && !brandsResult.value.error
    ? brandsResult.value.data
    : null;
  const brandFacets = productFacetsResult.status === "fulfilled" && !productFacetsResult.value.error
    ? productFacetsResult.value.facets.brands
    : [];
  const brandIdsWithProducts = new Set(brandFacets.filter((b) => b.count > 0).map((b) => b.id));
  const projectTypesData = projectTypesResult.status === "fulfilled" && !projectTypesResult.value.error
    ? projectTypesResult.value.data
    : null;

  const categories = [
    ...(groupsData || [])
      .filter((g) => !g.isHidden)
      .map((g) => ({ id: g.id, name: g.name, slug: g.slug || "", parent_id: null })),
    ...(catsData || [])
      .filter((c) => !c.isHidden)
      .map((c) => ({ id: c.id, name: c.name, slug: c.slug || "", parent_id: c.groupId })),
  ];

  const brands = (brandsData || [])
    .filter((b) => !b.name.toLowerCase().includes("chưa phân loại"))
    .map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug || "",
      logoUrl: b.logoUrl || "",
      isFeatured: b.isFeatured ?? false,
      orderIndex: b.orderIndex ?? 0,
    }));

  // Separate from `brands` above (which the header nav uses as-is) — this
  // is specifically for hasOfferCatalog, where listing a brand with zero
  // real products would repeat the exact "claims a brand ELC doesn't
  // actually carry" bug found and fixed across meta_description/content
  // this same audit. isFeatured does NOT reliably track this (checked:
  // Panasonic/Mitsubishi/Hagisu are all isFeatured=true with 0 products) —
  // only a real product count does.
  const brandsWithProducts = brands.filter((b) => brandIdsWithProducts.has(b.id));

  const groupCategories = (groupsData || [])
    .filter((g) => !g.isHidden)
    .map((g) => ({ id: g.id, name: g.name, slug: g.slug || "" }));

  const categoriesList = (catsData || [])
    .filter((c) => !c.isHidden)
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug || "",
      groupId: c.groupId,
      imageUrl: c.imageUrl,
    }));

  const settings: Record<string, string> = {};
  settingsData?.forEach((item) => {
    settings[item.key] = item.value || "";
  });

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
    brandsWithProducts,
    groupCategories: groupCategories || [],
    categoriesList: categoriesList || [],
    projectTypes,
    currentYear: new Date().getFullYear(),
  };
}
