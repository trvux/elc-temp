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
  const supabase = await createClient();

  // Parallel fetch for footer data
  const [
    { data: branches },
    { data: projects },
    { data: pages },
    { data: settingsData },
    { data: contacts },
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

  const settings: Record<string, string> = {};
  settingsData?.forEach((item) => {
    settings[item.key] = item.value;
  });

  // Prepare schemas for SEO
  const webSiteSchema = generateSchema(
    "WebSite",
    {},
    { settings, contacts: contacts || [] }
  );
  const orgSchema = generateSchema(
    "Organization",
    {},
    { settings, contacts: contacts || [] }
  );

  return (
    <div className="grid grid-cols-1 gap-4 bg-cream">
      {/* Global SEO Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <Header />
      <main className="">{children}</main>
      <Footer
        branches={branches || []}
        projects={projects || []}
        pages={pages || []}
        settings={settings}
        contacts={contacts || []}
      />
    </div>
  );
}
