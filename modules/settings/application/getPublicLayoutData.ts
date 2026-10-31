import { getPagesAction } from "@/modules/page/presentation/actions";
import { getContactsAction } from "@/modules/contact/presentation/actions";
import { getBranchesAction } from "@/modules/branch/presentation/actions";
import { getGroupsAction } from "@/modules/group/presentation/actions";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { getBrandsAction } from "@/modules/brand/presentation/actions";
import { getProjectTypesAction } from "@/modules/project-type/presentation/actions";
import { unstable_cache } from "next/cache";
import { getProjectsAction } from "@/modules/project/presentation/actions";
import { getServicesAction } from "@/modules/service/presentation/actions";
import { getServiceGroupsAction } from "@/modules/service-group/presentation/actions";

// Slugs of the project types that have more than one published project,
// most projects first. Feeds the footer's "Loại hình công trình" column so it
// never links to an empty or single-project page. The full project list is
// ~1MB, so it is cached for 5 minutes under the "projects" tag (revalidated by
// the project mutation actions); failures throw so they are never cached.
const getProjectTypeSlugsWithProjects = unstable_cache(
  async (): Promise<string[]> => {
    const res = await getProjectsAction({ isPublished: true, limit: 2000 });
    if (res.error) throw new Error(res.error);
    const counts = new Map<string, number>();
    for (const project of res.data) {
      const slug = project.projectType?.slug;
      if (slug) counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
    return [...counts]
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .map(([slug]) => slug);
  },
  ["layout-project-type-slugs-with-projects"],
  { revalidate: 300, tags: ["projects"] },
);

export async function getPublicLayoutData() {
  const [
    contactsResult,
    branchesResult,
    pagesResult,
    groupsResult,
    catsResult,
    brandsResult,
    projectTypesResult,
    projectTypeSlugsResult,
    servicesResult,
    serviceGroupsResult,
  ] = await Promise.allSettled([
    getContactsAction(),
    getBranchesAction({ isPublished: true }),
    getPagesAction(),
    getGroupsAction(),
    getCategoriesAction(),
    getBrandsAction(),
    getProjectTypesAction(),
    getProjectTypeSlugsWithProjects(),
    getServicesAction({ isPublished: true }),
    getServiceGroupsAction(),
  ]);

  const contacts = contactsResult.status === "fulfilled" && !contactsResult.value.error
    ? contactsResult.value.data
    : null;
  const branches = branchesResult.status === "fulfilled" && !branchesResult.value.error
    ? branchesResult.value.data
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

  const projectTypeBySlug = new Map((projectTypesData || []).map((st) => [st.slug || "", st]));
  const projectTypeSlugs = projectTypeSlugsResult.status === "fulfilled" ? projectTypeSlugsResult.value : [];
  const projectTypesWithProjects = projectTypeSlugs.flatMap((slug) => {
    const st = projectTypeBySlug.get(slug);
    return st ? [{ id: st.id, name: st.name, slug }] : [];
  });

  const projectTypes = (projectTypesData || []).map((st) => ({
    id: st.id,
    name: st.name,
    slug: st.slug || "",
  }));

  return {
    contacts: (contacts || []).filter((c) => c.isActive),
    branches: branches || [],
    pages: pages || [],
    categories: categories || [],
    brands: brands || [],
    groupCategories: groupCategories || [],
    categoriesList: categoriesList || [],
    projectTypes,
    projectTypesWithProjects,
    services,
    currentYear: new Date().getFullYear(),
  };
}
