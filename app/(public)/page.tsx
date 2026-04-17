import { createClient } from "@/lib/supabase/server";
import { HeroSection } from "@/components/sections/hero";
import { BrandShowcase } from "@/components/sections/brand-showcase";
import { FeaturesSection } from "@/components/sections/features";
import { ShowcaseSection } from "@/components/sections/showcase";
import { CTASection } from "@/components/sections/cta";
import { Separator } from "@/components/ui/separator";
import { generateSchema } from "@/lib/seo";

export const revalidate = 3600;

export default async function Home() {
  const supabase = await createClient();

  // Fetch all necessary data for the homepage
  const [
    { data: settingsData },
    { data: projects },
    { data: featuredProducts },
    { data: contacts },
  ] = await Promise.all([
    supabase.from("site_settings").select("*"),
    supabase
      .from("projects")
      .select("*, categories(name, slug, parent:parent_id(name, slug))")
      .eq("is_published", true)
      .order("order_index", { ascending: true })
      .limit(5),
    supabase
      .from("products")
      .select("*, categories(name, slug, parent:parent_id(name, slug))")
      .eq("is_published", true)
      .eq("is_featured", true)
      .order("order_index", { ascending: true })
      .limit(6),
    supabase
      .from("contacts")
      .select("*")
      .order("order_index", { ascending: true }),
  ]);

  // Convert settings array to a more usable object
  const settings: Record<string, string> = {};
  settingsData?.forEach((item) => {
    settings[item.key] = item.value;
  });

  const schema = generateSchema("WebSite", {});

  return (
    <main className="px-4 md:px-6 lg:px-8 space-y-16 md:space-y-24">
      {/* JSON-LD for Website */}
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      {/* 1. HERO SECTION */}

      <HeroSection
        title={settings.hero_title}
        subtitle={settings.hero_subtitle}
        ctaText={settings.hero_cta_text}
        ctaUrl={settings.hero_cta_url}
        image={settings.hero_image}
        contacts={contacts || []}
      />
      <Separator />

      <BrandShowcase />
      <Separator />

      {/* 2. SHOWCASE SECTION (Projects) */}

      <ShowcaseSection projects={projects || []} />
      <Separator />

      {/* 3. PRODUCTS SECTION (Features)  */}

      <FeaturesSection products={featuredProducts || []} />
      <Separator />

      {/* 4. CTA SECTION - */}

      <CTASection settings={settings} contacts={contacts || []} />
      <Separator />
    </main>
  );
}
