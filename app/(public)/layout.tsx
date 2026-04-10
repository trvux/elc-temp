import type { Metadata } from "next";
import { Header } from "@/components/user/header";
import { Footer } from "@/components/user/footer";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      <Header />
      <main className="flex-1">{children}</main>
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
