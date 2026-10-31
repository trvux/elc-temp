import { getPagesAction } from "@/modules/page/presentation/actions";
import { getContactsAction } from "@/modules/contact/presentation/actions";
import { getBranchesAction } from "@/modules/branch/presentation/actions";
import { getProjectsAction } from "@/modules/project/presentation/actions";
import { getGroupsAction } from "@/modules/group/presentation/actions";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { getBrandsAction } from "@/modules/brand/presentation/actions";
import { getProjectTypesAction } from "@/modules/project-type/presentation/actions";
import { unstable_cache } from "next/cache";
import { getProductsAction } from "@/modules/catalog/presentation/actions";
import { PRODUCT_STATUS } from "@/modules/catalog/domain";
import { getServicesAction } from "@/modules/service/presentation/actions";
import { getServiceGroupsAction } from "@/modules/service-group/presentation/actions";
import { getHpPagesAction } from "@/modules/hp-page/presentation/actions";

// Which brands have at least one published product — only feeds the
// Organization JSON-LD's hasOfferCatalog. It was the slowest call the layout
// makes (~100ms server-side to compute facets, 10x any other) on every single
// request, for a number that changes only when a product is published or
// unpublished. Cached for 5 minutes under the "products" tag, which the
// product mutation actions already revalidate, so edits still show up at once.
// Throws on failure so a transient API error is never cached.
const getBrandIdsWithProducts = unstable_cache(
  async (): Promise<string[]> => {
    const res = await getProductsAction({ status: PRODUCT_STATUS.PUBLISHED, limit: 1 });
    if (res.error) throw new Error(res.error);
    return res.facets.brands.filter((b) => b.count > 0).map((b) => b.id);
  },
  ["layout-brand-ids-with-products"],
  { revalidate: 300, tags: ["products"] },
);

export async function getPublicLayoutData() {
  const [
    contactsResult,
    branchesResult,
    projectsResult,
    pagesResult,
    groupsResult,
    catsResult,
    brandsResult,
    projectTypesResult,
    brandIdsResult,
    hpPagesResult,
    servicesResult,
    serviceGroupsResult,
  ] = await Promise.allSettled([
    getContactsAction(),
    getBranchesAction({ isPublished: true }),
    getProjectsAction({ isPublished: true, limit: 40 }),
    getPagesAction(),
    getGroupsAction(),
    getCategoriesAction(),
    getBrandsAction(),
    getProjectTypesAction(),
    // Lets hasOfferCatalog (below) list only brands that actually have
    // something for sale, the same "0 products -> excluded" rule already
    // applied to brand pages going noindex and to sitemap.
    getBrandIdsWithProducts(),
    // No options -> Go API's default already excludes soft-deleted rows
    // (includeDeleted only set via include_deleted=true, never passed here)
    // — the dead 6HP/10HP hp_pages from earlier this session are already
    // gone at this layer, no extra per-page product-count check needed.
    getHpPagesAction(),
    getServicesAction({ isPublished: true }),
    getServiceGroupsAction(),
  ]);

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
  const brandIdsWithProducts = new Set(brandIdsResult.status === "fulfilled" ? brandIdsResult.value : []);
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

  // HP-tier landing pages are a real, distinct search-intent cross-cut ("máy
  // lạnh 1hp", "máy lạnh Daikin 2hp") — same class of thing as brand, not a
  // redundant view of category. getHpPagesAction() with no options already
  // excludes soft-deleted rows (see call site), so this list is real by
  // construction — no separate product-count check needed here the way
  // brand needed one.
  const hpPagesData = hpPagesResult.status === "fulfilled" && !hpPagesResult.value.error
    ? hpPagesResult.value.data
    : null;
  const hpPagesForCatalog = (hpPagesData || []).map((hp) => ({
    id: hp.id,
    name: hp.name,
    slug: hp.slug || "",
  }));

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

  const servicesData = servicesResult.status === "fulfilled" && !servicesResult.value.error
    ? servicesResult.value.data
    : null;
  const serviceGroupsData = serviceGroupsResult.status === "fulfilled" && !serviceGroupsResult.value.error
    ? serviceGroupsResult.value.data
    : null;
  // One nav entry per service group (short name, like apple.com's flyouts).
  // A group with a single published service links straight to it; a group
  // with several links to its own landing page (/dich-vu/{group.slug}, see
  // getServiceGroupPageAction). Groups with no published service are dropped.
  const services = (serviceGroupsData || [])
    .slice()
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .flatMap((g) => {
      const inGroup = (servicesData || []).filter((s) => s.groupId === g.id);
      if (inGroup.length === 0) return [];
      return [{
        id: g.id,
        name: g.name.replace(/\s+/g, " ").trim(),
        href: inGroup.length === 1 ? `/dich-vu/${inGroup[0].slug}` : `/dich-vu/${g.slug}`,
      }];
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
    contacts: (contacts || []).filter((c) => c.isActive),
    branches: branches || [],
    projects: mappedProjects,
    pages: pages || [],
    categories: categories || [],
    brands: brands || [],
    brandsWithProducts,
    hpPagesForCatalog,
    groupCategories: groupCategories || [],
    categoriesList: categoriesList || [],
    projectTypes,
    services,
    currentYear: new Date().getFullYear(),
  };
}
