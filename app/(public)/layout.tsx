import { getPublicLayoutData } from "@/modules/settings";
import { Footer } from "@/shared/components/layout/user/footer";
import { Header } from "@/shared/components/layout/user/header";
import { ChunkErrorListener } from "@/shared/components/layout/user/chunk-error-listener";
import { FilterTransitionProvider } from "@/shared/providers/filter-transition-provider";
import { TopProgressBar } from "@/shared/components/layout/user/top-progress-bar";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default async function PublicLayout({ children }: PublicLayoutProps) {
  const {
    settings,
    contacts,
    branches,
    projects,
    pages,
    categories,
    brands,
    groupCategories,
    categoriesList,
    projectTypes,
    currentYear,
  } = await getPublicLayoutData();

  return (
    <FilterTransitionProvider>
      <TopProgressBar />
      <div className="flex flex-col min-h-screen">
        <ChunkErrorListener />
        <Header contacts={contacts} />
        <div className="flex-1 ">{children}</div>
        <Footer
          branches={branches}
          projects={projects}
          pages={pages}
          settings={settings}
          contacts={contacts}
          categories={categories}
          brands={brands}
          groupCategories={groupCategories}
          categoriesList={categoriesList}
          projectTypes={projectTypes}
          currentYear={currentYear}
        />
      </div>
    </FilterTransitionProvider>
  );
}
