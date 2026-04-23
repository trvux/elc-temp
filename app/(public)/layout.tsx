import { Footer } from "@/components/user/footer";
import { Header } from "@/components/user/header";
import { createClient } from "@/lib/supabase/server";
import { generateSchema } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Điện máy ELC",
  description: "Điện máy ELC",
};

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let branches: any[] = [];
  let projects: any[] = [];
  let pages: any[] = [];
  let contacts: any[] = [];
  const settings: Record<string, string> = {};
  let webSiteSchema: any = null;
  let orgSchema: any = null;

  try {
    const supabase = await createClient();

    // Parallel fetch for footer data
    const [
      { data: bData },
      { data: pData },
      { data: pgData },
      { data: settingsData },
      { data: cData },
    ] = await Promise.all([
      supabase
        .from("branches")
        .select("name, slug, is_published")
        .eq("is_published", true)
        .order("order_index"),
      supabase
        .from("projects")
        .select("title, id, slug, categories(slug)")
        .eq("is_published", true)
        .limit(10),
      supabase
        .from("pages")
        .select("title, slug")
        .eq("is_published", true)
        .limit(20),
      supabase.from("site_settings").select("*"),
      supabase.from("contacts").select("*").order("order_index"),
    ]);

    branches = bData || [];
    projects = pData || [];
    pages = pgData || [];
    contacts = cData || [];
    
    settingsData?.forEach((item) => {
      settings[item.key] = item.value;
    });

    // Prepare schemas for SEO
    webSiteSchema = generateSchema(
      "WebSite",
      {},
      { settings, contacts: contacts || [] }
    );
    orgSchema = generateSchema(
      "Organization",
      {},
      { settings, contacts: contacts || [] }
    );
  } catch (error) {
    console.error("Critical: PublicLayout failed to fetch data:", error);
    // Vẫn tiếp tục render với mảng rỗng thay vì crash trang
  }

  return (
    <div className="grid grid-cols-1 gap-4 bg-cream">
      {/* Global SEO Schemas */}
      {webSiteSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
      )}
      {orgSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      )}
      <Header />
      <main className="">{children}</main>
      <Footer
        branches={branches}
        projects={projects}
        pages={pages}
        settings={settings}
        contacts={contacts}
      />
    </div>
  );
}
