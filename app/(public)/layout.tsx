import { getPublicLayoutData } from "@/modules/settings";
import { Footer } from "@/shared/components/layout/user/footer";
import { Header } from "@/shared/components/layout/user/header";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default async function PublicLayout({ children }: PublicLayoutProps) {
  const { settings, contacts, branches, projects, pages, categories } =
    await getPublicLayoutData();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <div className="flex-1">{children}</div>
      <Footer
        branches={branches}
        projects={projects}
        pages={pages}
        settings={settings}
        contacts={contacts}
        categories={categories}
      />
    </div>
  );
}
