import { Footer } from "@/components/user/footer";
import { Header } from "@/components/user/header";
import { generateSchema, SEO_CONFIG } from "@/lib/seo";
import { createStaticClient } from "@/lib/supabase/static";
import { type Metadata } from "next";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const metadata: Metadata = {
  description: SEO_CONFIG.defaultDescription,
};

export default async function PublicLayout({ children }: PublicLayoutProps) {
  const supabase = createStaticClient();

  // 1. Fetch all essential data for Schema & Footer
  const [
    { data: settings },
    { data: contacts },
    { data: branches },
    { data: projects },
    { data: pages }
  ] = await Promise.all([
    supabase.from("settings").select("*").maybeSingle(),
    supabase.from("contacts").select("*"),
    supabase.from("branches").select("*"),
    supabase.from("projects").select("id, title, slug, categories(slug)").eq("is_published", true).limit(5),
    supabase.from("pages").select("id, title, slug").eq("is_published", true)
  ]);

  // 2. Generate Organization Schema
  const schema = generateSchema("Organization", {}, {
    settings: settings || {},
    contacts: contacts || [],
    branches: branches || []
  });

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      {/* JSON-LD Organization Schema */}
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      <Header />
      <div className="flex-1">{children}</div>
      <Footer 
        branches={branches || []}
        projects={projects || []}
        pages={pages || []}
        settings={settings || {}}
        contacts={contacts || []}
      />
    </div>
  );
}
