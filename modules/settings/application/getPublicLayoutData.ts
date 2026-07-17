import { getSiteSettingsAction } from "@/modules/settings/presentation/actions";
import { getPagesAction } from "@/modules/page/presentation/actions";
import { getContactsAction } from "@/modules/contact/presentation/actions";
import { getBranchesAction } from "@/modules/branch/presentation/actions";
import { getProjectsAction } from "@/modules/project/presentation/actions";
import { getGroupsAction } from "@/modules/group/presentation/actions";
import { getCategoriesAction } from "@/modules/category/presentation/actions";
import { getBrandsAction } from "@/modules/brand/presentation/actions";
import { getProjectTypesAction } from "@/modules/project-type/presentation/actions";

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
  const projectTypesData = projectTypesResult.status === "fulfilled" && !projectTypesResult.value.error
    ? projectTypesResult.value.data
    : null;

  const categories = [
    ...(groupsData || [])
      .filter((g) => !g.name.toLowerCase().includes("chưa phân loại"))
      .map((g) => ({ id: g.id, name: g.name, slug: g.slug || "", parent_id: null })),
    ...(catsData || [])
      .filter((c) => !c.name.toLowerCase().includes("chưa phân loại"))
      .map((c) => ({ id: c.id, name: c.name, slug: c.slug || "", parent_id: c.groupId })),
  ];

  const brands = (brandsData || [])
    .filter((b) => !b.name.toLowerCase().includes("chưa phân loại"))
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

  const priceRange = "10.000.000đ - 100.000.000đ";

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
